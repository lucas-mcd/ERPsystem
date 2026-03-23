"""
Schemas de Validação com Pydantic

Responsabilidade: Validação de dados de entrada/saída
- Request/Response models
- Validações de negócio
- Documentação automática de API
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """Roles de usuário"""
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"


class SupplierStatus(str, Enum):
    """Status do fornecedor"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    ANALYZING = "analyzing"
    CANCELED = "canceled"


class SupplierType(str, Enum):
    """Tipo de fornecedor"""
    RAW_MATERIALS = "raw_materials"
    SERVICES = "services"
    EQUIPMENT = "equipment"
    COMPONENTS = "components"
    OTHER = "other"


class BusinessSegment(str, Enum):
    """Segmento de negócio"""
    MANUFACTURING = "manufacturing"
    LOGISTICS = "logistics"
    CONSULTING = "consulting"
    TECHNOLOGY = "technology"
    DISTRIBUTION = "distribution"
    AGRICULTURE = "agriculture"
    OTHER = "other"


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserBase(BaseModel):
    """Schema base para usuários"""
    email: EmailStr = Field(..., description="Email único do usuário")
    full_name: str = Field(..., min_length=3, max_length=255, description="Nome completo")
    role: UserRole = Field(default=UserRole.USER, description="Perfil do usuário")


class UserCreate(UserBase):
    """Schema para criação de usuário"""
    password: str = Field(..., min_length=8, max_length=255, description="Senha (mín. 8 caracteres)")
    
    @validator('password')
    def validate_password(cls, v):
        """Valida força da senha"""
        if not any(c.isupper() for c in v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('Senha deve conter pelo menos um número')
        return v


class UserUpdate(BaseModel):
    """Schema para atualização de usuário"""
    full_name: Optional[str] = Field(None, min_length=3, max_length=255)
    role: Optional[UserRole] = None
    password: Optional[str] = Field(None, min_length=8, max_length=255)


class UserResponse(UserBase):
    """Schema para resposta de usuário"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserDetailResponse(UserResponse):
    """Schema detalhado de usuário"""
    pass


# ============================================================================
# AUTHENTICATION SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    """Schema para requisição de login"""
    email: EmailStr = Field(..., description="Email do usuário")
    password: str = Field(..., description="Senha do usuário")


class TokenResponse(BaseModel):
    """Schema para resposta de token"""
    access_token: str = Field(..., description="Token JWT de acesso")
    token_type: str = Field(default="bearer", description="Tipo de token")
    expires_in: int = Field(..., description="Tempo de expiração em segundos")


class CurrentUserResponse(BaseModel):
    """Schema para usuário autenticado"""
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool


# ============================================================================
# CLIENT SCHEMAS
# ============================================================================

class ClientBase(BaseModel):
    """Schema base para clientes"""
    name: str = Field(..., min_length=3, max_length=255, description="Nome do cliente")
    email: EmailStr = Field(..., description="Email para contato")
    phone: Optional[str] = Field(None, max_length=20, description="Telefone para contato")
    address: Optional[str] = Field(None, max_length=255, description="Endereço")
    city: Optional[str] = Field(None, max_length=100, description="Cidade")
    state: Optional[str] = Field(None, max_length=50, description="Estado/Província")
    postal_code: Optional[str] = Field(None, max_length=20, description="CEP/Código postal")
    country: str = Field(default="Brazil", max_length=100, description="País")
    tax_id: Optional[str] = Field(None, max_length=20, description="CNPJ ou ID fiscal")


class ClientCreate(ClientBase):
    """Schema para criação de cliente"""
    pass


class ClientUpdate(BaseModel):
    """Schema para atualização de cliente"""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=20)


class ClientResponse(ClientBase):
    """Schema para resposta de cliente"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ClientDetailResponse(ClientResponse):
    """Schema detalhado de cliente"""
    pass


class ClientListResponse(BaseModel):
    """Schema para lista de clientes"""
    total: int = Field(..., description="Total de clientes")
    page: int = Field(..., description="Página atual")
    page_size: int = Field(..., description="Tamanho da página")
    items: List[ClientResponse] = Field(..., description="Lista de clientes")


# ============================================================================
# PRODUCT SCHEMAS
# ============================================================================

class ProductBase(BaseModel):
    """Schema base para produtos"""
    sku: str = Field(..., min_length=1, max_length=50, description="Código do produto")
    name: str = Field(..., min_length=3, max_length=255, description="Nome do produto")
    description: Optional[str] = Field(None, description="Descrição detalhada")
    price: float = Field(..., gt=0, description="Preço unitário")
    cost: Optional[float] = Field(None, ge=0, description="Custo de aquisição")
    quantity: int = Field(default=0, ge=0, description="Quantidade em estoque")
    category: Optional[str] = Field(None, max_length=100, description="Categoria")
    is_active: bool = Field(default=True, description="Produto ativo?")


class ProductCreate(ProductBase):
    """Schema para criação de produto"""
    pass


class ProductUpdate(BaseModel):
    """Schema para atualização de produto"""
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    cost: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema para resposta de produto"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProductDetailResponse(ProductResponse):
    """Schema detalhado de produto"""
    margin: float = Field(..., description="Margem de lucro em percentual")


class ProductListResponse(BaseModel):
    """Schema para lista de produtos"""
    total: int = Field(..., description="Total de produtos")
    page: int = Field(..., description="Página atual")
    page_size: int = Field(..., description="Tamanho da página")
    items: List[ProductResponse] = Field(..., description="Lista de produtos")


# ============================================================================
# AUDIT LOG SCHEMAS
# ============================================================================

class AuditLogResponse(BaseModel):
    """Schema para resposta de audit log"""
    id: int
    user_id: int
    action: str
    entity: str
    entity_id: Optional[int]
    old_values: Optional[str]
    new_values: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Schema para lista de audit logs"""
    total: int
    page: int
    page_size: int
    items: List[AuditLogResponse]


# ============================================================================
# ORDER SCHEMAS
# ============================================================================

class OrderItemResponse(BaseModel):
    """Schema para item do pedido"""
    id: int
    product_name: str
    quantity: int
    price: float
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema para criação de pedido"""
    client_name: str = Field(..., min_length=3, max_length=255, description="Nome do cliente")
    total_amount: float = Field(..., gt=0, description="Valor total do pedido")
    items_count: int = Field(..., gt=0, description="Quantidade de itens diferentes")
    status: str = Field(default="pending", description="Status do pedido")
    items: Optional[List[Dict]] = Field(None, description="Items do pedido")


class OrderResponse(BaseModel):
    """Schema para resposta de pedido"""
    id: int
    client_name: str
    total_amount: float
    items_count: int
    status: str
    created_by_id: int
    created_by_email: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    """Schema para detalhes do pedido com informação do usuário"""
    created_by_email: Optional[str] = None
    created_by_name: Optional[str] = None


class OrderListResponse(BaseModel):
    """Schema para lista de pedidos"""
    total: int
    page: int
    page_size: int
    items: List[OrderResponse]


# ============================================================================
# SUPPLIER SCHEMAS
# ============================================================================

class SupplierBase(BaseModel):
    """Schema base para fornecedor"""
    name: str = Field(..., min_length=3, max_length=255, description="Nome do fornecedor")
    email: EmailStr = Field(..., description="Email para contato")
    phone: Optional[str] = Field(None, max_length=20, description="Telefone para contato")
    contact_person: Optional[str] = Field(None, max_length=255, description="Pessoa de contato")
    address: Optional[str] = Field(None, max_length=255, description="Endereço")
    city: Optional[str] = Field(None, max_length=100, description="Cidade")
    state: Optional[str] = Field(None, max_length=50, description="Estado/Província")
    postal_code: Optional[str] = Field(None, max_length=20, description="CEP/Código postal")
    country: str = Field(default="Brazil", max_length=100, description="País")
    tax_id: Optional[str] = Field(None, max_length=20, description="CNPJ ou ID fiscal")
    sla_days: int = Field(default=7, ge=1, description="SLA em dias (prazo acordado)")
    status: SupplierStatus = Field(default=SupplierStatus.ACTIVE, description="Status do fornecedor")
    supplier_type: Optional[SupplierType] = Field(None, description="Tipo de fornecedor")
    business_segment: Optional[BusinessSegment] = Field(None, description="Segmento de negócio")
    notes: Optional[str] = Field(None, description="Observações gerais")


class SupplierCreate(SupplierBase):
    """Schema para criação de fornecedor"""
    pass


class SupplierUpdate(BaseModel):
    """Schema para atualização de fornecedor"""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    contact_person: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=20)
    sla_days: Optional[int] = Field(None, ge=1)
    status: Optional[SupplierStatus] = None
    supplier_type: Optional[SupplierType] = None
    business_segment: Optional[BusinessSegment] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    """Schema para resposta de fornecedor"""
    id: int
    is_active: bool
    # Métricas calculadas
    total_supplies: int = Field(default=0, description="Total de fornecimentos")
    avg_lead_time: float = Field(default=0, description="Lead time médio em dias")
    on_time_delivery_rate: float = Field(default=0, description="Taxa de entrega no prazo (%)")
    avg_defect_rate: float = Field(default=0, description="Taxa média de defeitos (%)")
    avg_unit_price: float = Field(default=0, description="Preço unitário médio")
    performance_score: float = Field(default=0, description="Score de performance (0-10)")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SupplyHistoryResponse(BaseModel):
    """Schema para histórico de fornecimento"""
    id: int
    supplier_id: int
    product_name: str
    quantity: int
    unit_price: float
    total_amount: float
    expected_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    is_on_time: bool
    defect_count: int
    defect_rate: float
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SupplierDetailResponse(SupplierResponse):
    """Schema detalhado de fornecedor com histórico"""
    supply_history: List[SupplyHistoryResponse] = []


class SupplierListResponse(BaseModel):
    """Schema para lista de fornecedores"""
    total: int
    page: int
    page_size: int
    items: List[SupplierResponse]
