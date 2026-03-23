"""
Rotas de Fornecedores (Suppliers)

Responsabilidade: CRUD de fornecedores
- Criar fornecedor
- Listar fornecedores
- Obter fornecedor específico
- Atualizar fornecedor
- Deletar fornecedor
- Registrar histórico de fornecimento
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import func

from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.models import User, Supplier, SupplyHistory
from app.schemas.schemas import (
    SupplierCreate, SupplierUpdate, SupplierResponse, SupplierDetailResponse, 
    SupplierListResponse, SupplyHistoryResponse
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/v1/suppliers", tags=["Suppliers"])


def calculate_supplier_metrics(supplier: Supplier, db: Session):
    """
    Calcula métricas de desempenho do fornecedor
    """
    supplies = db.query(SupplyHistory).filter(SupplyHistory.supplier_id == supplier.id).all()
    
    if not supplies:
        return {
            'total_supplies': 0,
            'avg_lead_time': 0.0,
            'on_time_delivery_rate': 0.0,
            'avg_defect_rate': 0.0,
            'avg_unit_price': 0.0,
            'performance_score': 0.0
        }
    
    total_supplies = len(supplies)
    
    # Calcular lead time médio
    lead_times = []
    for supply in supplies:
        if supply.expected_delivery_date and supply.actual_delivery_date:
            lead_time = (supply.actual_delivery_date - supply.expected_delivery_date).days
            lead_times.append(lead_time)
    
    avg_lead_time = sum(lead_times) / len(lead_times) if lead_times else 0.0
    
    # Calcular taxa de entrega no prazo
    on_time_count = sum(1 for supply in supplies if supply.is_on_time)
    on_time_delivery_rate = (on_time_count / total_supplies * 100) if total_supplies > 0 else 0.0
    
    # Calcular taxa de defeito média
    avg_defect_rate = sum(supply.defect_rate for supply in supplies) / total_supplies if total_supplies > 0 else 0.0
    
    # Calcular preço unitário médio
    avg_unit_price = sum(supply.unit_price for supply in supplies) / total_supplies if total_supplies > 0 else 0.0
    
    # Calcular performance score (0-10)
    # Formula: (on_time_rate * 0.4) + ((100 - avg_defect_rate) * 0.4) + ((100 - max(abs(avg_lead_time), 30)) / 30 * 0.2) * 10
    on_time_score = (on_time_delivery_rate / 100) * 4  # Max 4 pontos
    quality_score = ((100 - avg_defect_rate) / 100) * 4  # Max 4 pontos
    timeliness_score = max(0, (1 - abs(avg_lead_time) / 14)) * 2  # Max 2 pontos (esperamos ~7 dias)
    
    performance_score = min(10, max(0, on_time_score + quality_score + timeliness_score))
    
    return {
        'total_supplies': total_supplies,
        'avg_lead_time': round(avg_lead_time, 2),
        'on_time_delivery_rate': round(on_time_delivery_rate, 2),
        'avg_defect_rate': round(avg_defect_rate, 2),
        'avg_unit_price': round(avg_unit_price, 2),
        'performance_score': round(performance_score, 1)
    }



@router.post(
    "",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo fornecedor",
    dependencies=[Depends(get_current_user)]
)
async def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar novo fornecedor (Usuários autenticados)
    
    Registra um novo fornecedor com as informações fornecidas
    """
    try:
        # Verificar se fornecedor com mesmo CNPJ já existe
        if supplier_in.tax_id:
            existing = db.query(Supplier).filter(Supplier.tax_id == supplier_in.tax_id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um fornecedor com este CNPJ"
                )
        
        new_supplier = Supplier(
            name=supplier_in.name,
            email=supplier_in.email,
            phone=supplier_in.phone,
            contact_person=supplier_in.contact_person,
            address=supplier_in.address,
            city=supplier_in.city,
            state=supplier_in.state,
            postal_code=supplier_in.postal_code,
            country=supplier_in.country,
            tax_id=supplier_in.tax_id,
            sla_days=supplier_in.sla_days if hasattr(supplier_in, 'sla_days') else 7,
            notes=supplier_in.notes,
            created_by_id=current_user.id
        )
        db.add(new_supplier)
        db.commit()
        db.refresh(new_supplier)
        
        # Calcular e incluir métricas na resposta
        metrics = calculate_supplier_metrics(new_supplier, db)
        
        # Construir resposta com modelo Pydantic
        response_dict = {
            'id': new_supplier.id,
            'name': new_supplier.name,
            'email': new_supplier.email,
            'phone': new_supplier.phone,
            'contact_person': new_supplier.contact_person,
            'address': new_supplier.address,
            'city': new_supplier.city,
            'state': new_supplier.state,
            'postal_code': new_supplier.postal_code,
            'country': new_supplier.country,
            'tax_id': new_supplier.tax_id,
            'sla_days': new_supplier.sla_days,
            'status': new_supplier.status.value if new_supplier.status else None,
            'supplier_type': new_supplier.supplier_type.value if new_supplier.supplier_type else None,
            'business_segment': new_supplier.business_segment.value if new_supplier.business_segment else None,
            'is_active': new_supplier.is_active,
            'notes': new_supplier.notes,
            'created_at': new_supplier.created_at,
            'updated_at': new_supplier.updated_at,
            **metrics
        }
        return SupplierResponse.model_validate(response_dict)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar fornecedor: {str(e)}"
        )


@router.get(
    "",
    response_model=SupplierListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar fornecedores",
    dependencies=[Depends(get_current_user)]
)
async def list_suppliers(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(100, ge=1, le=500, description="Limit"),
    is_active: bool = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar fornecedores (Usuários autenticados)
    
    Query parameters:
    - skip: Número de registros a pular (padrão: 0)
    - limit: Máximo de registros a retornar (padrão: 100, máx: 500)
    - is_active: Filtrar por status ativo (true/false)
    """
    try:
        query = db.query(Supplier)
        
        if is_active is not None:
            query = query.filter(Supplier.is_active == is_active)
        
        total = query.count()
        suppliers = query.order_by(Supplier.created_at.desc()).offset(skip).limit(limit).all()
        
        # Calcular métricas para cada fornecedor
        items_with_metrics = []
        for supplier in suppliers:
            metrics = calculate_supplier_metrics(supplier, db)
            response_dict = {
                'id': supplier.id,
                'name': supplier.name,
                'email': supplier.email,
                'phone': supplier.phone,
                'contact_person': supplier.contact_person,
                'address': supplier.address,
                'city': supplier.city,
                'state': supplier.state,
                'postal_code': supplier.postal_code,
                'country': supplier.country,
                'tax_id': supplier.tax_id,
                'sla_days': supplier.sla_days,
                'status': supplier.status.value if supplier.status else None,
                'supplier_type': supplier.supplier_type.value if supplier.supplier_type else None,
                'business_segment': supplier.business_segment.value if supplier.business_segment else None,
                'is_active': supplier.is_active,
                'notes': supplier.notes,
                'created_at': supplier.created_at,
                'updated_at': supplier.updated_at,
                **metrics
            }
            items_with_metrics.append(SupplierResponse.model_validate(response_dict))
        
        return SupplierListResponse(
            total=total,
            page=skip // limit + 1 if limit > 0 else 1,
            page_size=limit,
            items=items_with_metrics
        )
    except Exception as e:
        import traceback
        error_detail = f"Error: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@router.get(
    "/{supplier_id}",
    response_model=SupplierDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter fornecedor específico",
    dependencies=[Depends(get_current_user)]
)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter fornecedor específico com histórico de fornecimento
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor #{supplier_id} não encontrado"
        )
    
    # Calcular e incluir métricas na resposta
    metrics = calculate_supplier_metrics(supplier, db)
    response_dict = {
        'id': supplier.id,
        'name': supplier.name,
        'email': supplier.email,
        'phone': supplier.phone,
        'contact_person': supplier.contact_person,
        'address': supplier.address,
        'city': supplier.city,
        'state': supplier.state,
        'postal_code': supplier.postal_code,
        'country': supplier.country,
        'tax_id': supplier.tax_id,
        'sla_days': supplier.sla_days,
        'status': supplier.status.value if supplier.status else None,
        'supplier_type': supplier.supplier_type.value if supplier.supplier_type else None,
        'business_segment': supplier.business_segment.value if supplier.business_segment else None,
        'is_active': supplier.is_active,
        'notes': supplier.notes,
        'created_at': supplier.created_at,
        'updated_at': supplier.updated_at,
        **metrics
    }
    return SupplierResponse.model_validate(response_dict)


@router.put(
    "/{supplier_id}",
    response_model=SupplierResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar fornecedor",
    dependencies=[Depends(get_current_user)]
)
async def update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar informações de um fornecedor
    """
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{supplier_id} não encontrado"
            )
        
        # Verificar CNPJ duplicado se foi alterado
        if supplier_in.tax_id and supplier_in.tax_id != supplier.tax_id:
            existing = db.query(Supplier).filter(Supplier.tax_id == supplier_in.tax_id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um fornecedor com este CNPJ"
                )
        
        # Atualizar campos
        update_data = supplier_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)
        
        db.commit()
        db.refresh(supplier)
        
        # Calcular e incluir métricas na resposta
        metrics = calculate_supplier_metrics(supplier, db)
        response_dict = {
            'id': supplier.id,
            'name': supplier.name,
            'email': supplier.email,
            'phone': supplier.phone,
            'contact_person': supplier.contact_person,
            'address': supplier.address,
            'city': supplier.city,
            'state': supplier.state,
            'postal_code': supplier.postal_code,
            'country': supplier.country,
            'tax_id': supplier.tax_id,
            'sla_days': supplier.sla_days,
            'status': supplier.status.value if supplier.status else None,
            'supplier_type': supplier.supplier_type.value if supplier.supplier_type else None,
            'business_segment': supplier.business_segment.value if supplier.business_segment else None,
            'is_active': supplier.is_active,
            'notes': supplier.notes,
            'created_at': supplier.created_at,
            'updated_at': supplier.updated_at,
            **metrics
        }
        return SupplierResponse.model_validate(response_dict)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao atualizar fornecedor: {str(e)}"
        )


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar fornecedor",
    dependencies=[Depends(get_current_user)]
)
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar um fornecedor
    """
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{supplier_id} não encontrado"
            )
        
        db.delete(supplier)
        db.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao deletar fornecedor: {str(e)}"
        )


@router.post(
    "/{supplier_id}/supply",
    response_model=SupplyHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar fornecimento",
    dependencies=[Depends(get_current_user)]
)
async def register_supply(
    supplier_id: int,
    supply_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registrar um fornecimento (entrada de produto) de um fornecedor
    
    Body:
    {
        "product_name": "Monitor LG 27\"",
        "quantity": 10,
        "unit_price": 1299.99,
        "total_amount": 12999.90,
        "expected_delivery_date": "2026-02-11T10:30:00",
        "actual_delivery_date": "2026-02-11T09:15:00",
        "defect_count": 0,
        "defect_rate": 0.0,
        "notes": "Entrega conforme esperado"
    }
    """
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{supplier_id} não encontrado"
            )
        
        # Obter datas
        expected_delivery = supply_data.get('expected_delivery_date')
        actual_delivery = supply_data.get('actual_delivery_date')
        
        # Calcular is_on_time
        is_on_time = True
        if expected_delivery and actual_delivery:
            from dateutil import parser as date_parser
            try:
                exp_date = date_parser.parse(expected_delivery) if isinstance(expected_delivery, str) else expected_delivery
                act_date = date_parser.parse(actual_delivery) if isinstance(actual_delivery, str) else actual_delivery
                is_on_time = act_date <= exp_date
            except:
                is_on_time = True
        
        # Criar histórico de fornecimento
        supply_history = SupplyHistory(
            supplier_id=supplier_id,
            product_name=supply_data.get('product_name'),
            quantity=supply_data.get('quantity'),
            unit_price=supply_data.get('unit_price'),
            total_amount=supply_data.get('total_amount'),
            expected_delivery_date=expected_delivery,
            actual_delivery_date=actual_delivery,
            is_on_time=is_on_time,
            defect_count=supply_data.get('defect_count', 0),
            defect_rate=supply_data.get('defect_rate', 0.0),
            notes=supply_data.get('notes')
        )
        
        db.add(supply_history)
        db.commit()
        db.refresh(supply_history)
        
        return supply_history
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao registrar fornecimento: {str(e)}"
        )


@router.get(
    "/{supplier_id}/supply-history",
    response_model=List[SupplyHistoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar histórico de fornecimento",
    dependencies=[Depends(get_current_user)]
)
async def get_supply_history(
    supplier_id: int,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter histórico de fornecimento de um fornecedor
    """
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fornecedor #{supplier_id} não encontrado"
        )
    
    history = db.query(SupplyHistory).filter(
        SupplyHistory.supplier_id == supplier_id
    ).order_by(SupplyHistory.created_at.desc()).limit(limit).all()
    
    return history
