"""
Financial Schemas - Pricing, Costs, and Margin Analysis

Responsabilidade: Validação de dados financeiros
- Preços e custos de fornecedores
- Cálculos de margens
- Análise de rentabilidade
- Impostos
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SupplierPricingBase(BaseModel):
    """Schema base para preços e custos do fornecedor"""
    product_name: str = Field(..., min_length=1, max_length=255, description="Nome do produto")
    cost_price: float = Field(..., gt=0, description="Preço de custo unitário")
    sale_price: float = Field(..., gt=0, description="Preço de venda unitário")
    minimum_quantity: int = Field(default=1, ge=1, description="Quantidade mínima")
    transportation_cost: float = Field(default=0, ge=0, description="Custo de transporte/frete")
    
    # Impostos em percentual
    icms_rate: float = Field(default=0, ge=0, le=100, description="Taxa ICMS (%)")
    ipi_rate: float = Field(default=0, ge=0, le=100, description="Taxa IPI (%)")
    cofins_rate: float = Field(default=0, ge=0, le=100, description="Taxa COFINS (%)")
    pis_rate: float = Field(default=0, ge=0, le=100, description="Taxa PIS (%)")
    other_taxes: float = Field(default=0, ge=0, description="Outros impostos")
    
    currency: str = Field(default="BRL", max_length=3, description="Moeda (BRL, USD, EUR)")
    notes: Optional[str] = Field(None, description="Observações")


class SupplierPricingCreate(SupplierPricingBase):
    """Schema para criação de preço/custo"""
    pass


class SupplierPricingUpdate(BaseModel):
    """Schema para atualização de preço/custo"""
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    cost_price: Optional[float] = Field(None, gt=0)
    sale_price: Optional[float] = Field(None, gt=0)
    minimum_quantity: Optional[int] = Field(None, ge=1)
    transportation_cost: Optional[float] = Field(None, ge=0)
    icms_rate: Optional[float] = Field(None, ge=0, le=100)
    ipi_rate: Optional[float] = Field(None, ge=0, le=100)
    cofins_rate: Optional[float] = Field(None, ge=0, le=100)
    pis_rate: Optional[float] = Field(None, ge=0, le=100)
    other_taxes: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class SupplierPricingResponse(SupplierPricingBase):
    """Schema para resposta de preço/custo com margens calculadas"""
    id: int
    supplier_id: int
    gross_margin: float = Field(description="Margem bruta (%)")
    net_margin: float = Field(description="Margem líquida após impostos (%)")
    profit_amount: float = Field(description="Valor lucro unitário")
    is_active: bool
    effective_date: datetime
    expiry_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SupplierPricingDetailResponse(SupplierPricingResponse):
    """Schema detalhado de preço com análise completa"""
    total_cost: float = Field(description="Custo total (custo + frete + impostos)")
    gross_profit: float = Field(description="Lucro bruto por unidade")
    net_profit: float = Field(description="Lucro líquido por unidade")
    roi_percentage: float = Field(description="ROI (Return on Investment) %")


class FinancialAnalysisResponse(BaseModel):
    """Schema para análise financeira do fornecedor"""
    supplier_id: int
    supplier_name: str
    product_name: str
    cost_price: float = Field(description="Preço de custo")
    sale_price: float = Field(description="Preço de venda")
    gross_margin_pct: float = Field(description="Margem bruta %")
    net_margin_pct: float = Field(description="Margem líquida %")
    profit_per_unit: float = Field(description="Lucro por unidade")
    total_taxes_pct: float = Field(description="Total de impostos %")
    total_taxes_value: float = Field(description="Valor total impostos por unidade")
    effective_price: float = Field(description="Preço efetivo (custo + frete + impostos)")
    currency: str
    is_active: bool
    updated_date: datetime


class SupplierPricingListResponse(BaseModel):
    """Schema para lista de preços do fornecedor"""
    total: int
    supplier_id: int
    supplier_name: str
    items: List[SupplierPricingResponse]


class FinancialSummaryResponse(BaseModel):
    """Schema para resumo financeiro geral"""
    total_products: int
    average_gross_margin: float = Field(description="Margem bruta média %")
    average_net_margin: float = Field(description="Margem líquida média %")
    average_profit_per_unit: float = Field(description="Lucro médio por unidade")
    highest_margin_product: str
    lowest_margin_product: str
    most_profitable_product: str
    total_price_range: dict = Field(description="Min-max de preços")
