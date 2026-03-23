"""
Stock Management Routes
API endpoints para gestão de estoque
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import StockMovement, StockAlert, Product, User, Order, OrderItem, Supplier, SupplierPricing
from app.schemas.stock import (
    StockMovementCreate,
    StockMovementResponse,
    StockMovementDetailResponse,
    StockEntryWithFinancialData,
    StockAlertCreate,
    StockAlertResponse,
    StockAlertUpdate,
    StockSummaryResponse,
    InventorySummaryResponse,
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/v1/stock", tags=["Stock Management"])


@router.post("/movement", response_model=StockMovementResponse)
async def create_stock_movement(
    movement: StockMovementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registrar uma movimentação de estoque
    
    Movement types: 'entrada' (compra/devolução fornecedor) ou 'saída' (venda/dano/ajuste)
    """
    
    try:
        # Buscar produto
        product = db.query(Product).filter(Product.id == movement.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado"
            )
        
        # Calcular nova quantidade
        if movement.movement_type == "entrada":
            new_quantity = (product.quantity or 0) + movement.quantity
        else:  # saída
            new_quantity = (product.quantity or 0) - movement.quantity
            if new_quantity < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente. Disponível: {product.quantity}"
                )
        
        # Criar movimento
        stock_movement = StockMovement(
            product_id=movement.product_id,
            movement_type=movement.movement_type,
            quantity=movement.quantity,
            reason=movement.reason,
            current_quantity=new_quantity,
            notes=movement.notes,
            product_name=product.name,
            product_price=movement.product_price or product.price,
            created_by_id=current_user.id,
        )
        
        # Atualizar estoque do produto
        product.quantity = new_quantity
        
        db.add(stock_movement)
        db.commit()
        db.refresh(stock_movement)
        
        return stock_movement
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registrar movimento: {str(e)}"
        )


@router.post("/movement/from-order/{order_id}", response_model=list[StockMovementResponse])
async def create_stock_movement_from_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registrar movimentação de estoque para TODOS os itens de um pedido
    
    Cria uma movimentação de 'saída' para cada item do pedido
    """
    
    try:
        # Buscar pedido e itens
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido #{order_id} não encontrado"
            )
        
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        if not order_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Pedido #{order_id} não possui itens"
            )
        
        movements_created = []
        
        # Criar movimento para cada item do pedido
        for item in order_items:
            # Buscar produto
            product = db.query(Product).filter(Product.id == int(item.product_name.split('_')[0]) if '_' in item.product_name else Product.name == item.product_name).first()
            
            # Se não encontrou por ID, tenta por nome
            if not product:
                product = db.query(Product).filter(Product.name == item.product_name).first()
            
            if not product:
                # Criar movement dummy se produto não existe
                movement = StockMovement(
                    product_id=0,
                    movement_type="saída",
                    quantity=item.quantity,
                    reason="venda",
                    current_quantity=0,
                    notes=f"Pedido #{order_id} - Produto não encontrado: {item.product_name}",
                    order_id=order_id,
                    product_name=item.product_name,
                    product_price=item.price,
                    created_by_id=current_user.id,
                )
                db.add(movement)
                movements_created.append(movement)
                continue
            
            # Calcular nova quantidade
            new_quantity = (product.quantity or 0) - item.quantity
            if new_quantity < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente para {product.name}. Disponível: {product.quantity}, Solicitado: {item.quantity}"
                )
            
            # Criar movimento
            movement = StockMovement(
                product_id=product.id,
                movement_type="saída",
                quantity=item.quantity,
                reason="venda",
                current_quantity=new_quantity,
                notes=f"Pedido #{order_id} - {product.name}",
                order_id=order_id,
                product_name=product.name,
                product_price=item.price,
                created_by_id=current_user.id,
            )
            
            # Atualizar estoque do produto
            product.quantity = new_quantity
            
            db.add(movement)
            movements_created.append(movement)
        
        # Marcar pedido como concluído
        order.status = "completed"
        
        db.commit()
        for movement in movements_created:
            db.refresh(movement)
        
        return movements_created
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registrar movimento do pedido: {str(e)}"
        )


@router.get("/movements", response_model=list[StockMovementResponse])
async def list_stock_movements(
    product_id: int = Query(None),
    movement_type: str = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Listar movimentações de estoque com filtros opcionais
    """
    
    query = db.query(StockMovement)
    
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    movements = query.order_by(StockMovement.created_at.desc()).offset(offset).limit(limit).all()
    
    return movements


@router.get("/summary", response_model=InventorySummaryResponse)
async def get_inventory_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obter resumo geral do inventário
    """
    
    products = db.query(Product).all()
    
    total_products = len(products)
    total_quantity = sum(p.quantity or 0 for p in products)
    total_value = sum((p.price or 0) * (p.quantity or 0) for p in products)
    
    # Contar produtos com estoque baixo/zerado
    alerts = db.query(StockAlert).filter(StockAlert.is_active == True).all()
    alert_map = {a.product_id: a.min_quantity for a in alerts}
    
    products_low_stock = 0
    products_out_of_stock = 0
    
    for product in products:
        qty = product.quantity or 0
        if qty == 0:
            products_out_of_stock += 1
        elif product.id in alert_map and qty < alert_map[product.id]:
            products_low_stock += 1
    
    return InventorySummaryResponse(
        total_products=total_products,
        total_quantity=total_quantity,
        products_low_stock=products_low_stock,
        products_out_of_stock=products_out_of_stock,
        total_value=float(total_value),
        last_update=datetime.utcnow()
    )


@router.get("/low-stock", response_model=list[StockSummaryResponse])
async def get_low_stock_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obter lista de produtos com estoque baixo ou zerado
    """
    
    alerts = db.query(StockAlert).filter(StockAlert.is_active == True).all()
    
    results = []
    for alert in alerts:
        product = db.query(Product).filter(Product.id == alert.product_id).first()
        if product:
            qty = product.quantity or 0
            
            # Only include products that are actually low or out of stock
            if qty == 0 or qty < alert.min_quantity:
                status = "out_of_stock" if qty == 0 else "low"
                
                # Buscar último movimento
                last_movement = db.query(StockMovement).filter(
                    StockMovement.product_id == product.id
                ).order_by(StockMovement.created_at.desc()).first()
                
                results.append(StockSummaryResponse(
                    product_id=product.id,
                    product_name=product.name,
                    current_quantity=qty,
                    min_quantity=alert.min_quantity,
                    status=status,
                    last_movement=last_movement.created_at if last_movement else None,
                    alerts_active=alert.is_active
                ))
    
    return results


@router.get("/pending-orders-for-exit", response_model=list)
async def get_pending_orders_for_exit(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Obter lista de pedidos pendentes/não completados com seus itens
    
    Retorna pedidos que ainda não foram processados (status != "completed")
    """
    
    try:
        # Buscar pedidos que NÃO estão completados ou cancelados
        pending_orders = db.query(Order).filter(
            Order.status.notin_(["completed", "cancelled"])
        ).order_by(Order.created_at.desc()).all()
        
        result = []
        for order in pending_orders:
            # Buscar itens do pedido
            items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            # Formatar resposta
            result.append({
                "id": order.id,
                "client_name": order.client_name,
                "total_amount": order.total_amount,
                "items_count": order.items_count,
                "status": order.status,
                "created_at": order.created_at.isoformat(),
                "items": [
                    {
                        "id": item.id,
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "price": item.price,
                    }
                    for item in items
                ]
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar pedidos pendentes: {str(e)}"
        )


# ============ Stock Alert Endpoints ============

@router.post("/alerts", response_model=StockAlertResponse)
async def create_stock_alert(
    alert: StockAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Criar alerta de estoque para um produto
    """
    
    try:
        # Verificar se produto existe
        product = db.query(Product).filter(Product.id == alert.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado"
            )
        
        # Verificar se já existe alerta
        existing_alert = db.query(StockAlert).filter(
            StockAlert.product_id == alert.product_id
        ).first()
        
        if existing_alert:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um alerta para este produto"
            )
        
        # Criar alerta
        stock_alert = StockAlert(
            product_id=alert.product_id,
            min_quantity=alert.min_quantity,
            alert_type=alert.alert_type,
            email_notification=alert.email_notification,
        )
        
        db.add(stock_alert)
        db.commit()
        db.refresh(stock_alert)
        
        return stock_alert
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar alerta: {str(e)}"
        )


@router.get("/alerts", response_model=list[StockAlertResponse])
async def list_stock_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Listar todos os alertas de estoque
    """
    
    alerts = db.query(StockAlert).all()
    return alerts


@router.put("/alerts/{alert_id}", response_model=StockAlertResponse)
async def update_stock_alert(
    alert_id: int,
    alert: StockAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Atualizar configurações de alerta
    """
    
    db_alert = db.query(StockAlert).filter(StockAlert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerta não encontrado"
        )
    
    update_data = alert.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_alert, key, value)
    
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.delete("/alerts/{alert_id}")
async def delete_stock_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletar alerta de estoque
    """
    
    db_alert = db.query(StockAlert).filter(StockAlert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerta não encontrado"
        )
    
    db.delete(db_alert)
    db.commit()
    
    return {"message": "Alerta deletado com sucesso"}


@router.post("/entry-with-financial", response_model=StockMovementDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_stock_entry_with_financial_data(
    entry_data: StockEntryWithFinancialData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registrar entrada de estoque com dados financeiros completos
    
    Cria uma movimentação de entrada e registra todos os dados financeiros:
    - Custo de compra
    - Preço de venda
    - Impostos
    - Frete
    - Calcula margens e lucro
    
    Se o produto não existe, cria um novo com o nome fornecido.
    Também cria/atualiza registro de SupplierPricing automaticamente
    """
    
    try:
        # Procurar produto por nome, ou criar se não existir
        product = db.query(Product).filter(
            Product.name.ilike(entry_data.product_name)
        ).first()
        
        if not product:
            # Gerar SKU automático baseado em UUID (garantir unicidade)
            import uuid
            sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
            
            # Criar novo produto
            product = Product(
                name=entry_data.product_name,
                description=f"Produto criado via entrada de estoque com fornecedor #{entry_data.supplier_id}",
                quantity=0,
                price=entry_data.sale_price,
                sku=sku,
                category="sem_categoria"
            )
            db.add(product)
            db.flush()  # Obter ID do novo produto
        
        # Buscar fornecedor
        supplier = db.query(Supplier).filter(Supplier.id == entry_data.supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{entry_data.supplier_id} não encontrado"
            )
        
        # Calcular impostos e margens
        from app.services.financial_service import FinancialCalculator
        calculator = FinancialCalculator()
        
        financial_calc = calculator.calculate_margins(
            cost_price=entry_data.cost_price,
            sale_price=entry_data.sale_price,
            transportation_cost=entry_data.transportation_cost,
            icms_rate=entry_data.icms_rate,
            ipi_rate=entry_data.ipi_rate,
            cofins_rate=entry_data.cofins_rate,
            pis_rate=entry_data.pis_rate,
            other_taxes=entry_data.other_taxes
        )
        
        # Calcular custo total
        total_cost = (entry_data.cost_price + entry_data.transportation_cost) * entry_data.quantity
        
        # Calcular nova quantidade
        new_quantity = (product.quantity or 0) + entry_data.quantity
        
        # Criar registro de SupplierPricing
        supplier_pricing = SupplierPricing(
            supplier_id=entry_data.supplier_id,
            product_name=product.name,
            cost_price=entry_data.cost_price,
            sale_price=entry_data.sale_price,
            transportation_cost=entry_data.transportation_cost,
            icms_rate=entry_data.icms_rate,
            ipi_rate=entry_data.ipi_rate,
            cofins_rate=entry_data.cofins_rate,
            pis_rate=entry_data.pis_rate,
            other_taxes=entry_data.other_taxes,
            gross_margin=financial_calc['gross_margin'],
            net_margin=financial_calc['net_margin'],
            profit_amount=financial_calc['profit_amount'],
            currency=entry_data.currency,
            is_active=True,
            notes=entry_data.notes
        )
        
        db.add(supplier_pricing)
        db.flush()  # Flush para obter o ID gerado
        
        # Criar movimentação de estoque
        stock_movement = StockMovement(
            product_id=product.id,
            supplier_id=entry_data.supplier_id,
            supplier_pricing_id=supplier_pricing.id,
            movement_type="entrada",
            quantity=entry_data.quantity,
            reason=entry_data.reason,
            current_quantity=new_quantity,
            notes=entry_data.notes,
            product_name=product.name,
            product_price=entry_data.sale_price,
            
            # Dados financeiros (snapshots)
            cost_price=entry_data.cost_price,
            sale_price=entry_data.sale_price,
            transportation_cost=entry_data.transportation_cost,
            total_cost=total_cost,
            
            # Impostos
            icms_rate=entry_data.icms_rate,
            ipi_rate=entry_data.ipi_rate,
            cofins_rate=entry_data.cofins_rate,
            pis_rate=entry_data.pis_rate,
            other_taxes=entry_data.other_taxes,
            
            # Margens e lucro
            gross_margin=financial_calc['gross_margin'],
            net_margin=financial_calc['net_margin'],
            profit_amount=financial_calc['profit_amount'],
            
            currency=entry_data.currency,
            created_by_id=current_user.id,
        )
        
        # Atualizar estoque do produto
        product.quantity = new_quantity
        
        db.add(stock_movement)
        db.commit()
        db.refresh(stock_movement)
        
        return stock_movement
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao registrar entrada: {str(e)}"
        )
