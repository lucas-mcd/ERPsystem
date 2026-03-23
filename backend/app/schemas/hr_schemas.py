"""
Schemas para HR e Folha de Pagamento
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List


# ============= EMPLOYEE SCHEMAS =============

class EmployeeBase(BaseModel):
    """Base schema para Employee"""
    full_name: str = Field(..., min_length=3, max_length=255, description="Nome completo")
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    cpf: str = Field(..., min_length=11, max_length=14, description="CPF sem caracteres especiais")
    position: str = Field(..., min_length=2, max_length=100, description="Cargo/Posição")
    department: str = Field(..., min_length=2, max_length=100, description="Departamento")
    hire_date: datetime
    salary: float = Field(..., gt=0, description="Salário mensal")
    contract_type: str = Field(default="CLT", description="CLT, PJ, Estagiário")
    status: str = Field(default="ativo", description="ativo, inativo, demitido")
    manager_id: Optional[int] = None
    birth_date: Optional[datetime] = None
    address: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    """Schema para criar Employee"""
    pass


class EmployeeUpdate(BaseModel):
    """Schema para atualizar Employee"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    salary: Optional[float] = None
    contract_type: Optional[str] = None
    status: Optional[str] = None
    manager_id: Optional[int] = None
    birth_date: Optional[datetime] = None
    address: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    """Schema de resposta para Employee"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeDetailResponse(EmployeeResponse):
    """Schema detalhado de Employee com folhas de pagamento"""
    payroll_count: int = 0


# ============= PAYROLL SCHEMAS =============

class PayrollBase(BaseModel):
    """Base schema para Payroll"""
    employee_id: int
    month: str = Field(..., description="YYYY-MM format")
    base_salary: float = Field(..., gt=0)
    bonus: float = Field(default=0, ge=0)
    inss_contribution: float = Field(default=0, ge=0, description="INSS (8%)")
    irpf: float = Field(default=0, ge=0, description="Imposto de Renda")
    vale_transporte: float = Field(default=0, ge=0)
    vale_alimentacao: float = Field(default=0, ge=0)
    other_deductions: float = Field(default=0, ge=0)
    status: str = Field(default="rascunho", description="rascunho, processado, pago")
    notes: Optional[str] = None


class PayrollCreate(PayrollBase):
    """Schema para criar Payroll"""
    pass


class PayrollUpdate(BaseModel):
    """Schema para atualizar Payroll"""
    bonus: Optional[float] = None
    inss_contribution: Optional[float] = None
    irpf: Optional[float] = None
    vale_transporte: Optional[float] = None
    vale_alimentacao: Optional[float] = None
    other_deductions: Optional[float] = None
    status: Optional[str] = None
    paid_date: Optional[datetime] = None
    notes: Optional[str] = None


class PayrollResponse(PayrollBase):
    """Schema de resposta para Payroll"""
    id: int
    deductions: float
    gross_salary: float
    net_salary: float
    paid_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PayrollDetailResponse(PayrollResponse):
    """Schema detalhado de Payroll com empregado"""
    employee_name: Optional[str] = None


class PayrollListResponse(BaseModel):
    """Schema de lista de Payrolls com paginação"""
    total: int
    page: int
    page_size: int
    items: List[PayrollResponse]


class EmployeeListResponse(BaseModel):
    """Schema de lista de Employees com paginação"""
    total: int
    page: int
    page_size: int
    items: List[EmployeeResponse]
