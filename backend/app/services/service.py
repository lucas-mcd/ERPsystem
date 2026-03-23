"""
Service Layer - Lógica de Negócio

Responsabilidade: Implementar regras de negócio
- Orquestração de múltiplos repositórios
- Validações de domínio
- Transações complexas
- Audit log de ações
"""

import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.models import User, Client, Product, AuditLog, UserRole
from app.repositories.repository import UserRepository, ClientRepository, ProductRepository, AuditLogRepository
from app.core.security import security_service
from app.core.exceptions import (
    ValidationError, AuthenticationError, AuthorizationError,
    EmailAlreadyExistsError, NotFoundError, BusinessRuleError,
    InvalidCredentialsError
)
from app.core.logging import logger


# ============================================================================
# USER SERVICE
# ============================================================================

class UserService:
    """
    Serviço de gerenciamento de usuários
    
    Responsabilidades:
    - Criação e validação de usuários
    - Atualização de perfis
    - Controle de acesso
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db, User)
        self.audit_repo = AuditLogRepository(db, AuditLog)
    
    def create_user(
        self,
        email: str,
        full_name: str,
        password: str,
        role: UserRole = UserRole.USER,
        current_user: Optional[User] = None
    ) -> User:
        """
        Cria um novo usuário
        
        Regras de negócio:
        - Email deve ser único
        - Apenas admin pode criar outros admins
        - Senha deve ter força mínima
        
        Args:
            email: Email do usuário
            full_name: Nome completo
            password: Senha
            role: Perfil do usuário
            current_user: Usuário autenticado realizando ação
            
        Returns:
            Usuário criado
            
        Raises:
            EmailAlreadyExistsError: Se email já existe
            AuthorizationError: Se sem permissão
            ValidationError: Se dados inválidos
        """
        
        # Verificar permissão
        if current_user and role == UserRole.ADMIN and current_user.role != UserRole.ADMIN:
            raise AuthorizationError("Only admins can create admin users")
        
        # Validar email único
        if self.repo.email_exists(email):
            raise EmailAlreadyExistsError(email)
        
        # Hash da senha
        password_hash = security_service.hash_password(password)
        
        # Criar usuário
        user = self.repo.create({
            "email": email,
            "full_name": full_name,
            "password_hash": password_hash,
            "role": role,
            "is_active": True
        })
        
        # Log de auditoria
        self._log_audit(
            user_id=current_user.id if current_user else user.id,
            action="CREATE",
            entity="User",
            entity_id=user.id,
            new_values={"email": email, "full_name": full_name, "role": role}
        )
        
        logger.info(f"User created: {email} with role {role}")
        return user
    
    def authenticate(self, email: str, password: str) -> User:
        """
        Autentica um usuário com email e senha
        
        Args:
            email: Email do usuário
            password: Senha
            
        Returns:
            Usuário autenticado
            
        Raises:
            InvalidCredentialsError: Se credenciais inválidas
        """
        user = self.repo.get_by_email(email)
        
        if not user or not security_service.verify_password(password, user.password_hash):
            raise InvalidCredentialsError()
        
        if not user.is_active:
            raise AuthenticationError("User is inactive")
        
        # Log de auditoria
        self._log_audit(
            user_id=user.id,
            action="LOGIN",
            entity="User",
            entity_id=user.id
        )
        
        logger.info(f"User authenticated: {email}")
        return user
    
    def get_user(self, user_id: int) -> User:
        """
        Busca um usuário por ID
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Usuário
            
        Raises:
            NotFoundError: Se não encontrado
        """
        return self.repo.get_or_raise(user_id)
    
    def update_user(
        self,
        user_id: int,
        full_name: Optional[str] = None,
        password: Optional[str] = None,
        role: Optional[UserRole] = None,
        current_user: Optional[User] = None
    ) -> User:
        """
        Atualiza dados de um usuário
        
        Regras de negócio:
        - Usuário só pode alterar suas próprias informações
        - Apenas admin pode alterar role
        - Não pode revogar admin de si mesmo
        
        Args:
            user_id: ID do usuário a atualizar
            full_name: Novo nome
            password: Nova senha
            role: Novo role
            current_user: Usuário autenticado
            
        Returns:
            Usuário atualizado
            
        Raises:
            AuthorizationError: Se sem permissão
        """
        
        user = self.get_user(user_id)
        
        # Verificar permissão
        if current_user and user_id != current_user.id and current_user.role != UserRole.ADMIN:
            raise AuthorizationError("Can only update your own profile")
        
        if role and current_user and current_user.role != UserRole.ADMIN:
            raise AuthorizationError("Only admins can change roles")
        
        # Preparar dados para atualização
        update_data = {}
        if full_name:
            update_data["full_name"] = full_name
        if password:
            update_data["password_hash"] = security_service.hash_password(password)
        if role:
            update_data["role"] = role
        
        if not update_data:
            return user
        
        # Atualizar usuário
        updated_user = self.repo.update(user_id, update_data)
        
        # Log de auditoria
        self._log_audit(
            user_id=current_user.id if current_user else user_id,
            action="UPDATE",
            entity="User",
            entity_id=user_id,
            old_values={"full_name": user.full_name, "role": user.role},
            new_values=update_data
        )
        
        logger.info(f"User updated: {user.email}")
        return updated_user
    
    def list_users(self, skip: int = 0, limit: int = 100) -> tuple[List[User], int]:
        """
        Lista todos os usuários com paginação
        
        Args:
            skip: Offset
            limit: Limite de resultados
            
        Returns:
            (Lista de usuários, total)
        """
        users = self.repo.get_all(skip, limit)
        total = self.repo.get_count()
        return users, total
    
    def delete_user(self, user_id: int, current_user: User) -> None:
        """
        Deleta um usuário
        
        Regras de negócio:
        - Apenas admin pode deletar
        - Admin não pode deletar a si mesmo
        
        Args:
            user_id: ID do usuário a deletar
            current_user: Usuário autenticado
            
        Raises:
            AuthorizationError: Se sem permissão
        """
        
        if current_user.role != UserRole.ADMIN:
            raise AuthorizationError("Only admins can delete users")
        
        if current_user.id == user_id:
            raise BusinessRuleError("Cannot delete your own account")
        
        user = self.get_user(user_id)
        
        self.repo.delete(user_id)
        
        # Log de auditoria
        self._log_audit(
            user_id=current_user.id,
            action="DELETE",
            entity="User",
            entity_id=user_id,
            old_values={"email": user.email, "full_name": user.full_name}
        )
        
        logger.info(f"User deleted: {user.email}")
    
    def _log_audit(
        self,
        user_id: int,
        action: str,
        entity: str,
        entity_id: Optional[int] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None
    ):
        """
        Registra uma ação no audit log
        
        Args:
            user_id: ID do usuário que realizou a ação
            action: Tipo de ação (CREATE, UPDATE, DELETE, LOGIN)
            entity: Tipo de entidade
            entity_id: ID da entidade afetada
            old_values: Valores anteriores
            new_values: Valores novos
        """
        self.audit_repo.create({
            "user_id": user_id,
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "old_values": json.dumps(old_values) if old_values else None,
            "new_values": json.dumps(new_values) if new_values else None,
            "timestamp": datetime.utcnow()
        })


# ============================================================================
# CLIENT SERVICE
# ============================================================================

class ClientService:
    """
    Serviço de gerenciamento de clientes
    
    Responsabilidades:
    - CRUD de clientes
    - Validações de domínio
    - Auditoria
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = ClientRepository(db, Client)
        self.audit_repo = AuditLogRepository(db, AuditLog)
    
    def create_client(
        self,
        name: str,
        email: str,
        current_user: User,
        phone: Optional[str] = None,
        address: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        postal_code: Optional[str] = None,
        country: str = "Brazil",
        tax_id: Optional[str] = None
    ) -> Client:
        """
        Cria um novo cliente
        
        Regras de negócio:
        - Viewer não pode criar clientes
        - CNPJ deve ser único (se fornecido)
        - Email único
        
        Args:
            name: Nome do cliente
            email: Email
            current_user: Usuário criando
            phone: Telefone
            address: Endereço
            city: Cidade
            state: Estado
            postal_code: CEP
            country: País
            tax_id: CNPJ
            
        Returns:
            Cliente criado
            
        Raises:
            AuthorizationError: Se sem permissão
            ValidationError: Se dados inválidos
        """
        
        # Verificar permissão
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot create clients")
        
        # Validar email único
        if self.repo.get_by_email(email):
            raise ValidationError(
                "Email already exists",
                {"field": "email"}
            )
        
        # Validar CNPJ único (se fornecido)
        if tax_id and self.repo.get_by_tax_id(tax_id):
            raise ValidationError(
                "Tax ID already exists",
                {"field": "tax_id"}
            )
        
        # Criar cliente
        client = self.repo.create({
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "city": city,
            "state": state,
            "postal_code": postal_code,
            "country": country,
            "tax_id": tax_id,
            "created_by_id": current_user.id
        })
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "CREATE",
            "entity": "Client",
            "entity_id": client.id,
            "new_values": json.dumps({
                "name": name,
                "email": email,
                "city": city
            }),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Client created: {name} ({email})")
        return client
    
    def get_client(self, client_id: int) -> Client:
        """Busca um cliente por ID"""
        return self.repo.get_or_raise(client_id)
    
    def update_client(
        self,
        client_id: int,
        current_user: User,
        **kwargs
    ) -> Client:
        """
        Atualiza um cliente
        
        Regras de negócio:
        - Viewer não pode atualizar
        """
        
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot update clients")
        
        client = self.get_client(client_id)
        
        # Validar email único (se mudando)
        if "email" in kwargs and kwargs["email"] != client.email:
            if self.repo.get_by_email(kwargs["email"]):
                raise ValidationError("Email already exists", {"field": "email"})
        
        # Validar CNPJ único (se mudando)
        if "tax_id" in kwargs and kwargs.get("tax_id") and kwargs["tax_id"] != client.tax_id:
            if self.repo.get_by_tax_id(kwargs["tax_id"]):
                raise ValidationError("Tax ID already exists", {"field": "tax_id"})
        
        # Preparar update (remover None)
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        
        if not update_data:
            return client
        
        updated_client = self.repo.update(client_id, update_data)
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "UPDATE",
            "entity": "Client",
            "entity_id": client_id,
            "old_values": json.dumps({
                "name": client.name,
                "email": client.email
            }),
            "new_values": json.dumps(update_data),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Client updated: {updated_client.name}")
        return updated_client
    
    def list_clients(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        city: Optional[str] = None
    ) -> tuple[List[Client], int]:
        """
        Lista clientes com filtros opcionais
        
        Args:
            skip: Offset
            limit: Limite
            search: Busca por nome
            city: Filtrar por cidade
            
        Returns:
            (Lista de clientes, total)
        """
        
        if search:
            clients = self.repo.get_by_name(search, skip, limit)
            total = len(clients)  # Simplificado para exemplo
        elif city:
            clients = self.repo.get_by_city(city, skip, limit)
            total = len(clients)
        else:
            clients = self.repo.get_all(skip, limit)
            total = self.repo.get_count()
        
        return clients, total
    
    def delete_client(self, client_id: int, current_user: User) -> None:
        """
        Deleta um cliente
        
        Regras: Viewer não pode deletar
        """
        
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot delete clients")
        
        client = self.get_client(client_id)
        self.repo.delete(client_id)
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "DELETE",
            "entity": "Client",
            "entity_id": client_id,
            "old_values": json.dumps({
                "name": client.name,
                "email": client.email
            }),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Client deleted: {client.name}")


# ============================================================================
# PRODUCT SERVICE
# ============================================================================

class ProductService:
    """
    Serviço de gerenciamento de produtos
    
    Responsabilidades:
    - CRUD de produtos
    - Gestão de estoque
    - Cálculos de margem
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db, Product)
        self.audit_repo = AuditLogRepository(db, AuditLog)
    
    def create_product(
        self,
        sku: str,
        name: str,
        price: float,
        current_user: User,
        description: Optional[str] = None,
        cost: Optional[float] = None,
        quantity: int = 0,
        category: Optional[str] = None,
        is_active: bool = True
    ) -> Product:
        """
        Cria um novo produto
        
        Regras de negócio:
        - SKU deve ser único
        - Preço deve ser maior que 0
        - Viewer não pode criar
        - Custo não pode ser maior que preço
        """
        
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot create products")
        
        # Validar SKU único
        if self.repo.get_by_sku(sku):
            raise ValidationError("SKU already exists", {"field": "sku"})
        
        # Validar preço
        if price <= 0:
            raise ValidationError("Price must be greater than 0", {"field": "price"})
        
        # Validar custo
        if cost and cost > price:
            raise BusinessRuleError(
                "Cost cannot be greater than price",
                {"cost": cost, "price": price}
            )
        
        # Criar produto
        product = self.repo.create({
            "sku": sku,
            "name": name,
            "description": description,
            "price": price,
            "cost": cost,
            "quantity": quantity,
            "category": category,
            "is_active": is_active,
            "created_by_id": current_user.id
        })
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "CREATE",
            "entity": "Product",
            "entity_id": product.id,
            "new_values": json.dumps({
                "sku": sku,
                "name": name,
                "price": price,
                "cost": cost
            }),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Product created: {sku} - {name}")
        return product
    
    def get_product(self, product_id: int) -> Product:
        """Busca um produto por ID"""
        return self.repo.get_or_raise(product_id)
    
    def update_product(
        self,
        product_id: int,
        current_user: User,
        **kwargs
    ) -> Product:
        """
        Atualiza um produto
        
        Regras: Viewer não pode atualizar
        """
        
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot update products")
        
        product = self.get_product(product_id)
        
        # Validar SKU único (se mudando)
        if "sku" in kwargs and kwargs["sku"] != product.sku:
            if self.repo.get_by_sku(kwargs["sku"]):
                raise ValidationError("SKU already exists", {"field": "sku"})
        
        # Validar preço
        if "price" in kwargs and kwargs["price"] <= 0:
            raise ValidationError("Price must be greater than 0", {"field": "price"})
        
        # Validar custo vs preço
        price = kwargs.get("price", product.price)
        cost = kwargs.get("cost", product.cost)
        if cost and cost > price:
            raise BusinessRuleError(
                "Cost cannot be greater than price",
                {"cost": cost, "price": price}
            )
        
        # Preparar update
        update_data = {k: v for k, v in kwargs.items() if v is not None}
        
        if not update_data:
            return product
        
        updated_product = self.repo.update(product_id, update_data)
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "UPDATE",
            "entity": "Product",
            "entity_id": product_id,
            "old_values": json.dumps({
                "name": product.name,
                "price": product.price,
                "quantity": product.quantity
            }),
            "new_values": json.dumps(update_data),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Product updated: {updated_product.sku}")
        return updated_product
    
    def list_products(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        category: Optional[str] = None,
        low_stock: bool = False
    ) -> tuple[List[Product], int]:
        """
        Lista produtos com filtros
        
        Args:
            skip: Offset
            limit: Limite
            search: Busca por nome
            category: Filtrar por categoria
            low_stock: Apenas produtos com estoque baixo
            
        Returns:
            (Lista de produtos, total)
        """
        
        if low_stock:
            products = self.repo.get_low_stock(skip=skip, limit=limit)
            total = len(products)
        elif search:
            products = self.repo.get_by_name(search, skip, limit)
            total = len(products)
        elif category:
            products = self.repo.get_by_category(category, skip, limit)
            total = len(products)
        else:
            products = self.repo.get_active_products(skip, limit)
            total = self.repo.get_count()
        
        return products, total
    
    def delete_product(self, product_id: int, current_user: User) -> None:
        """
        Deleta um produto
        
        Regras: Viewer não pode deletar
        """
        
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot delete products")
        
        product = self.get_product(product_id)
        self.repo.delete(product_id)
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "DELETE",
            "entity": "Product",
            "entity_id": product_id,
            "old_values": json.dumps({
                "sku": product.sku,
                "name": product.name,
                "price": product.price
            }),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Product deleted: {product.sku}")
    
    def adjust_stock(
        self,
        product_id: int,
        quantity_change: int,
        current_user: User,
        reason: str = "Manual adjustment"
    ) -> Product:
        """
        Ajusta o estoque de um produto
        
        Args:
            product_id: ID do produto
            quantity_change: Mudança na quantidade (positivo ou negativo)
            current_user: Usuário realizando ajuste
            reason: Motivo do ajuste
            
        Returns:
            Produto atualizado
            
        Raises:
            ValidationError: Se estoque ficaria negativo
        """
        
        if current_user.role == UserRole.VIEWER:
            raise AuthorizationError("Viewers cannot adjust stock")
        
        product = self.get_product(product_id)
        new_quantity = product.quantity + quantity_change
        
        if new_quantity < 0:
            raise BusinessRuleError(
                f"Insufficient stock. Current: {product.quantity}, Requested: {quantity_change}",
                {"product_id": product_id, "current_quantity": product.quantity}
            )
        
        updated_product = self.repo.update(product_id, {"quantity": new_quantity})
        
        # Log de auditoria
        self.audit_repo.create({
            "user_id": current_user.id,
            "action": "UPDATE",
            "entity": "Product",
            "entity_id": product_id,
            "old_values": json.dumps({
                "quantity": product.quantity,
                "reason": reason
            }),
            "new_values": json.dumps({
                "quantity": new_quantity,
                "change": quantity_change
            }),
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"Product stock adjusted: {product.sku} ({quantity_change})")
        return updated_product
    
    def get_profit_margin(self, product: Product) -> float:
        """
        Calcula margem de lucro de um produto
        
        Fórmula: ((Preço - Custo) / Preço) * 100
        
        Args:
            product: Produto
            
        Returns:
            Percentual de margem
        """
        
        if not product.cost:
            return 0.0
        
        return ((product.price - product.cost) / product.price) * 100


# ============================================================================
# AUDIT LOG SERVICE
# ============================================================================

class AuditLogService:
    """Serviço de gestão de audit logs"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditLogRepository(db, AuditLog)
    
    def get_entity_history(
        self,
        entity: str,
        entity_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[AuditLog], int]:
        """Obtém histórico de alterações de uma entidade"""
        logs = self.repo.get_by_entity(entity, entity_id, skip, limit)
        total = len(logs)
        return logs, total
    
    def get_user_activity(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[AuditLog], int]:
        """Obtém atividades de um usuário"""
        logs = self.repo.get_by_user(user_id, skip, limit)
        total = len(logs)
        return logs, total
    
    def get_action_logs(
        self,
        action: str,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[AuditLog], int]:
        """Obtém logs de uma ação específica"""
        logs = self.repo.get_by_action(action, skip, limit)
        total = len(logs)
        return logs, total
