"""
Rotas de Usuários (Admin)

Responsabilidade: CRUD de usuários
- Criar novo usuário
- Listar usuários
- Obter usuário específico
- Atualizar usuário
- Deletar usuário
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.models import User, UserRole
from app.schemas.schemas import (
    UserCreate, UserResponse, UserUpdate, UserDetailResponse
)
from app.services.service import UserService
from app.api.dependencies.auth import get_current_admin, get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo usuário",
    dependencies=[Depends(get_current_admin)]
)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Criar novo usuário (Admin only)
    
    Request body:
    ```json
    {
        "email": "newuser@example.com",
        "full_name": "Jane Doe",
        "password": "SecurePass123",
        "role": "user"
    }
    ```
    """
    try:
        user_service = UserService(db)
        user = user_service.create_user(
            email=user_in.email,
            full_name=user_in.full_name,
            password=user_in.password,
            role=user_in.role,
            current_user=current_user
        )
        return user
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Listar usuários",
    dependencies=[Depends(get_current_admin)]
)
async def list_users(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Limit"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Listar todos os usuários (Admin only)
    
    Query parameters:
    - skip: Número de registros a pular (padrão: 0)
    - limit: Máximo de registros a retornar (padrão: 100, máx: 500)
    
    Response:
    ```json
    {
        "total": 42,
        "page": 1,
        "page_size": 100,
        "items": [
            {
                "id": 1,
                "email": "user@example.com",
                "full_name": "John Doe",
                "role": "admin",
                "is_active": true,
                "created_at": "2024-01-01T12:00:00",
                "updated_at": "2024-01-01T12:00:00"
            }
        ]
    }
    ```
    """
    user_service = UserService(db)
    users, total = user_service.list_users(skip, limit)
    
    return {
        "total": total,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit,
        "items": users
    }


@router.get(
    "/{user_id}",
    response_model=UserDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter usuário específico",
    dependencies=[Depends(get_current_admin)]
)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Obter dados de um usuário específico (Admin only)
    
    Path parameters:
    - user_id: ID do usuário
    """
    try:
        user_service = UserService(db)
        user = user_service.get_user(user_id)
        return user
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar usuário"
)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar usuário
    
    Regras:
    - Usuário pode atualizar sua própria conta
    - Admin pode atualizar qualquer usuário
    - Apenas admin pode alterar role
    
    Request body:
    ```json
    {
        "full_name": "Jane Smith",
        "password": "NewPassword123",
        "role": "user"
    }
    ```
    """
    try:
        user_service = UserService(db)
        user = user_service.update_user(
            user_id=user_id,
            full_name=user_in.full_name,
            password=user_in.password,
            role=user_in.role,
            current_user=current_user
        )
        return user
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar usuário",
    dependencies=[Depends(get_current_admin)]
)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Deletar um usuário (Admin only)
    
    Regras:
    - Admin não pode deletar a si mesmo
    - Usuários deletados não podem ser recuperados
    
    Path parameters:
    - user_id: ID do usuário a deletar
    """
    try:
        user_service = UserService(db)
        user_service.delete_user(user_id, current_user)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
