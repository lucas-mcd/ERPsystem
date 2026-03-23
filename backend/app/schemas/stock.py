"""
Schemas para validação de requisições de Estoque
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============ Stock Movement Schemas ============

class StockMovementCreate(BaseModel):
    """Schema para criar uma movimentação de estoque"""
    product_id: int = Field(..., title="ID do Produto")
    movement_type: str = Field(..., pattern="^(entrada|saída)$", title="Tipo de Movimento")
    quantity: int = Field(..., gt=0, title="Quantidade")
    reason: str = Field(..., min_length=1, max_length=50, title="Motivo")
    notes: Optional[str] = Field(None, max_length=500, title="Observações")
    product_price: Optional[float] = Field(None, ge=0, title="Preço Unitário do Produto")


class StockEntryWithFinancialData(BaseModel):
    """Schema para entrada de estoque com dados financeiros completos"""
    product_name: str = Field(..., min_length=1, max_length=255, title="Nome do Produto")
    supplier_id: int = Field(..., title="ID do Fornecedor")
    quantity: int = Field(..., gt=0, title="Quantidade")
    cost_price: float = Field(..., gt=0, title="Preço de Custo Unitário")
    sale_price: float = Field(..., gt=0, title="Preço de Venda Unitário")
    transportation_cost: float = Field(default=0, ge=0, title="Custo de Transporte")
    
    # Impostos (%)
    icms_rate: float = Field(default=0, ge=0, le=100, title="Taxa ICMS")
    ipi_rate: float = Field(default=0, ge=0, le=100, title="Taxa IPI")
    cofins_rate: float = Field(default=0, ge=0, le=100, title="Taxa COFINS")
    pis_rate: float = Field(default=0, ge=0, le=100, title="Taxa PIS")
    other_taxes: float = Field(default=0, ge=0, le=100, title="Outros Impostos")
    
    reason: str = Field(default="compra", title="Motivo")
    currency: str = Field(default="BRL", title="Moeda")
    notes: Optional[str] = Field(None, max_length=500, title="Observações")
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_name": "Produto XYZ",
                "supplier_id": 5,
                "quantity": 100,
                "cost_price": 50.00,
                "sale_price": 120.00,
                "transportation_cost": 5.00,
                "icms_rate": 18,
                "ipi_rate": 5,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 0,
                "reason": "compra",
                "currency": "BRL",
                "notes": "Entrada via fornecedor Samsung"
            }
        }


class StockMovementUpdate(BaseModel):
    """Schema para atualizar movimentação (apenas notas)"""
    notes: Optional[str] = Field(None, max_length=500)


class StockMovementResponse(BaseModel):
    """Schema de resposta para movimentação"""
    id: int
    product_id: int
    movement_type: str
    quantity: int
    reason: str
    current_quantity: int
    notes: Optional[str]
    product_price: Optional[float] = None
    product_name: Optional[str] = None
    order_id: Optional[int] = None
    supplier_id: Optional[int] = None
    supplier_pricing_id: Optional[int] = None
    created_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StockMovementDetailResponse(BaseModel):
    """Schema de resposta detalhada com dados financeiros"""
    id: int
    product_id: int
    product_name: Optional[str]
    supplier_id: Optional[int]
    movement_type: str
    quantity: int
    reason: str
    current_quantity: int
    
    # Dados financeiros
    cost_price: Optional[float]
    sale_price: Optional[float]
    transportation_cost: float
    total_cost: Optional[float]
    gross_margin: Optional[float]
    net_margin: Optional[float]
    profit_amount: Optional[float]
    
    # Impostos
    icms_rate: float
    ipi_rate: float
    cofins_rate: float
    pis_rate: float
    other_taxes: float
    
    currency: str
    notes: Optional[str]
    created_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Stock Alert Schemas ============

class StockAlertCreate(BaseModel):
    """Schema para criar alerta de estoque"""
    product_id: int = Field(..., title="ID do Produto")
    min_quantity: int = Field(default=10, ge=0, title="Quantidade Mínima")
    alert_type: str = Field(default="low_stock", title="Tipo de Alerta")
    email_notification: bool = Field(default=True, title="Notificação por Email")


class StockAlertUpdate(BaseModel):
    """Schema para atualizar alerta"""
    min_quantity: Optional[int] = Field(None, ge=0)
    alert_type: Optional[str] = None
    is_active: Optional[bool] = None
    email_notification: Optional[bool] = None


class StockAlertResponse(BaseModel):
    """Schema de resposta para alerta"""
    id: int
    product_id: int
    min_quantity: int
    alert_type: str
    is_active: bool
    email_notification: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Stock Summary Schemas ============

class StockSummaryResponse(BaseModel):
    """Schema para resumo de estoque de um produto"""
    product_id: int
    product_name: str
    current_quantity: int
    min_quantity: int
    status: str  # "ok", "low", "out_of_stock"
    last_movement: Optional[datetime]
    alerts_active: bool


class InventorySummaryResponse(BaseModel):
    """Schema para resumo geral do inventário"""
    total_products: int
    total_quantity: int
    products_low_stock: int
    products_out_of_stock: int
    total_value: float  # Valor total em estoque
    last_update: datetime
