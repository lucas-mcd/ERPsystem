"""
Pydantic Schemas para Gestão Financeira

Responsabilidade: Validação e serialização de dados financeiros
- Schemas de entrada (Create)
- Schemas de atualização (Update)
- Schemas de resposta (Response)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# ============= BANK ACCOUNT SCHEMAS =============

class BankAccountBase(BaseModel):
    account_name: str = Field(..., min_length=1, max_length=255)
    bank_name: str = Field(..., min_length=1, max_length=255)
    account_number: str = Field(..., min_length=1, max_length=50)
    branch_code: Optional[str] = Field(None, max_length=20)
    account_type: str = Field(default="corrente", max_length=50)
    cpf_cnpj: Optional[str] = Field(None, max_length=50)
    currency: str = Field(default="BRL", max_length=3)
    status: str = Field(default="ativa", max_length=50)


class BankAccountCreate(BankAccountBase):
    initial_balance: float = Field(default=0, ge=0)


class BankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_type: Optional[str] = None
    status: Optional[str] = None


class BankAccountResponse(BankAccountBase):
    id: int
    current_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BankAccountListResponse(BaseModel):
    items: List[BankAccountResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 100


# ============= ACCOUNTS RECEIVABLE SCHEMAS =============

class AccountsReceivableBase(BaseModel):
    customer_id: int
    invoice_number: str = Field(..., min_length=1, max_length=100)
    invoice_date: datetime
    due_date: datetime
    amount: float = Field(..., gt=0)
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class AccountsReceivableCreate(AccountsReceivableBase):
    pass


class AccountsReceivableUpdate(BaseModel):
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class ARPaymentCreate(BaseModel):
    payment_date: datetime
    amount: float = Field(..., gt=0)
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None


class AccountsReceivableResponse(AccountsReceivableBase):
    id: int
    received_amount: float
    balance: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountsReceivableDetailResponse(AccountsReceivableResponse):
    payments: List[dict] = []


class AccountsReceivableListResponse(BaseModel):
    items: List[AccountsReceivableResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 100


# ============= ACCOUNTS PAYABLE SCHEMAS =============

class AccountsPayableBase(BaseModel):
    supplier_id: int
    invoice_number: str = Field(..., min_length=1, max_length=100)
    invoice_date: datetime
    due_date: datetime
    amount: float = Field(..., gt=0)
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class AccountsPayableCreate(AccountsPayableBase):
    pass


class AccountsPayableUpdate(BaseModel):
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class APPaymentCreate(BaseModel):
    payment_date: datetime
    amount: float = Field(..., gt=0)
    payment_method: str
    reference: Optional[str] = None
    notes: Optional[str] = None


class AccountsPayableResponse(AccountsPayableBase):
    id: int
    paid_amount: float
    balance: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccountsPayableDetailResponse(AccountsPayableResponse):
    payments: List[dict] = []


class AccountsPayableListResponse(BaseModel):
    items: List[AccountsPayableResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 100


# ============= BANK TRANSACTION SCHEMAS =============

class BankTransactionCreate(BaseModel):
    bank_account_id: int
    transaction_date: datetime
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    transaction_type: str  # debit, credit
    status: Optional[str] = Field(default="confirmada", max_length=50)
    reference: Optional[str] = None
    notes: Optional[str] = None


class BankTransactionResponse(BaseModel):
    id: int
    bank_account_id: int
    transaction_date: datetime
    description: str
    amount: float
    transaction_type: str
    status: str
    reference: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BankTransactionListResponse(BaseModel):
    items: List[BankTransactionResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 100


# ============= BANK RECONCILIATION SCHEMAS =============

class BankReconciliationCreate(BaseModel):
    bank_account_id: int
    reconciliation_date: datetime
    opening_balance: float
    closing_balance: float
    expected_balance: float
    notes: Optional[str] = None


class BankReconciliationResponse(BaseModel):
    id: int
    bank_account_id: int
    reconciliation_date: datetime
    opening_balance: float
    closing_balance: float
    expected_balance: float
    variance: float
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BankReconciliationListResponse(BaseModel):
    items: List[BankReconciliationResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 100


# ============= CASH FLOW SCHEMAS =============

class CashFlowBase(BaseModel):
    category: str = Field(..., max_length=50)  # entrada, saída
    type: str = Field(..., max_length=100)
    amount: float = Field(..., gt=0)
    probability: int = Field(default=100, ge=0, le=100)
    due_date: datetime
    description: Optional[str] = None
    notes: Optional[str] = None


class CashFlowCreate(CashFlowBase):
    pass


class CashFlowUpdate(BaseModel):
    category: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[str] = None


class CashFlowResponse(CashFlowBase):
    id: int
    projection_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CashFlowListResponse(BaseModel):
    items: List[CashFlowResponse] = []
    total: int = 0
    skip: int = 0
    limit: int = 100


class CashFlowProjection(BaseModel):
    month: str  # YYYY-MM format
    inflow: float = 0
    outflow: float = 0
    net_flow: float = 0
    projected_balance: float = 0


# ============= FINANCIAL SUMMARY SCHEMAS =============

class FinancialSummary(BaseModel):
    total_receivable: float
    total_payable: float
    total_bank_balance: float
    overdue_receivable: float
    overdue_payable: float
    cash_flow_30_days: float
    net_position: float

    class Config:
        from_attributes = True
