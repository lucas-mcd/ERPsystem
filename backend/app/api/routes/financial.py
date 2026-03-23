"""
Rotas de Gestão Financeira - Preços, Custos e Análise de Rentabilidade

Responsabilidade: Endpoints para gerenciar dados financeiros
- CRUD de preços/custos
- Análise de margens
- Comparativo de preços
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Supplier, SupplierPricing
from app.schemas.financial_schemas import (
    SupplierPricingCreate, SupplierPricingUpdate, SupplierPricingResponse,
    SupplierPricingDetailResponse, FinancialAnalysisResponse,
    SupplierPricingListResponse, FinancialSummaryResponse
)
from app.api.dependencies.auth import get_current_user
from app.services.financial_service import FinancialCalculator, FinancialAnalyzer
from typing import List
from datetime import datetime

router = APIRouter()


@router.post(
    "/suppliers/{supplier_id}/pricing",
    response_model=SupplierPricingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar preço/custo do fornecedor",
    dependencies=[Depends(get_current_user)]
)
async def create_supplier_pricing(
    supplier_id: int,
    pricing_data: SupplierPricingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria novo registro de preço/custo para um fornecedor
    
    Calcula automaticamente margens bruta, líquida e lucro
    """
    try:
        # Verificar se fornecedor existe
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{supplier_id} não encontrado"
            )
        
        # Calcular margens
        margins = FinancialCalculator.calculate_margins(
            cost_price=pricing_data.cost_price,
            sale_price=pricing_data.sale_price,
            transportation_cost=pricing_data.transportation_cost,
            icms_rate=pricing_data.icms_rate,
            ipi_rate=pricing_data.ipi_rate,
            cofins_rate=pricing_data.cofins_rate,
            pis_rate=pricing_data.pis_rate,
            other_taxes=pricing_data.other_taxes
        )
        
        # Criar novo registro
        new_pricing = SupplierPricing(
            supplier_id=supplier_id,
            product_name=pricing_data.product_name,
            cost_price=pricing_data.cost_price,
            sale_price=pricing_data.sale_price,
            minimum_quantity=pricing_data.minimum_quantity,
            transportation_cost=pricing_data.transportation_cost,
            icms_rate=pricing_data.icms_rate,
            ipi_rate=pricing_data.ipi_rate,
            cofins_rate=pricing_data.cofins_rate,
            pis_rate=pricing_data.pis_rate,
            other_taxes=pricing_data.other_taxes,
            gross_margin=margins['gross_margin'],
            net_margin=margins['net_margin'],
            profit_amount=margins['profit_amount'],
            currency=pricing_data.currency,
            notes=pricing_data.notes
        )
        
        db.add(new_pricing)
        db.commit()
        db.refresh(new_pricing)
        
        return SupplierPricingResponse.model_validate(new_pricing)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao criar preço: {str(e)}"
        )


@router.get(
    "/suppliers/{supplier_id}/pricing",
    response_model=SupplierPricingListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar preços do fornecedor",
    dependencies=[Depends(get_current_user)]
)
async def list_supplier_pricing(
    supplier_id: int,
    skip: int = Query(0, ge=0, description="Paginação - skip"),
    limit: int = Query(50, ge=1, le=500, description="Paginação - limit"),
    only_active: bool = Query(True, description="Apenas preços ativos"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os preços/custos de um fornecedor"""
    
    try:
        # Verificar se fornecedor existe
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{supplier_id} não encontrado"
            )
        
        # Listar preços
        query = db.query(SupplierPricing).filter(
            SupplierPricing.supplier_id == supplier_id
        )
        
        if only_active:
            query = query.filter(SupplierPricing.is_active == True)
        
        total = query.count()
        pricings = query.offset(skip).limit(limit).all()
        
        return SupplierPricingListResponse(
            total=total,
            supplier_id=supplier_id,
            supplier_name=supplier.name,
            items=[SupplierPricingResponse.model_validate(p) for p in pricings]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar preços: {str(e)}"
        )


@router.put(
    "/suppliers/{supplier_id}/pricing/{pricing_id}",
    response_model=SupplierPricingResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar preço/custo",
    dependencies=[Depends(get_current_user)]
)
async def update_supplier_pricing(
    supplier_id: int,
    pricing_id: int,
    pricing_data: SupplierPricingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um registro de preço/custo"""
    
    try:
        pricing = db.query(SupplierPricing).filter(
            SupplierPricing.id == pricing_id,
            SupplierPricing.supplier_id == supplier_id
        ).first()
        
        if not pricing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Preço #{pricing_id} não encontrado"
            )
        
        # Atualizar campos
        update_data = pricing_data.dict(exclude_unset=True)
        
        # Recalcular margens se algum valor financeiro foi alterado
        if any(key in update_data for key in ['cost_price', 'sale_price', 'transportation_cost',
                                                 'icms_rate', 'ipi_rate', 'cofins_rate', 'pis_rate', 'other_taxes']):
            FinancialCalculator.update_supplier_pricing(pricing, **update_data)
            update_data = {k: v for k, v in update_data.items() if k not in 
                          ['cost_price', 'sale_price', 'transportation_cost', 'icms_rate',
                           'ipi_rate', 'cofins_rate', 'pis_rate', 'other_taxes']}
        
        for key, value in update_data.items():
            setattr(pricing, key, value)
        
        pricing.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(pricing)
        
        return SupplierPricingResponse.model_validate(pricing)
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao atualizar preço: {str(e)}"
        )


@router.get(
    "/suppliers/{supplier_id}/financial-analysis",
    response_model=FinancialSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Análise financeira do fornecedor",
    dependencies=[Depends(get_current_user)]
)
async def get_supplier_financial_analysis(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Análise completa de rentabilidade do fornecedor
    
    Retorna:
    - Total de produtos
    - Margens média (bruta e líquida)
    - Lucro médio por unidade
    - Produtos com maior/menor margem
    - Produto mais lucrativo
    """
    
    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor #{supplier_id} não encontrado"
            )
        
        analysis = FinancialAnalyzer.analyze_supplier_profitability(supplier_id, db)
        
        # Obter range de preços
        pricings = db.query(SupplierPricing).filter(
            SupplierPricing.supplier_id == supplier_id,
            SupplierPricing.is_active == True
        ).all()
        
        if pricings:
            sale_prices = [p.sale_price for p in pricings]
            price_range = {
                'min': min(sale_prices),
                'max': max(sale_prices),
                'average': sum(sale_prices) / len(sale_prices)
            }
        else:
            price_range = {'min': 0, 'max': 0, 'average': 0}
        
        return FinancialSummaryResponse(
            total_products=analysis['total_products'],
            average_gross_margin=analysis['average_gross_margin'],
            average_net_margin=analysis['average_net_margin'],
            average_profit_per_unit=analysis['average_profit_per_unit'],
            highest_margin_product=analysis['highest_margin_product'],
            lowest_margin_product=analysis['lowest_margin_product'],
            most_profitable_product=analysis['most_profitable_product'],
            total_price_range=price_range
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao analisar rentabilidade: {str(e)}"
        )


@router.post(
    "/pricing/compare",
    response_model=List[FinancialAnalysisResponse],
    status_code=status.HTTP_200_OK,
    summary="Comparar preços entre fornecedores",
    dependencies=[Depends(get_current_user)]
)
async def compare_supplier_prices(
    supplier_ids: List[int] = Query(..., description="IDs dos fornecedores"),
    product_name: str = Query(..., min_length=1, description="Nome do produto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compara preços do mesmo produto entre múltiplos fornecedores
    
    Retorna lista ordenada por preço de venda (menor para maior)
    """
    
    try:
        results = FinancialAnalyzer.compare_supplier_pricing(supplier_ids, product_name, db)
        
        # Converter para response format
        responses = []
        for result in results:
            # Calcular margens
            margins = FinancialCalculator.calculate_margins(
                cost_price=result['cost_price'],
                sale_price=result['sale_price']
            )
            
            responses.append(FinancialAnalysisResponse(
                supplier_id=result['supplier_id'],
                supplier_name=result['supplier_name'],
                product_name=result['product_name'],
                cost_price=result['cost_price'],
                sale_price=result['sale_price'],
                gross_margin_pct=margins['gross_margin'],
                net_margin_pct=margins['net_margin'],
                profit_per_unit=margins['profit_amount'],
                total_taxes_pct=margins['total_taxes_pct'],
                total_taxes_value=margins['total_taxes_value'],
                effective_price=margins['effective_cost'],
                currency=result['currency'],
                is_active=True,
                updated_date=datetime.utcnow()
            ))
        
        return responses
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao comparar preços: {str(e)}"
        )
