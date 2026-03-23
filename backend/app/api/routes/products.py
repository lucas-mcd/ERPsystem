"""
Rotas de Produtos

Responsabilidade: CRUD de produtos e gestão de estoque
- Criar produto
- Listar produtos (com filtros)
- Obter produto específico
- Atualizar produto
- Deletar produto
- Ajustar estoque
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.models import User
from app.schemas.schemas import (
    ProductCreate, ProductResponse, ProductUpdate, ProductDetailResponse,
    ProductListResponse
)
from app.services.service import ProductService
from app.api.dependencies.auth import get_current_user, get_current_user_or_admin

router = APIRouter()


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo produto",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Criar novo produto (User e Admin)
    
    Regras:
    - Viewers não podem criar produtos
    - SKU deve ser único
    - Preço deve ser maior que 0
    - Custo não pode ser maior que preço
    
    Request body:
    ```json
    {
        "sku": "PROD-001",
        "name": "Produto Premium",
        "description": "Descrição detalhada do produto",
        "price": 99.99,
        "cost": 50.00,
        "quantity": 100,
        "category": "Eletrônicos",
        "is_active": true
    }
    ```
    """
    try:
        product_service = ProductService(db)
        product = product_service.create_product(
            sku=product_in.sku,
            name=product_in.name,
            price=product_in.price,
            description=product_in.description,
            cost=product_in.cost,
            quantity=product_in.quantity,
            category=product_in.category,
            is_active=product_in.is_active,
            current_user=current_user
        )
        return product
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "",
    response_model=ProductListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar produtos",
    dependencies=[Depends(get_current_user)]
)
async def list_products(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Limit"),
    search: str = Query(None, min_length=1, description="Buscar por nome"),
    category: str = Query(None, description="Filtrar por categoria"),
    low_stock: bool = Query(False, description="Apenas produtos com estoque baixo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar produtos (Todos os usuários autenticados)
    
    Query parameters:
    - skip: Número de registros a pular (padrão: 0)
    - limit: Máximo de registros a retornar (padrão: 100, máx: 500)
    - search: Buscar por nome (busca parcial)
    - category: Filtrar por categoria
    - low_stock: Apenas produtos com estoque baixo
    
    Response:
    ```json
    {
        "total": 150,
        "page": 1,
        "page_size": 100,
        "items": [
            {
                "id": 1,
                "sku": "PROD-001",
                "name": "Produto Premium",
                "price": 99.99,
                "quantity": 100,
                "category": "Eletrônicos"
            }
        ]
    }
    ```
    """
    product_service = ProductService(db)
    products, total = product_service.list_products(
        skip, limit, search, category, low_stock
    )
    
    return ProductListResponse(
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        items=products
    )


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter produto específico",
    dependencies=[Depends(get_current_user)]
)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter dados de um produto específico
    
    Path parameters:
    - product_id: ID do produto
    
    Response inclui margem de lucro calculada
    """
    try:
        product_service = ProductService(db)
        product = product_service.get_product(product_id)
        
        # Adicionar margem de lucro
        response = ProductDetailResponse(**{
            **product.__dict__,
            "margin": product_service.get_profit_margin(product)
        })
        return response
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar produto",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Atualizar produto (User e Admin)
    
    Regras:
    - Viewers não podem atualizar
    - SKU deve ser único
    - Custo não pode ser maior que preço
    
    Request body (todos os campos opcionais):
    ```json
    {
        "name": "Produto Premium Updated",
        "price": 109.99,
        "quantity": 95
    }
    ```
    """
    try:
        product_service = ProductService(db)
        product = product_service.update_product(
            product_id=product_id,
            current_user=current_user,
            **product_in.model_dump(exclude_unset=True)
        )
        return product
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar produto",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Deletar um produto (User e Admin)
    
    Regras:
    - Viewers não podem deletar
    - Produtos deletados não podem ser recuperados
    
    Path parameters:
    - product_id: ID do produto a deletar
    """
    try:
        product_service = ProductService(db)
        product_service.delete_product(product_id, current_user)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post(
    "/{product_id}/adjust-stock",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Ajustar estoque do produto",
    dependencies=[Depends(get_current_user_or_admin)]
)
async def adjust_product_stock(
    product_id: int,
    quantity_change: int = Query(..., description="Mudança na quantidade (positivo ou negativo)"),
    reason: str = Query("Manual adjustment", description="Motivo do ajuste"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_or_admin)
):
    """
    Ajustar estoque de um produto (User e Admin)
    
    Query parameters:
    - quantity_change: Quantidade a adicionar/subtrair (inteiro, pode ser negativo)
    - reason: Motivo do ajuste (ex: "Devolvido pelo cliente", "Perda por danos")
    
    Regras:
    - Estoque não pode ficar negativo
    - Todas as mudanças são auditadas
    
    Response:
    ```json
    {
        "id": 1,
        "sku": "PROD-001",
        "name": "Produto Premium",
        "quantity": 95,
        "price": 99.99
    }
    ```
    """
    try:
        product_service = ProductService(db)
        product = product_service.adjust_stock(
            product_id=product_id,
            quantity_change=quantity_change,
            current_user=current_user,
            reason=reason
        )
        return product
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
