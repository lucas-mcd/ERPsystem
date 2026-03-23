"""
Rotas de Autenticação

Responsabilidade: Endpoints para autenticação e tokens JWT
- Login (obter token)
- Logout (invalidar sessão)
- Refresh token
- Get current user
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import security_service
from app.core.exceptions import InvalidCredentialsError
from app.core.sanitization import sanitizer
from app.core.rate_limiter import rate_limiter, RATE_LIMITS
from app.models.models import User
from app.schemas.schemas import (
    LoginRequest, TokenResponse, CurrentUserResponse, UserResponse
)
from app.services.service import UserService
from app.api.dependencies.auth import get_current_user

router = APIRouter()


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login de usuário",
    description="Realiza autenticação e retorna token JWT"
)
async def login(
    request: LoginRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """
    Endpoint de Login com proteção contra força bruta
    
    Recebe email e senha, autentica usuário e retorna token JWT.
    Aplicar rate limiting para prevenir ataques de força bruta.
    
    Request body:
    ```json
    {
        "email": "user@example.com",
        "password": "SecurePass123"
    }
    ```
    
    Response:
    ```json
    {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "bearer",
        "expires_in": 1800
    }
    ```
    """
    # Sanitizar email (apenas strip e lower, sem escapar HTML)
    email = request.email.strip().lower()
    password = request.password  # Não sanitizar senha (pode conter caracteres especiais)
    
    # Obter IP do cliente (remoto ou proxy)
    client_ip = http_request.client.host if http_request.client else "unknown"
    
    # Rate limiting por IP + email
    rate_key = f"{client_ip}:{email}"
    is_limited, attempts_left = rate_limiter.is_rate_limited(
        rate_key,
        max_attempts=RATE_LIMITS["login"]["max_attempts"],
        window_minutes=RATE_LIMITS["login"]["window_minutes"]
    )
    
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please try again in {RATE_LIMITS['login']['window_minutes']} minutes.",
            headers={"Retry-After": str(RATE_LIMITS["login"]["window_minutes"] * 60)},
        )
    
    try:
        user_service = UserService(db)
        
        # Autenticar usuário
        user = user_service.authenticate(email, password)
        
        # Reset rate limiter após sucesso
        rate_limiter.reset(rate_key)
        
        # Criar token JWT
        access_token_expires = timedelta(minutes=30)
        access_token = security_service.create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role.value},
            expires_delta=access_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=1800  # 30 minutos em segundos
        )
    
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter usuário autenticado",
    description="Retorna dados do usuário autenticado"
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para obter dados do usuário autenticado
    
    Requer token JWT válido no header:
    ```
    Authorization: Bearer <token>
    ```
    
    Response:
    ```json
    {
        "id": 1,
        "email": "user@example.com",
        "full_name": "John Doe",
        "role": "admin",
        "is_active": true
    }
    ```
    """
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout de usuário",
    description="Invalida token do usuário (client-side)"
)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de Logout
    
    Nota: JWT não mantém estado no servidor. O logout é
    implementado no cliente removendo o token.
    Este endpoint serve apenas para logging de auditoria.
    
    Response:
    ```json
    {
        "message": "Successfully logged out"
    }
    ```
    """
    return {"message": "Successfully logged out"}
