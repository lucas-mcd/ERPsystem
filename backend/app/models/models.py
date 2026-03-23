"""
SQLAlchemy Models - Camada de Persistência

Responsabilidade: Definir estrutura das tabelas do banco de dados
- Entidades do domínio
- Relacionamentos
- Constraints e validações em nível de banco
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, Enum):
    """Roles de usuário no sistema"""
    ADMIN = "admin"
    USER = "user"
    VIEWER = "viewer"


class SupplierStatus(str, Enum):
    """Status do fornecedor"""
    ACTIVE = "active"  # Ativo
    INACTIVE = "inactive"  # Inativo
    SUSPENDED = "suspended"  # Suspenso
    ANALYZING = "analyzing"  # Em análise
    CANCELED = "canceled"  # Cancelado


class SupplierType(str, Enum):
    """Tipo de fornecedor"""
    RAW_MATERIALS = "raw_materials"  # Matéria-prima
    SERVICES = "services"  # Serviços
    EQUIPMENT = "equipment"  # Equipamentos
    COMPONENTS = "components"  # Componentes
    OTHER = "other"  # Outro


class BusinessSegment(str, Enum):
    """Segmento de negócio"""
    MANUFACTURING = "manufacturing"  # Manufatura
    LOGISTICS = "logistics"  # Logística
    CONSULTING = "consulting"  # Consultoria
    TECHNOLOGY = "technology"  # Tecnologia
    DISTRIBUTION = "distribution"  # Distribuição
    AGRICULTURE = "agriculture"  # Agricultura
    OTHER = "other"  # Outro


class TaxType(str, Enum):
    """Tipos de impostos"""
    ICMS = "icms"  # Imposto Circulação Mercadorias
    IPI = "ipi"  # Imposto Produtos Industrializados
    COFINS = "cofins"  # Contribuição Finaçamento Social
    PIS = "pis"  # Programa Integr. Social
    ISS = "iss"  # Imposto Serviços
    IRPJ = "irpj"  # Imposto Renda Pessoa Jurídica
    CSLL = "csll"  # Contribuição Social Lucro Líquido


class User(Base):
    """
    Modelo de Usuário
    
    Atributos:
        id: Identificador único
        email: Email único (login)
        full_name: Nome completo
        password_hash: Hash bcrypt da senha
        role: Perfil do usuário (admin, user, viewer)
        is_active: Indica se usuário está ativo
        created_at: Data de criação
        updated_at: Data de última atualização
    """
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"


class Client(Base):
    """
    Modelo de Cliente
    
    Atributos:
        id: Identificador único
        name: Nome da empresa/cliente
        email: Email para contato
        phone: Telefone para contato
        address: Endereço completo
        city: Cidade
        state: Estado/Província
        postal_code: CEP/Código postal
        country: País
        tax_id: CNPJ ou ID fiscal
        created_at: Data de criação
        updated_at: Data de última atualização
        created_by_id: ID do usuário que criou
    """
    
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="Brazil", nullable=False)
    tax_id = Column(String(20), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    def __repr__(self) -> str:
        return f"<Client(id={self.id}, name={self.name}, email={self.email})>"


class Product(Base):
    """
    Modelo de Produto
    
    Atributos:
        id: Identificador único
        sku: Código do produto (único)
        name: Nome do produto
        description: Descrição detalhada
        price: Preço unitário
        cost: Custo de aquisição
        quantity: Quantidade em estoque
        category: Categoria do produto
        is_active: Indica se produto está ativo
        created_at: Data de criação
        updated_at: Data de última atualização
        created_by_id: ID do usuário que criou
    """
    
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    category = Column(String(100), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    def __repr__(self) -> str:
        return f"<Product(id={self.id}, sku={self.sku}, name={self.name})>"


class AuditLog(Base):
    """
    Modelo de Audit Log - Rastreamento de ações
    
    Atributos:
        id: Identificador único
        user_id: ID do usuário que realizou ação
        action: Tipo de ação (CREATE, UPDATE, DELETE, LOGIN)
        entity: Tipo de entidade afetada
        entity_id: ID da entidade
        old_values: Valores anteriores (JSON)
        new_values: Valores novos (JSON)
        timestamp: Data/hora da ação
    """
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(20), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity = Column(String(50), nullable=False, index=True)  # User, Client, Product
    entity_id = Column(Integer, nullable=True, index=True)
    old_values = Column(Text, nullable=True)  # JSON serializado
    new_values = Column(Text, nullable=True)  # JSON serializado
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relacionamentos
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, action={self.action}, entity={self.entity})>"


class StockMovement(Base):
    """
    Modelo de Movimentação de Estoque
    
    Rastreia todas as entradas e saídas de produtos do estoque com dados financeiros
    
    Atributos:
        id: Identificador único
        product_id: Referência ao produto
        supplier_id: Referência ao fornecedor (para entradas)
        supplier_pricing_id: Referência ao preço do fornecedor
        movement_type: 'entrada' ou 'saída'
        quantity: Quantidade movimentada
        reason: Motivo da movimentação (compra, venda, devolução, ajuste, etc)
        current_quantity: Quantidade após o movimento (snapshot)
        notes: Notas/observações adicionais
        order_id: ID do pedido (se movimentação é de um pedido)
        product_name: Nome do produto (snapshot para histórico)
        product_price: Preço do produto (snapshot para histórico)
        
        --- Dados Financeiros (snapshots) ---
        cost_price: Custo unitário do produto
        sale_price: Preço de venda unitário
        transportation_cost: Custo de frete/transporte
        total_cost: Custo total (cost_price + transportation_cost) * quantity
        
        --- Impostos (snapshots) ---
        icms_rate: Taxa ICMS (%)
        ipi_rate: Taxa IPI (%)
        cofins_rate: Taxa COFINS (%)
        pis_rate: Taxa PIS (%)
        other_taxes: Outros impostos (%)
        
        --- Cálculos Financeiros (snapshots) ---
        gross_margin: Margem bruta (%)
        net_margin: Margem líquida (%)
        profit_amount: Lucro unitário
        
        -- Adicionais ---
        currency: Moeda (BRL, USD, EUR)
        created_by_id: ID do usuário que registrou
        created_at: Data do movimento
    """
    
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)  # Para entradas
    supplier_pricing_id = Column(Integer, ForeignKey("supplier_pricing.id"), nullable=True, index=True)  # Ref preço
    movement_type = Column(String(20), nullable=False, index=True)  # 'entrada' ou 'saída'
    quantity = Column(Integer, nullable=False)
    reason = Column(String(50), nullable=False)  # compra, venda, devolução, ajuste, danificado
    current_quantity = Column(Integer, nullable=False)  # Estoque após movimento
    notes = Column(Text, nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)  # Pedido associado
    product_name = Column(String(255), nullable=True)  # Snapshot do nome
    product_price = Column(Float, nullable=True)  # Snapshot do preço
    
    # Dados financeiros (snapshots)
    cost_price = Column(Float, nullable=True)  # Custo unitário
    sale_price = Column(Float, nullable=True)  # Preço venda unitário
    transportation_cost = Column(Float, default=0, nullable=False)  # Frete
    total_cost = Column(Float, nullable=True)  # (cost_price + transport) * qty
    
    # Impostos (snapshots em %)
    icms_rate = Column(Float, default=0, nullable=False)
    ipi_rate = Column(Float, default=0, nullable=False)
    cofins_rate = Column(Float, default=0, nullable=False)
    pis_rate = Column(Float, default=0, nullable=False)
    other_taxes = Column(Float, default=0, nullable=False)
    
    # Cálculos financeiros (snapshots)
    gross_margin = Column(Float, nullable=True)
    net_margin = Column(Float, nullable=True)
    profit_amount = Column(Float, nullable=True)
    
    # Adicionais
    currency = Column(String(3), default="BRL", nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relacionamentos
    product = relationship("Product", backref="stock_movements")
    created_by = relationship("User", backref="stock_movements")
    order = relationship("Order", backref="stock_movements")
    supplier = relationship("Supplier", backref="stock_movements")
    supplier_pricing = relationship("SupplierPricing", foreign_keys=[supplier_pricing_id])
    
    def __repr__(self) -> str:
        return f"<StockMovement(id={self.id}, product_id={self.product_id}, supplier_id={self.supplier_id}, type={self.movement_type}, qty={self.quantity})>"


class StockAlert(Base):
    """
    Modelo de Alerta de Estoque
    
    Define limiares para alertar sobre estoque baixo
    
    Atributos:
        id: Identificador único
        product_id: Referência ao produto
        min_quantity: Quantidade mínima para disparo de alerta
        alert_type: Tipo de alerta (low_stock, out_of_stock, overstock)
        is_active: Se o alerta está ativo
        email_notification: Se deve notificar por email
        created_at: Data de criação
        updated_at: Última atualização
    """
    
    __tablename__ = "stock_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False, index=True)
    min_quantity = Column(Integer, default=10, nullable=False)
    alert_type = Column(String(20), default="low_stock", nullable=False)  # low_stock, out_of_stock, overstock
    is_active = Column(Boolean, default=True, nullable=False)
    email_notification = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    product = relationship("Product", backref="stock_alert", uselist=False)
    
    def __repr__(self) -> str:
        return f"<StockAlert(id={self.id}, product_id={self.product_id}, min={self.min_quantity})>"


class Order(Base):
    """
    Modelo de Pedido (Venda)
    
    Registra pedidos de clientes com itens e valores
    
    Atributos:
        id: Identificador único
        client_name: Nome do cliente que fez o pedido
        total_amount: Valor total do pedido
        items_count: Quantidade total de itens diferentes
        status: Status do pedido (pending, processing, completed, cancelled)
        created_by_id: ID do usuário que criou o pedido
        created_at: Data de criação do pedido
        updated_at: Data de última atualização
    """
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String(255), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    items_count = Column(Integer, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, processing, completed, cancelled
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    created_by = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Order(id={self.id}, client={self.client_name}, total={self.total_amount}, status={self.status})>"


class OrderItem(Base):
    """
    Modelo de Item do Pedido
    
    Registra os itens individuais de um pedido
    
    Atributos:
        id: Identificador único
        order_id: Referência ao pedido
        product_name: Nome do produto (snapshot)
        quantity: Quantidade do item
        price: Preço unitário no momento do pedido (snapshot)
        created_at: Data de criação
    """
    
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    order = relationship("Order", back_populates="items")
    
    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product={self.product_name}, qty={self.quantity})>"


class Supplier(Base):
    """
    Modelo de Fornecedor (Supplier)
    
    Registra informações sobre fornecedores de produtos
    
    Atributos:
        id: Identificador único
        name: Nome da empresa fornecedora
        email: Email para contato
        phone: Telefone para contato
        contact_person: Pessoa de contato
        address: Endereço completo
        city: Cidade
        state: Estado/Província
        postal_code: CEP/Código postal
        country: País
        tax_id: CNPJ ou ID fiscal
        sla_days: SLA em dias (prazo acordado para entrega)
        is_active: Indica se fornecedor está ativo
        notes: Observações gerais
        created_at: Data de criação
        updated_at: Data de última atualização
        created_by_id: ID do usuário que criou
    """
    
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    contact_person = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="Brazil", nullable=False)
    tax_id = Column(String(20), unique=True, nullable=True, index=True)
    sla_days = Column(Integer, default=7, nullable=False)  # Prazo acordado em dias
    status = Column(SQLEnum(SupplierStatus), default=SupplierStatus.ACTIVE, nullable=False, index=True)  # Status do fornecedor
    supplier_type = Column(SQLEnum(SupplierType), nullable=True, index=True)  # Tipo de fornecedor
    business_segment = Column(SQLEnum(BusinessSegment), nullable=True, index=True)  # Segmento de negócio
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relacionamentos
    created_by = relationship("User", foreign_keys=[created_by_id])
    supply_history = relationship("SupplyHistory", back_populates="supplier", cascade="all, delete-orphan")
    pricing_history = relationship("SupplierPricing", back_populates="supplier", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Supplier(id={self.id}, name={self.name}, email={self.email})>"




class SupplierPricing(Base):
    """
    Modelo de Preços e Custos do Fornecedor
    
    Registra preços, custos e cálculos financeiros completos
    
    Atributos:
        supplier_id: Referência ao fornecedor
        product_name: Nome do produto
        cost_price: Preço de custo unitário
        sale_price: Preço de venda unitário
        minimum_quantity: Quantidade mínima para preço
        transportation_cost: Custo de frete/transporte
        icms_rate: Taxa ICMS (%)
        ipi_rate: Taxa IPI (%)
        cofins_rate: Taxa COFINS (%)
        pis_rate: Taxa PIS (%)
        other_taxes: Outros impostos adicionais
        gross_margin: Margem bruta (%)
        net_margin: Margem líquida após impostos (%)
        profit_amount: Valor lucro unitário
        effective_date: Data início da validade
        expiry_date: Data fim da validade
        currency: Moeda (BRL, USD, EUR)
        active: Está ativo
        notes: Observações
    """
    
    __tablename__ = "supplier_pricing"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    cost_price = Column(Float, nullable=False)  # Preço de custo
    sale_price = Column(Float, nullable=False)  # Preço de venda
    minimum_quantity = Column(Integer, default=1, nullable=False)  # Qtd mínima
    transportation_cost = Column(Float, default=0, nullable=False)  # Custo transporte
    
    # Impostos individuais (%)
    icms_rate = Column(Float, default=0, nullable=False)  # ICMS
    ipi_rate = Column(Float, default=0, nullable=False)  # IPI
    cofins_rate = Column(Float, default=0, nullable=False)  # COFINS
    pis_rate = Column(Float, default=0, nullable=False)  # PIS
    other_taxes = Column(Float, default=0, nullable=False)  # Outros impostos
    
    # Cálculos financeiros
    gross_margin = Column(Float, default=0, nullable=False)  # Margem bruta %
    net_margin = Column(Float, default=0, nullable=False)  # Margem líquida % (após impostos)
    profit_amount = Column(Float, default=0, nullable=False)  # Valor lucro unitário
    
    # Validade
    effective_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    
    # Adicionais
    currency = Column(String(3), default="BRL", nullable=False)  # BRL, USD, EUR
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    supplier = relationship("Supplier", back_populates="pricing_history")
    
    def __repr__(self) -> str:
        return f"<SupplierPricing(supplier_id={self.supplier_id}, product={self.product_name}, margin={self.net_margin}%)>"


class SupplyHistory(Base):
    """
    Modelo de Histórico de Fornecimentos
    
    Registra cada fornecimento realizado, acompanhando qualidade e prazo
    
    Atributos:
        supplier_id: Referência ao fornecedor
        product_name: Nome do produto fornecido
        quantity: Quantidade fornecida
        unit_price: Preço unitário
        total_amount: Valor total do fornecimento
        expected_delivery_date: Data esperada de entrega
        actual_delivery_date: Data real de entrega
        is_on_time: Se entregou no prazo
        defect_count: Quantidade de itens com defeito
        defect_rate: Percentual de itens com defeito
        notes: Observações
    """
    
    __tablename__ = "supply_history"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    expected_delivery_date = Column(DateTime, nullable=True)
    actual_delivery_date = Column(DateTime, nullable=True)
    is_on_time = Column(Boolean, default=True, nullable=False)
    defect_count = Column(Integer, default=0, nullable=False)
    defect_rate = Column(Float, default=0, nullable=False)  # Percentual 0-100
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    supplier = relationship("Supplier", back_populates="supply_history")
    
    def __repr__(self) -> str:
        return f"<SupplyHistory(id={self.id}, supplier_id={self.supplier_id}, product={self.product_name}, qty={self.quantity})>"


class Employee(Base):
    """
    Modelo de Funcionário
    
    Rastreia dados de funcionários da empresa
    
    Atributos:
        id: Identificador único
        full_name: Nome completo
        email: Email do funcionário
        phone: Telefone
        cpf: CPF (Brasil)
        position: Cargo/Posição
        department: Departamento
        hire_date: Data de contratação
        salary: Salário base mensal
        contract_type: Tipo de contrato (CLT, PJ, Estagiário)
        status: Status (ativo, inativo, demitido, férias)
        manager_id: ID do gerente/supervisor
        birth_date: Data de nascimento
        address: Endereço
        is_active: Ativo/Inativo
    """
    
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    cpf = Column(String(14), nullable=False, unique=True, index=True)  # 000.000.000-00
    position = Column(String(100), nullable=False)  # Cargo
    department = Column(String(100), nullable=False)  # Departamento
    hire_date = Column(DateTime, nullable=False)
    salary = Column(Float, nullable=False)  # Salário mensal
    contract_type = Column(String(50), default="CLT", nullable=False)  # CLT, PJ, Estagiário
    status = Column(String(50), default="ativo", nullable=False, index=True)  # ativo, inativo, demitido
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)  # Autoreferência
    birth_date = Column(DateTime, nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    payrolls = relationship("Payroll", back_populates="employee")
    
    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, name={self.full_name}, position={self.position}, salary={self.salary})>"


class Payroll(Base):
    """
    Modelo de Folha de Pagamento
    
    Rastreia salários, descontos e cálculos de folha de pagamento
    
    Atributos:
        id: Identificador único
        employee_id: Referência ao funcionário
        month: Mês/ano da folha (ex: 2024-01)
        base_salary: Salário base
        bonus: Bônus (se houver)
        deductions: Descontos totais
        inss_contribution: Contribuição INSS
        irpf: Imposto de Renda
        vale_transporte: Vale transporte
        vale_alimentacao: Vale alimentação
        other_deductions: Outros descontos
        gross_salary: Salário bruto
        net_salary: Salário líquido
        paid_date: Data de Pagamento
        status: Status (rascunho, processado, pago, erro)
        notes: Observações
    """
    
    __tablename__ = "payrolls"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False)  # YYYY-MM format
    base_salary = Column(Float, nullable=False)
    bonus = Column(Float, default=0, nullable=False)
    deductions = Column(Float, default=0, nullable=False)
    inss_contribution = Column(Float, default=0, nullable=False)  # INSS (8%)
    irpf = Column(Float, default=0, nullable=False)  # Imposto de Renda
    vale_transporte = Column(Float, default=0, nullable=False)
    vale_alimentacao = Column(Float, default=0, nullable=False)
    other_deductions = Column(Float, default=0, nullable=False)
    gross_salary = Column(Float, nullable=False)  # Base + Bonus
    net_salary = Column(Float, nullable=False)  # Gross - Deductions
    paid_date = Column(DateTime, nullable=True)  # Data quando foi pago
    status = Column(String(50), default="rascunho", nullable=False, index=True)  # rascunho, processado, pago
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    employee = relationship("Employee", back_populates="payrolls")
    
    def __repr__(self) -> str:
        return f"<Payroll(id={self.id}, employee_id={self.employee_id}, month={self.month}, net_salary={self.net_salary})>"


# ============= FINANCIAL MODELS =============

class BankAccount(Base):
    """Contas Bancárias"""
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_name = Column(String(255), nullable=False, index=True)
    bank_name = Column(String(255), nullable=False)
    account_number = Column(String(50), nullable=False, unique=True, index=True)
    branch_code = Column(String(20), nullable=True)
    account_type = Column(String(50), default="corrente", nullable=False)  # corrente, poupança
    cpf_cnpj = Column(String(50), nullable=True)
    current_balance = Column(Float, default=0, nullable=False)
    currency = Column(String(3), default="BRL", nullable=False)
    status = Column(String(50), default="ativa", nullable=False, index=True)  # ativa, inativa
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    transactions = relationship("BankTransaction", back_populates="bank_account")
    reconciliations = relationship("BankReconciliation", back_populates="bank_account")
    
    def __repr__(self) -> str:
        return f"<BankAccount(id={self.id}, account_name={self.account_name}, balance={self.current_balance})>"


class AccountsReceivable(Base):
    """Contas a Receber (AR)"""
    __tablename__ = "accounts_receivable"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False, index=True)
    invoice_number = Column(String(100), nullable=False, unique=True, index=True)
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    received_amount = Column(Float, default=0, nullable=False)
    balance = Column(Float, nullable=False)
    status = Column(String(50), default="aberta", nullable=False, index=True)  # aberta, paga, atrasada
    payment_method = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    payments = relationship("ARPayment", back_populates="receivable")
    
    def __repr__(self) -> str:
        return f"<AR(id={self.id}, invoice={self.invoice_number}, balance={self.balance})>"


class ARPayment(Base):
    """Pagamentos de Contas a Receber"""
    __tablename__ = "ar_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    receivable_id = Column(Integer, ForeignKey("accounts_receivable.id"), nullable=False, index=True)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(100), nullable=False)
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    receivable = relationship("AccountsReceivable", back_populates="payments")
    
    def __repr__(self) -> str:
        return f"<ARPayment(id={self.id}, receivable_id={self.receivable_id}, amount={self.amount})>"


class AccountsPayable(Base):
    """Contas a Pagar (AP)"""
    __tablename__ = "accounts_payable"
    
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, nullable=False, index=True)
    invoice_number = Column(String(100), nullable=False, unique=True, index=True)
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0, nullable=False)
    balance = Column(Float, nullable=False)
    status = Column(String(50), default="aberta", nullable=False, index=True)  # aberta, paga, atrasada
    payment_method = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    payments = relationship("APPayment", back_populates="payable")
    
    def __repr__(self) -> str:
        return f"<AP(id={self.id}, invoice={self.invoice_number}, balance={self.balance})>"


class APPayment(Base):
    """Pagamentos de Contas a Pagar"""
    __tablename__ = "ap_payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payable_id = Column(Integer, ForeignKey("accounts_payable.id"), nullable=False, index=True)
    payment_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(100), nullable=False)
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    payable = relationship("AccountsPayable", back_populates="payments")
    
    def __repr__(self) -> str:
        return f"<APPayment(id={self.id}, payable_id={self.payable_id}, amount={self.amount})>"


class BankTransaction(Base):
    """Transações Bancárias"""
    __tablename__ = "bank_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False, index=True)
    transaction_date = Column(DateTime, nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), nullable=False)  # debit, credit
    status = Column(String(50), default="confirmada", nullable=False)  # confirmada, pendente
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    bank_account = relationship("BankAccount", back_populates="transactions")
    
    def __repr__(self) -> str:
        return f"<BankTransaction(id={self.id}, amount={self.amount}, type={self.transaction_type})>"


class BankReconciliation(Base):
    """Reconciliação Bancária"""
    __tablename__ = "bank_reconciliations"
    
    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False, index=True)
    reconciliation_date = Column(DateTime, nullable=False)
    opening_balance = Column(Float, nullable=False)
    closing_balance = Column(Float, nullable=False)
    expected_balance = Column(Float, nullable=False)
    variance = Column(Float, default=0, nullable=False)
    status = Column(String(50), default="rascunho", nullable=False, index=True)  # rascunho, reconciliada
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relacionamentos
    bank_account = relationship("BankAccount", back_populates="reconciliations")
    
    def __repr__(self) -> str:
        return f"<BankReconciliation(id={self.id}, variance={self.variance})>"


class CashFlow(Base):
    """Projeções de Fluxo de Caixa"""
    __tablename__ = "cash_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    projection_date = Column(DateTime, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # entrada, saída
    type = Column(String(100), nullable=False)  # vendas, despesas, investimentos, etc
    amount = Column(Float, nullable=False)
    probability = Column(Integer, default=100, nullable=False)  # 0-100%
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="projetado", nullable=False, index=True)  # projetado, realizado, cancelado
    description = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def __repr__(self) -> str:
        return f"<CashFlow(id={self.id}, amount={self.amount}, category={self.category})>"
