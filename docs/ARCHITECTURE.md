# Arquitetura do Sistema

Documento descrevendo a arquitetura e decisões técnicas do ERP System.

## 📐 Visão Geral Arquitetural

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                        │
│                  (React + TypeScript)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           ↓
        ┌──────────────────────────────────────┐
        │    API Gateway (FastAPI + Uvicorn)   │
        │         (Port 8000)                  │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ↓                                     ↓
    ┌─────────────────┐              ┌──────────────────┐
    │  Auth Service   │              │  Business Logic  │
    │   (JWT/OAuth)   │              │   (Services)     │
    └────────┬────────┘              └────────┬─────────┘
             │                                │
             └────────────────┬───────────────┘
                              ↓
                    ┌──────────────────┐
                    │   Repositories   │
                    │  (Data Access)   │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │   SQLAlchemy     │
                    │  (ORM Layer)     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │    MySQL 8.0     │
                    │  (Persistence)   │
                    └──────────────────┘
```

## 🏗️ Padrões de Design

### 1. Repository Pattern

**Objetivo**: Abstrair a lógica de acesso a dados

```
Entity (User, Client, etc)
         ↓
     Schema (Pydantic)
         ↓
    Repository
         ↓
    SQLAlchemy
         ↓
    Database
```

**Benefícios**:
- Reutilização de código CRUD
- Facilita testes (pode mockear)
- Centraliza queries
- Mudança de DB sem afetar services

**Exemplo**:
```python
class BaseRepository(Generic[T]):
    def create(self, obj: T) -> T
    def get_by_id(self, id: int) -> T
    def update(self, id: int, obj: T) -> T
    def delete(self, id: int) -> bool

class UserRepository(BaseRepository[User]):
    def get_by_email(self, email: str) -> User
    def email_exists(self, email: str) -> bool
```

### 2. Service Layer Pattern

**Objetivo**: Encapsular lógica de negócio

```
API Route
    ↓
 Dependency (Authentication)
    ↓
Service Layer (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database
```

**Responsabilidades**:
- Validação de regras de negócio
- Orquestração de repositories
- Logging e auditoria
- Tratamento de exceções

**Exemplo**:
```python
class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo
    
    def create_user(self, data: UserCreate) -> User:
        # 1. Validar regras
        if self.repo.email_exists(data.email):
            raise EmailAlreadyExistsError()
        
        # 2. Hash password
        data.password_hash = hash_password(data.password)
        
        # 3. Criar
        user = self.repo.create(data)
        
        # 4. Log
        self._log_audit("CREATE", user)
        
        return user
```

### 3. Dependency Injection

**Objetivo**: Desacoplar componentes

**FastAPI + Depends**:
```python
@router.get("/users")
async def list_users(
    current_user: User = Depends(get_current_admin),
    service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db)
) -> List[UserResponse]:
    return service.list_users()
```

**Benefícios**:
- Facilita testes (mock dependencies)
- Código mais limpo
- Menos acoplamento

### 4. Authentication/Authorization

**Flow JWT**:
```
1. POST /login (email, password)
   ↓
2. Validate credentials
   ↓
3. Create JWT token
   ↓
4. Return token to client
   ↓
5. Client includes in Authorization header
   ↓
6. Server validates token signature
   ↓
7. Extract claims (user_id, role)
   ↓
8. Allow/Deny request based on role
```

**Rotas Protegidas**:
```
/auth/login          → PUBLIC
/auth/me             → AUTHENTICATED
/users               → ADMIN ONLY
/clients             → USER + ADMIN
/products            → USER + ADMIN
/audit-logs          → ADMIN ONLY
```

### 5. Audit Trail

**Objetivo**: Rastreabilidade completa

```
User Action → Service → Log to AuditLog
                           ↓
                       Record Change
                           ↓
                      Store JSON Diff
```

**Campos Auditados**:
- User ID (quem fez)
- Action (CREATE, UPDATE, DELETE)
- Entity (User, Client, Product)
- Entity ID (qual registro)
- Old Values (JSON anterior)
- New Values (JSON novo)
- Timestamp

## 📊 Estrutura de Dados

### User Model
```python
class User:
    id: int (PK)
    email: str (unique)
    full_name: str
    password_hash: str
    role: UserRole (admin|user|viewer)
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### Client Model
```python
class Client:
    id: int (PK)
    name: str
    email: str
    phone: str
    address: str
    city: str
    state: str
    postal_code: str
    country: str
    tax_id: str (unique)
    created_by_id: int (FK → User)
    created_at: datetime
    updated_at: datetime
```

### Product Model
```python
class Product:
    id: int (PK)
    sku: str (unique)
    name: str
    description: str
    price: Decimal
    cost: Decimal
    quantity: int
    category: str
    is_active: bool
    created_by_id: int (FK → User)
    created_at: datetime
    updated_at: datetime
```

### AuditLog Model
```python
class AuditLog:
    id: int (PK)
    user_id: int (FK → User)
    action: str (CREATE|UPDATE|DELETE)
    entity: str (User|Client|Product)
    entity_id: int
    old_values: JSON
    new_values: JSON
    timestamp: datetime
```

### Employee Model (HR Module)
```python
class Employee:
    id: int (PK)
    full_name: str
    email: str
    cpf: str (unique)
    position: str
    department: str
    salary: Decimal
    hire_date: date
    contract_type: str (CLT|PJ|Temporário)
    status: str (Ativo|Inativo)
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### Payroll Model (HR Module)
```python
class Payroll:
    id: int (PK)
    employee_id: int (FK → Employee)
    month: str (YYYY-MM)
    base_salary: Decimal
    bonus: Decimal
    gross_salary: Decimal
    deductions: Decimal
    net_salary: Decimal
    status: str (Processado|Pago|Pendente)
    created_at: datetime
    updated_at: datetime
```

## 🔐 Segurança

### Camadas de Segurança

1. **Input Validation**
   ```
   API Request
      ↓
   Pydantic Schema Validation
      ↓
   Business Logic Validation
      ↓
   Database Constraints
   ```

2. **Authentication**
   ```
   JWT Token (HS256)
      ↓
   Signature Verification
      ↓
   Expiration Check (30 min)
      ↓
   User Lookup
   ```

3. **Authorization**
   ```
   Check User Role
      ↓
   Check Resource Ownership (if needed)
      ↓
   Execute Action or Deny
   ```

4. **Password Security**
   ```
   Plain Password
      ↓
   BCrypt Hash (work factor 12)
      ↓
   Store Hashed
      ↓
   Verify: Compare hash on login
   ```

### CORS Configuration
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🚀 Performance

### Otimizações

1. **Connection Pooling**
   ```python
   engine = create_engine(
       DATABASE_URL,
       poolclass=QueuePool,
       pool_size=20,  # Max connections
       max_overflow=10,
       pool_recycle=3600,
   )
   ```

2. **Database Indexes**
   ```
   Users: email, is_active
   Clients: name, tax_id, city
   Products: sku, name, category
   AuditLogs: user_id, action, entity, timestamp
   ```

3. **Query Optimization**
   ```python
   # Bad: N+1 Query
   users = repo.get_all()
   for user in users:
       print(user.audit_logs)  # Query cada iteração
   
   # Good: Join Load
   users = session.query(User).options(
       joinedload(User.audit_logs)
   ).all()
   ```

4. **Caching Strategy** (Future)
   ```
   - Redis para cache de sessões
   - Cache de dados referência
   - Cache de queries frequentes
   ```

## 📦 API Versioning

**Estratégia**: URL-based versioning

```
/api/v1/auth/login
/api/v1/users
/api/v1/clients
/api/v1/products

# Future versions
/api/v2/...
```

**Benefícios**:
- Suporte a múltiplas versões
- Migração gradual de clientes
- Backward compatibility

## 🧪 Testabilidade

### Testes por Camada

```
API Layer
  ↓ (Mock Service)
Service Layer
  ↓ (Mock Repository)
Repository Layer
  ↓ (Mock Database)
Database Layer
```

### Fixture Structure
```python
@pytest.fixture
def db():
    # SQLite in-memory para testes
    return create_test_db()

@pytest.fixture
def client(db):
    # TestClient com dependency override
    return TestClient(app)

@pytest.fixture
def admin_user(db):
    # User de teste pré-criado
    return create_admin(db)
```

## 🐳 Deployment

### Docker Composition

```
docker-compose.yml
├── mysql (port 3306)
│   ├── volumes: data persistence
│   └── environment: DB config
├── backend (port 8000)
│   ├── depends_on: mysql
│   └── volumes: code hot-reload
└── frontend (port 5173)
    ├── volumes: code hot-reload
    └── proxy: /api → backend
```

### Environment Variables

```
Database:
  DATABASE_URL=mysql+pymysql://user:pass@localhost/erp_db

JWT:
  JWT_SECRET_KEY=your-secret-key
  JWT_ALGORITHM=HS256

CORS:
  CORS_ORIGINS=http://localhost:5173
```

## 📚 Fluxo de Requisição

### POST /clients (Create Client)

```
1. Request
   POST /api/v1/clients
   {
     "name": "ACME Corp",
     "email": "contact@acme.com",
     "tax_id": "123456"
   }

2. FastAPI Handler
   @router.post("/clients")
   async def create_client(
       client_data: ClientCreate,
       current_user: User = Depends(get_current_user),
       service: ClientService = Depends(get_client_service)
   )

3. Dependency Injection
   - get_current_user: JWT validation
   - get_client_service: Service instance

4. Service Layer
   service.create_client(client_data, current_user)
   ├─ Check permission (not viewer)
   ├─ Validate business rules
   ├─ Repository.create(client_data)
   └─ Log audit event

5. Repository Layer
   repo.create(client_data)
   ├─ Insert into database
   ├─ Flush and refresh
   └─ Return created entity

6. Response
   {
     "id": 1,
     "name": "ACME Corp",
     "email": "contact@acme.com",
     "tax_id": "123456",
     "created_at": "2024-01-01T00:00:00Z"
   }
```

## 🔄 Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
│   ├── LoginPage
│   └── MainLayout
│       ├── Header (Navigation)
│       ├── Pages
│       │   ├── DashboardPage
│       │   ├── ClientsPage
│       │   ├── ProductsPage
│       │   └── UsersPage
│       └── Footer
```

### State Management

```
Global State (AuthContext)
├── user: Current logged user
├── token: JWT token
├── loading: Loading state
└── error: Error state

Local State (Component)
├── useState for form data
├── useState for UI state
└── useAsync for data fetching
```

### Data Flow

```
Component
   ↓ (onClick)
Action Creator
   ↓
API Call (axios)
   ↓
Backend
   ↓
Response
   ↓
Update State
   ↓
Re-render
```

## 📈 Escalabilidade

### Plano de Crescimento

1. **Phase 1** (Current)
   - Monolítico
   - Single database
   - Local/Docker deployment

2. **Phase 2** (Future)
   - Microserviços
   - Database replication
   - Load balancing

3. **Phase 3** (Future)
   - Multi-region
   - Distributed caching
   - Real-time sync (WebSockets)

## 🔗 Referências

- [FastAPI Architecture](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [JWT Authentication](https://jwt.io/)
- [React Architecture](https://react.dev/learn)

---

**Documento criado**: 2024-01-XX
**Última atualização**: Março 2026 - Adicionado Employee e Payroll models (HR Module)
