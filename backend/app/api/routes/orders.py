"""
Rotas de Pedidos

Responsabilidade: CRUD de pedidos
- Criar pedido
- Listar pedidos
- Obter pedido específico
- Atualizar pedido
- Deletar pedido
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.models import User, Order, OrderItem
from app.schemas.schemas import (
    OrderCreate, OrderResponse, OrderDetailResponse, OrderListResponse
)
from app.api.dependencies.auth import get_current_user

router = APIRouter()


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo pedido",
    dependencies=[Depends(get_current_user)]
)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo pedido (Usuários autenticados)
    
    Registra um novo pedido com o usuário logado como criador
    
    Request body:
    ```json
    {
        "client_name": "João Silva",
        "total_amount": 1500.00,
        "items_count": 3,
        "status": "pending"
    }
    ```
    """
    try:
        new_order = Order(
            client_name=order_in.client_name,
            total_amount=order_in.total_amount,
            items_count=order_in.items_count,
            status=order_in.status,
            created_by_id=current_user.id
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        # Salvar itens do pedido
        if order_in.items:
            for item_data in order_in.items:
                order_item = OrderItem(
                    order_id=new_order.id,
                    product_name=item_data.get('product_name'),
                    quantity=item_data.get('quantity'),
                    price=item_data.get('price')
                )
                db.add(order_item)
            db.commit()
            db.refresh(new_order)
        
        return new_order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar pedido: {str(e)}"
        )


@router.get(
    "",
    response_model=OrderListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar pedidos",
    dependencies=[Depends(get_current_user)]
)
async def list_orders(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Limit"),
    status_filter: str = Query(None, description="Filtrar por status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar pedidos (Usuários autenticados)
    
    Query parameters:
    - skip: Número de registros a pular (padrão: 0)
    - limit: Máximo de registros a retornar (padrão: 100, máx: 500)
    - status_filter: Filtrar por status (pending, processing, completed, cancelled)
    """
    query = db.query(Order)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    total = query.count()
    orders = query.offset(skip).limit(limit).all()
    
    # Enriquecer cada pedido com informações do usuário criador
    enriched_orders = []
    for order in orders:
        creator = db.query(User).filter(User.id == order.created_by_id).first()
        order_dict = {
            'id': order.id,
            'client_name': order.client_name,
            'total_amount': order.total_amount,
            'items_count': order.items_count,
            'status': order.status,
            'created_by_id': order.created_by_id,
            'created_by_email': creator.email if creator else 'Desconhecido',
            'created_by_name': creator.full_name if creator else 'Desconhecido',
            'created_at': order.created_at,
            'updated_at': order.updated_at,
            'items': [
                {
                    'id': item.id,
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'price': item.price
                }
                for item in order.items
            ] if order.items else []
        }
        enriched_orders.append(order_dict)
    
    return OrderListResponse(
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        items=enriched_orders
    )


@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter pedido específico",
    dependencies=[Depends(get_current_user)]
)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter pedido específico com detalhes do usuário criador
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido #{order_id} não encontrado"
        )
    
    # Obter informações do usuário criador
    creator = db.query(User).filter(User.id == order.created_by_id).first()
    
    # Montar resposta com dados do usuário criador
    order_data = {
        'id': order.id,
        'client_name': order.client_name,
        'total_amount': order.total_amount,
        'items_count': order.items_count,
        'status': order.status,
        'created_by_id': order.created_by_id,
        'created_by_email': creator.email if creator else 'Desconhecido',
        'created_by_name': creator.full_name if creator else 'Desconhecido',
        'created_at': order.created_at,
        'updated_at': order.updated_at,
        'items': [
            {
                'id': item.id,
                'product_name': item.product_name,
                'quantity': item.quantity,
                'price': item.price
            }
            for item in order.items
        ] if order.items else []
    }
    
    return order_data


@router.put(
    "/{order_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar pedido",
    dependencies=[Depends(get_current_user)]
)
async def update_order(
    order_id: int,
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar pedido (apenas cliente, total_amount, items_count, status)
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido #{order_id} não encontrado"
        )
    
    try:
        order.client_name = order_in.client_name
        order.total_amount = order_in.total_amount
        order.items_count = order_in.items_count
        order.status = order_in.status
        
        # Atualizar itens do pedido se fornecidos
        if order_in.items:
            # Deletar itens antigos
            db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
            db.commit()
            
            # Salvar novos itens
            for item_data in order_in.items:
                order_item = OrderItem(
                    order_id=order_id,
                    product_name=item_data.get('product_name'),
                    quantity=item_data.get('quantity'),
                    price=item_data.get('price')
                )
                db.add(order_item)
            db.commit()
        
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao atualizar pedido: {str(e)}"
        )


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar pedido",
    dependencies=[Depends(get_current_user)]
)
async def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar pedido
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido #{order_id} não encontrado"
        )
    
    try:
        db.delete(order)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao deletar pedido: {str(e)}"
        )
