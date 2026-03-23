"""
Repository Pattern - Camada de Acesso a Dados

Responsabilidade: Abstrair acesso ao banco de dados
- Queries reutilizáveis
- Operações CRUD genéricas
- Isolamento da lógica de persistência
"""

from typing import TypeVar, Generic, List, Optional, Type, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from app.core.exceptions import NotFoundError, ConflictError

# Type variables para generic repository
T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Repository base genérico com operações CRUD comuns
    
    Benefícios:
    - Reduz duplicação de código
    - Padroniza operações de banco
    - Facilita testes e mockagem
    - Isolamento de complexidade SQL
    """
    
    def __init__(self, db: Session, model: Type[T]):
        self.db = db
        self.model = model
    
    def create(self, obj_in: Dict[str, Any]) -> T:
        """
        Cria um novo registro
        
        Args:
            obj_in: Dicionário com dados do objeto
            
        Returns:
            Objeto criado
        """
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def get_by_id(self, id: int) -> Optional[T]:
        """
        Busca um registro por ID
        
        Args:
            id: ID do registro
            
        Returns:
            Objeto ou None se não encontrado
        """
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_or_raise(self, id: int) -> T:
        """
        Busca um registro por ID ou lança exceção
        
        Args:
            id: ID do registro
            
        Returns:
            Objeto encontrado
            
        Raises:
            NotFoundError: Se não encontrado
        """
        obj = self.get_by_id(id)
        if not obj:
            raise NotFoundError(self.model.__name__, id)
        return obj
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        Lista todos os registros com paginação
        
        Args:
            skip: Quantidade de registros a pular
            limit: Limite de registros a retornar
            
        Returns:
            Lista de objetos
        """
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def get_count(self) -> int:
        """
        Retorna total de registros
        
        Returns:
            Total de registros
        """
        return self.db.query(self.model).count()
    
    def update(self, id: int, obj_in: Dict[str, Any]) -> T:
        """
        Atualiza um registro
        
        Args:
            id: ID do registro
            obj_in: Dicionário com dados a atualizar
            
        Returns:
            Objeto atualizado
            
        Raises:
            NotFoundError: Se não encontrado
        """
        db_obj = self.get_or_raise(id)
        
        # Atualizar apenas campos fornecidos
        for key, value in obj_in.items():
            if value is not None:
                setattr(db_obj, key, value)
        
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: int) -> None:
        """
        Deleta um registro
        
        Args:
            id: ID do registro
            
        Raises:
            NotFoundError: Se não encontrado
        """
        db_obj = self.get_or_raise(id)
        self.db.delete(db_obj)
        self.db.commit()
    
    def exists(self, **filters) -> bool:
        """
        Verifica se um registro existe com os filtros especificados
        
        Args:
            **filters: Filtros a aplicar
            
        Returns:
            True se existe
        """
        return self.db.query(self.model).filter_by(**filters).first() is not None


# ============================================================================
# USER REPOSITORY
# ============================================================================

class UserRepository(BaseRepository):
    """Repository específico para usuários"""
    
    def get_by_email(self, email: str) -> Optional:
        """
        Busca usuário por email
        
        Args:
            email: Email do usuário
            
        Returns:
            Usuário ou None
        """
        return self.db.query(self.model).filter(self.model.email == email).first()
    
    def get_by_email_or_raise(self, email: str):
        """
        Busca usuário por email ou lança exceção
        
        Args:
            email: Email do usuário
            
        Returns:
            Usuário
            
        Raises:
            NotFoundError: Se não encontrado
        """
        user = self.get_by_email(email)
        if not user:
            raise NotFoundError("User", email)
        return user
    
    def email_exists(self, email: str) -> bool:
        """
        Verifica se email já existe
        
        Args:
            email: Email a verificar
            
        Returns:
            True se existe
        """
        return self.exists(email=email)
    
    def get_active_users(self, skip: int = 0, limit: int = 100) -> List:
        """
        Retorna apenas usuários ativos
        
        Args:
            skip: Paginação - offset
            limit: Paginação - limite
            
        Returns:
            Lista de usuários ativos
        """
        return (
            self.db.query(self.model)
            .filter(self.model.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )


# ============================================================================
# CLIENT REPOSITORY
# ============================================================================

class ClientRepository(BaseRepository):
    """Repository específico para clientes"""
    
    def get_by_tax_id(self, tax_id: str):
        """
        Busca cliente por ID fiscal (CNPJ)
        
        Args:
            tax_id: CNPJ ou ID fiscal
            
        Returns:
            Cliente ou None
        """
        return self.db.query(self.model).filter(self.model.tax_id == tax_id).first()
    
    def get_by_name(self, name: str, skip: int = 0, limit: int = 100) -> List:
        """
        Busca clientes por nome (busca parcial)
        
        Args:
            name: Nome para buscar
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de clientes
        """
        return (
            self.db.query(self.model)
            .filter(self.model.name.ilike(f"%{name}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_email(self, email: str):
        """
        Busca cliente por email
        
        Args:
            email: Email do cliente
            
        Returns:
            Cliente ou None
        """
        return self.db.query(self.model).filter(self.model.email == email).first()
    
    def get_by_city(self, city: str, skip: int = 0, limit: int = 100) -> List:
        """
        Busca clientes por cidade
        
        Args:
            city: Cidade para buscar
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de clientes
        """
        return (
            self.db.query(self.model)
            .filter(self.model.city == city)
            .offset(skip)
            .limit(limit)
            .all()
        )


# ============================================================================
# PRODUCT REPOSITORY
# ============================================================================

class ProductRepository(BaseRepository):
    """Repository específico para produtos"""
    
    def get_by_sku(self, sku: str):
        """
        Busca produto por SKU
        
        Args:
            sku: SKU do produto
            
        Returns:
            Produto ou None
        """
        return self.db.query(self.model).filter(self.model.sku == sku).first()
    
    def get_by_name(self, name: str, skip: int = 0, limit: int = 100) -> List:
        """
        Busca produtos por nome (busca parcial)
        
        Args:
            name: Nome para buscar
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de produtos
        """
        return (
            self.db.query(self.model)
            .filter(self.model.name.ilike(f"%{name}%"), self.model.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List:
        """
        Busca produtos por categoria
        
        Args:
            category: Categoria para filtrar
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de produtos
        """
        return (
            self.db.query(self.model)
            .filter(self.model.category == category, self.model.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_low_stock(self, min_quantity: int = 10, skip: int = 0, limit: int = 100) -> List:
        """
        Busca produtos com estoque baixo
        
        Args:
            min_quantity: Quantidade mínima de alarme
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de produtos com estoque baixo
        """
        return (
            self.db.query(self.model)
            .filter(self.model.quantity <= min_quantity, self.model.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_active_products(self, skip: int = 0, limit: int = 100) -> List:
        """
        Retorna apenas produtos ativos
        
        Args:
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de produtos ativos
        """
        return (
            self.db.query(self.model)
            .filter(self.model.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )


# ============================================================================
# AUDIT LOG REPOSITORY
# ============================================================================

class AuditLogRepository(BaseRepository):
    """Repository específico para audit logs"""
    
    def get_by_entity(self, entity: str, entity_id: int, skip: int = 0, limit: int = 100) -> List:
        """
        Busca audit logs por entidade
        
        Args:
            entity: Tipo de entidade (User, Client, Product)
            entity_id: ID da entidade
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de audit logs
        """
        return (
            self.db.query(self.model)
            .filter(self.model.entity == entity, self.model.entity_id == entity_id)
            .order_by(desc(self.model.timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List:
        """
        Busca audit logs por usuário
        
        Args:
            user_id: ID do usuário
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de audit logs
        """
        return (
            self.db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(desc(self.model.timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_action(self, action: str, skip: int = 0, limit: int = 100) -> List:
        """
        Busca audit logs por tipo de ação
        
        Args:
            action: Tipo de ação (CREATE, UPDATE, DELETE, LOGIN)
            skip: Paginação
            limit: Limite de resultados
            
        Returns:
            Lista de audit logs
        """
        return (
            self.db.query(self.model)
            .filter(self.model.action == action)
            .order_by(desc(self.model.timestamp))
            .offset(skip)
            .limit(limit)
            .all()
        )
