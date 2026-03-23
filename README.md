# ERP System

Um sistema ERP completo com backend em FastAPI e frontend em React. Gerencia RH, financeiro, vendas, estoque e fornecedores.


## Quick Start

### Windows
```bash
setup-windows.bat
```

### Linux/Mac
```bash
chmod +x setup-linux.sh
./setup-linux.sh
```

O script instala tudo e inicia o backend em `http://localhost:8000` e frontend em `http://localhost:5173`.

## Login Padrão

```
Email: admin@example.com
Senha: AdminPass123
```

Existem também credenciais para `user@example.com` e `viewer@example.com` com a senha `UserPass123` e `ViewerPass123` respectivamente.

## Funcionalidades

- **Autenticação**: JWT com roles (Admin, User, Viewer)
- **RH**: Gestão de funcionários, folha de pagamento, KPIs
- **Financeiro**: Contas a receber, a pagar, conciliação bancária
- **Vendas**: Pedidos, cotações, clientes
- **Estoque**: Inventário, movimentações, alertas
- **Fornecedores**: Cadastro, histórico, performance
- **Relatórios**: Exportação CSV e PDF
- **Auditoria**: Log completo de todas as operações

## Requisitos

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (opcional)

## Setup Manual

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac ou venv\Scripts\activate no Windows
pip install -r requirements.txt
cp .env.example .env
# Edite .env com suas credenciais do banco
alembic upgrade head
python -m uvicorn app.main:app --reload
```

API estará em `http://localhost:8000/docs` (Swagger).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend estará em `http://localhost:5173`.

## Docker

```bash
docker-compose build
docker-compose up
```

## Estrutura

```
backend/
├── app/
│   ├── api/routes/        # Endpoints
│   ├── services/          # Lógica de negócio
│   ├── repositories/      # Acesso a dados
│   ├── models/            # Modelos do banco
│   ├── schemas/           # Validação
│   └── core/              # Config, segurança, etc
├── migrations/            # Migrations do Alembic
└── requirements.txt

frontend/
├── src/
│   ├── pages/             # Páginas
│   ├── components/        # Componentes
│   ├── context/           # State management
│   ├── hooks/             # Custom hooks
│   └── services/          # Chamadas de API
└── package.json
```

## Stack

**Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic, PyJWT

**Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router

**Database**: MySQL / PostgreSQL

## API Principais

### Login
```bash
POST /api/v1/auth/login
```

### Clientes
```bash
GET /api/v1/clients
POST /api/v1/clients
PUT /api/v1/clients/{id}
DELETE /api/v1/clients/{id}
```

### Produtos
```bash
GET /api/v1/products
POST /api/v1/products
PUT /api/v1/products/{id}
DELETE /api/v1/products/{id}
POST /api/v1/products/{id}/adjust-stock
```

### Relatórios
```bash
GET /api/v1/reports/products/csv
POST /api/v1/imports/products/csv
```

A documentação completa está em `http://localhost:8000/docs`.

## Testes

```bash
cd backend
pytest app/tests/unit/
pytest app/tests/integration/
```

## Segurança

- Senhas com hash BCrypt
- JWT com expiração
- CORS configurável
- Validação de input em todos endpoints
- SQL Injection protection (SQLAlchemy ORM)
- Rate limiting
- Audit log completo

## Variáveis de Ambiente

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=erp_system

SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## Documentação

- [Arquitetura Detalhada](docs/ARCHITECTURE.md)
- [Troubleshooting](TROUBLESHOOTING.md)

## Licença

MIT

