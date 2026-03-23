"""
Rotas de Clientes

Responsabilidade: CRUD de clientes
- Criar cliente
- Listar clientes (com busca)
- Obter cliente específico
- Atualizar cliente
- Deletar cliente
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.models import User
from app.schemas.schemas import (
    ClientCreate, ClientResponse, ClientUpdate, ClientDetailResponse,
    ClientListResponse
)
from app.services.service import ClientService
from app.api.dependencies.auth import get_current_user, get_current_user_or_admin

router = APIRouter()


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo cliente",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Criar novo cliente (User e Admin)
    
    Regras:
    - Viewers não podem criar clientes
    - Email e CNPJ devem ser únicos
    
    Request body:
    ```json
    {
        "name": "ACME Corporation",
        "email": "contact@acme.com",
        "phone": "+55 11 98765-4321",
        "address": "Rua Principal, 123",
        "city": "São Paulo",
        "state": "SP",
        "postal_code": "01234-567",
        "country": "Brazil",
        "tax_id": "12.345.678/0001-90"
    }
    ```
    """
    try:
        client_service = ClientService(db)
        client = client_service.create_client(
            name=client_in.name,
            email=client_in.email,
            phone=client_in.phone,
            address=client_in.address,
            city=client_in.city,
            state=client_in.state,
            postal_code=client_in.postal_code,
            country=client_in.country,
            tax_id=client_in.tax_id,
            current_user=current_user
        )
        return client
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "",
    response_model=ClientListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar clientes",
    dependencies=[Depends(get_current_user)]
)
async def list_clients(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Limit"),
    search: str = Query(None, min_length=1, description="Buscar por nome"),
    city: str = Query(None, description="Filtrar por cidade"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar clientes (Todos os usuários autenticados)
    
    Query parameters:
    - skip: Número de registros a pular (padrão: 0)
    - limit: Máximo de registros a retornar (padrão: 100, máx: 500)
    - search: Buscar por nome (busca parcial)
    - city: Filtrar por cidade
    
    Response:
    ```json
    {
        "total": 42,
        "page": 1,
        "page_size": 100,
        "items": [
            {
                "id": 1,
                "name": "ACME Corp",
                "email": "contact@acme.com",
                "phone": "+55 11 98765-4321",
                "city": "São Paulo",
                "created_at": "2024-01-01T12:00:00"
            }
        ]
    }
    ```
    """
    client_service = ClientService(db)
    clients, total = client_service.list_clients(skip, limit, search, city)
    
    return ClientListResponse(
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        items=clients
    )


@router.get(
    "/{client_id}",
    response_model=ClientDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter cliente específico",
    dependencies=[Depends(get_current_user)]
)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter dados de um cliente específico
    
    Path parameters:
    - client_id: ID do cliente
    """
    try:
        client_service = ClientService(db)
        client = client_service.get_client(client_id)
        return client
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put(
    "/{client_id}",
    response_model=ClientResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar cliente",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def update_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Atualizar cliente (User e Admin)
    
    Regras:
    - Viewers não podem atualizar
    - Email e CNPJ devem ser únicos
    
    Request body (todos os campos opcionais):
    ```json
    {
        "name": "ACME Corporation Updated",
        "email": "newemail@acme.com",
        "phone": "+55 11 99999-9999"
    }
    ```
    """
    try:
        client_service = ClientService(db)
        client = client_service.update_client(
            client_id=client_id,
            current_user=current_user,
            **client_in.model_dump(exclude_unset=True)
        )
        return client
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete(
    "/{client_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar cliente",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Deletar um cliente (User e Admin)
    
    Regras:
    - Viewers não podem deletar
    - Clientes deletados não podem ser recuperados
    
    Path parameters:
    - client_id: ID do cliente a deletar
    """
    try:
        client_service = ClientService(db)
        client_service.delete_client(client_id, current_user)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
