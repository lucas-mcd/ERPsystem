"""
Endpoints para RH & Folha de Pagamento
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.models import Employee, Payroll, User
from app.schemas.hr_schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeDetailResponse,
    EmployeeListResponse, PayrollCreate, PayrollUpdate, PayrollResponse,
    PayrollDetailResponse, PayrollListResponse
)

router = APIRouter(prefix="/api/v1/hr", tags=["HR & Payroll"])


# ============= EMPLOYEE ENDPOINTS =============

@router.get("/employees", response_model=EmployeeListResponse)
async def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: str = Query(None, description="Filter by status"),
    department: str = Query(None, description="Filter by department"),
    search: str = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Listar funcionários com filtros opcionais
    
    - **status_filter**: Filtrar por status (ativo, inativo, demitido)
    - **department**: Filtrar por departamento
    - **search**: Buscar por nome ou email
    """
    query = db.query(Employee)
    
    if status_filter:
        query = query.filter(Employee.status == status_filter)
    if department:
        query = query.filter(Employee.department == department)
    if search:
        query = query.filter(
            (Employee.full_name.ilike(f"%{search}%")) |
            (Employee.email.ilike(f"%{search}%"))
        )
    
    total = query.count()
    employees = query.offset(skip).limit(limit).all()
    
    return EmployeeListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=employees
    )


@router.get("/employees/{employee_id}", response_model=EmployeeDetailResponse)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter detalhes de um funcionário"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    # Contar folhas de pagamento
    payroll_count = db.query(Payroll).filter(Payroll.employee_id == employee_id).count()
    
    response = EmployeeDetailResponse.from_orm(employee)
    response.payroll_count = payroll_count
    return response


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar novo funcionário"""
    # Validar CPF único
    existing = db.query(Employee).filter(Employee.cpf == employee_data.cpf).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado"
        )
    
    # Validar email único
    existing = db.query(Employee).filter(Employee.email == employee_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    employee = Employee(**employee_data.dict())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar dados de funcionário"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    update_data = employee_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar funcionário (mudar status para inativo)"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    employee.is_active = False
    employee.status = "inativo"
    db.commit()


# ============= PAYROLL ENDPOINTS =============

@router.get("/payroll", response_model=PayrollListResponse)
async def list_payrolls(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    employee_id: int = Query(None),
    month: str = Query(None, description="YYYY-MM format"),
    status_filter: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Listar folhas de pagamento com filtros opcionais
    
    - **employee_id**: Filtrar por funcionário
    - **month**: Filtrar por mês (YYYY-MM)
    - **status_filter**: Filtrar por status
    """
    query = db.query(Payroll)
    
    if employee_id:
        query = query.filter(Payroll.employee_id == employee_id)
    if month:
        query = query.filter(Payroll.month == month)
    if status_filter:
        query = query.filter(Payroll.status == status_filter)
    
    total = query.count()
    payrolls = query.offset(skip).limit(limit).all()
    
    return PayrollListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=payrolls
    )


@router.get("/payroll/{payroll_id}", response_model=PayrollDetailResponse)
async def get_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter detalhes de uma folha de pagamento"""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Folha não encontrada")
    
    response = PayrollDetailResponse.from_orm(payroll)
    employee = db.query(Employee).filter(Employee.id == payroll.employee_id).first()
    if employee:
        response.employee_name = employee.full_name
    return response


@router.post("/payroll", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED)
async def create_payroll(
    payroll_data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova folha de pagamento"""
    # Verificar se funcionário existe
    employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    
    # Verificar se já existe folha para este mês
    existing = db.query(Payroll).filter(
        (Payroll.employee_id == payroll_data.employee_id) &
        (Payroll.month == payroll_data.month)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Folha de pagamento para este mês já existe"
        )
    
    # Calcular salários
    data_dict = payroll_data.dict()
    data_dict["gross_salary"] = data_dict["base_salary"] + data_dict.get("bonus", 0)
    data_dict["deductions"] = (
        data_dict.get("inss_contribution", 0) +
        data_dict.get("irpf", 0) +
        data_dict.get("vale_transporte", 0) +
        data_dict.get("vale_alimentacao", 0) +
        data_dict.get("other_deductions", 0)
    )
    data_dict["net_salary"] = data_dict["gross_salary"] - data_dict["deductions"]
    
    payroll = Payroll(**data_dict)
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    
    return payroll


@router.put("/payroll/{payroll_id}", response_model=PayrollResponse)
async def update_payroll(
    payroll_id: int,
    payroll_data: PayrollUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar folha de pagamento"""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Folha não encontrada")
    
    # Não permitir atualizar folhas já pagas
    if payroll.status == "pago":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível atualizar folhas já pagas"
        )
    
    update_data = payroll_data.dict(exclude_unset=True)
    
    # Recalcular se houver mudanças em valores
    if any(k in update_data for k in ["bonus", "inss_contribution", "irpf", "vale_transporte", "vale_alimentacao", "other_deductions"]):
        for field, value in update_data.items():
            setattr(payroll, field, value)
        
        payroll.gross_salary = payroll.base_salary + (payroll.bonus or 0)
        payroll.deductions = (
            (payroll.inss_contribution or 0) +
            (payroll.irpf or 0) +
            (payroll.vale_transporte or 0) +
            (payroll.vale_alimentacao or 0) +
            (payroll.other_deductions or 0)
        )
        payroll.net_salary = payroll.gross_salary - payroll.deductions
    else:
        for field, value in update_data.items():
            setattr(payroll, field, value)
    
    db.commit()
    db.refresh(payroll)
    return payroll


@router.post("/payroll/{payroll_id}/process", response_model=PayrollResponse)
async def process_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Processar folha de pagamento (mudar status para processado)"""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Folha não encontrada")
    
    if payroll.status != "rascunho":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas folhas em rascunho podem ser processadas"
        )
    
    payroll.status = "processado"
    db.commit()
    db.refresh(payroll)
    return payroll


@router.post("/payroll/{payroll_id}/pay", response_model=PayrollResponse)
async def pay_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marcar folha como paga"""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Folha não encontrada")
    
    if payroll.status != "processado":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas folhas processadas podem ser pagas"
        )
    
    payroll.status = "pago"
    payroll.paid_date = datetime.utcnow()
    db.commit()
    db.refresh(payroll)
    return payroll


@router.delete("/payroll/{payroll_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar folha de pagamento (apenas rascunhos)"""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Folha não encontrada")
    
    if payroll.status != "rascunho":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas folhas em rascunho podem ser deletadas"
        )
    
    db.delete(payroll)
    db.commit()


# ============= ANALYTICS ENDPOINTS =============

@router.get("/payroll/analytics/monthly")
async def payroll_analytics(
    month: str = Query(..., description="YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter análise de folha para um mês"""
    payrolls = db.query(Payroll).filter(Payroll.month == month).all()
    
    if not payrolls:
        return {
            "month": month,
            "total_employees": 0,
            "total_gross": 0,
            "total_deductions": 0,
            "total_net": 0,
            "average_salary": 0,
            "processed_count": 0,
            "paid_count": 0,
        }
    
    total_gross = sum(p.gross_salary for p in payrolls)
    total_deductions = sum(p.deductions for p in payrolls)
    total_net = sum(p.net_salary for p in payrolls)
    
    return {
        "month": month,
        "total_employees": len(payrolls),
        "total_gross": total_gross,
        "total_deductions": total_deductions,
        "total_net": total_net,
        "average_salary": total_net / len(payrolls) if payrolls else 0,
        "processed_count": sum(1 for p in payrolls if p.status == "processado"),
        "paid_count": sum(1 for p in payrolls if p.status == "pago"),
    }
