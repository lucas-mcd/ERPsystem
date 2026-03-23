"""
Dependências de autenticação e autorização

Responsabilidade: Injetar usuário autenticado nos endpoints
- Validar tokens JWT
- Verificar permissões
- Retornar usuário autenticado
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from starlette.authentication import AuthCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import security_service
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.models import User, UserRole
from app.services.service import UserService

# Esquema de segurança HTTP Bearer
security = HTTPBearer()


async def get_current_user(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency para obter usuário autenticado via token JWT
    
    Uso em endpoints:
    @app.get("/protected")
    async def protected_route(current_user: User = Depends(get_current_user)):
        return {"user": current_user}
    
    Args:
        credentials: Credenciais HTTP Bearer com token JWT
        db: Sessão do banco
        
    Returns:
        Usuário autenticado
        
    Raises:
        HTTPException: Se token inválido ou expirado
    """
    try:
        token = credentials.credentials
        
        # Decodificar token JWT
        payload = security_service.decode_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise AuthenticationError("Invalid token")
        
        # Converter user_id para int
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            raise AuthenticationError("Invalid token")
        
        # Buscar usuário no banco
        user_service = UserService(db)
        user = user_service.get_user(user_id)
        
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        return user
    
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e.message),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency para requerer admin
    
    Uso:
    @app.delete("/admin-only")
    async def admin_route(current_user: User = Depends(get_current_admin)):
        return {"message": "Admin access"}
    
    Args:
        current_user: Usuário autenticado
        
    Returns:
        Usuário autenticado com role admin
        
    Raises:
        HTTPException: Se não é admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this resource"
        )
    return current_user


async def get_current_user_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency para requerer user ou admin
    
    Args:
        current_user: Usuário autenticado
        
    Returns:
        Usuário autenticado (user ou admin)
        
    Raises:
        HTTPException: Se é viewer
    """
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers can only read data"
        )
    return current_user


async def require_permission(*roles: UserRole):
    """
    Dependency factory para requerer múltiplos roles
    
    Uso:
    @app.get("/resource")
    async def resource_endpoint(
        current_user: User = Depends(require_permission(UserRole.ADMIN, UserRole.USER))
    ):
        return {"message": "You have permission"}
    
    Args:
        *roles: Roles permitidos
        
    Returns:
        Dependency function
    """
    async def check_permission(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires one of these roles: {', '.join([r.value for r in roles])}"
            )
        return current_user
    
    return check_permission
