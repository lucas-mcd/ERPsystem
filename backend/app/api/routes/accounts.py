"""
Endpoints para Gestão Financeira

Operações para:
- Contas a Receber (AR)
- Contas a Pagar (AP)
- Contas Bancárias
- Fluxo de Caixa
- Reconciliação Bancária
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.dependencies.auth import get_current_user
from app.models.models import (
    User, BankAccount, AccountsReceivable, AccountsPayable,
    ARPayment, APPayment, BankTransaction, BankReconciliation,
    CashFlow
)
from app.schemas.finance_schemas import (
    BankAccountCreate, BankAccountUpdate, BankAccountResponse, BankAccountListResponse,
    AccountsReceivableCreate, AccountsReceivableUpdate, AccountsReceivableResponse,
    AccountsReceivableDetailResponse, AccountsReceivableListResponse, ARPaymentCreate,
    AccountsPayableCreate, AccountsPayableUpdate, AccountsPayableResponse,
    AccountsPayableDetailResponse, AccountsPayableListResponse, APPaymentCreate,
    BankTransactionCreate, BankTransactionResponse, BankTransactionListResponse,
    BankReconciliationCreate, BankReconciliationResponse, BankReconciliationListResponse,
    CashFlowCreate, CashFlowUpdate, CashFlowResponse, CashFlowListResponse,
    FinancialSummary, CashFlowProjection
)

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts & Treasury"])


# ============= BANK ACCOUNT ENDPOINTS =============

@router.post("/bank-accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_account(
    account_data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova conta bancária"""
    account = BankAccount(
        account_name=account_data.account_name,
        bank_name=account_data.bank_name,
        account_number=account_data.account_number,
        branch_code=account_data.branch_code,
        account_type=account_data.account_type,
        cpf_cnpj=account_data.cpf_cnpj,
        initial_balance=account_data.initial_balance,
        current_balance=account_data.initial_balance,
        currency=account_data.currency,
        status=account_data.status,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/bank-accounts", response_model=BankAccountListResponse)
async def list_bank_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar contas bancárias"""
    query = db.query(BankAccount)
    
    if status:
        query = query.filter(BankAccount.status == status)
    
    total = query.count()
    accounts = query.offset(skip).limit(limit).all()
    
    return BankAccountListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=accounts
    )


@router.get("/bank-accounts/{account_id}", response_model=BankAccountResponse)
async def get_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter detalhes de conta bancária"""
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta bancária não encontrada")
    return account


@router.put("/bank-accounts/{account_id}", response_model=BankAccountResponse)
async def update_bank_account(
    account_id: int,
    update_data: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar conta bancária"""
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta bancária não encontrada")
    
    if update_data.account_name:
        account.account_name = update_data.account_name
    if update_data.bank_name:
        account.bank_name = update_data.bank_name
    if update_data.current_balance is not None:
        account.current_balance = update_data.current_balance
    if update_data.status:
        account.status = update_data.status
    
    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    return account


@router.delete("/bank-accounts/{account_id}")
async def delete_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar conta bancária"""
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Conta bancária não encontrada")
    
    db.delete(account)
    db.commit()
    return {"message": "Conta bancária deletada com sucesso"}


# ============= ACCOUNTS RECEIVABLE ENDPOINTS =============

@router.post("/receivables", response_model=AccountsReceivableResponse, status_code=status.HTTP_201_CREATED)
async def create_receivable(
    ar_data: AccountsReceivableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova conta a receber"""
    # Validar que a fatura não existe
    existing = db.query(AccountsReceivable).filter(
        AccountsReceivable.invoice_number == ar_data.invoice_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fatura já existe")
    
    receivable = AccountsReceivable(
        customer_id=ar_data.customer_id,
        invoice_number=ar_data.invoice_number,
        invoice_date=ar_data.invoice_date,
        due_date=ar_data.due_date,
        amount=ar_data.amount,
        balance=ar_data.amount,
        payment_method=ar_data.payment_method,
        frequency=ar_data.frequency,
        description=ar_data.description,
        notes=ar_data.notes,
        status="aberta",
    )
    db.add(receivable)
    db.commit()
    db.refresh(receivable)
    return receivable


@router.get("/receivables", response_model=AccountsReceivableListResponse)
async def list_receivables(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    customer_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar contas a receber"""
    query = db.query(AccountsReceivable)
    
    if status:
        query = query.filter(AccountsReceivable.status == status)
    if customer_id:
        query = query.filter(AccountsReceivable.customer_id == customer_id)
    
    total = query.count()
    receivables = query.offset(skip).limit(limit).all()
    
    return AccountsReceivableListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=receivables
    )


@router.get("/receivables/{receivable_id}", response_model=AccountsReceivableDetailResponse)
async def get_receivable(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter detalhes de conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id
    ).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Conta a receber não encontrada")
    return receivable


@router.put("/receivables/{receivable_id}", response_model=AccountsReceivableResponse)
async def update_receivable(
    receivable_id: int,
    update_data: AccountsReceivableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id
    ).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Conta a receber não encontrada")
    
    if update_data.due_date:
        receivable.due_date = update_data.due_date
    if update_data.amount:
        receivable.amount = update_data.amount
        receivable.balance = update_data.amount - receivable.received_amount
    if update_data.status:
        receivable.status = update_data.status
    if update_data.notes:
        receivable.notes = update_data.notes
    
    receivable.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(receivable)
    return receivable


@router.post("/receivables/{receivable_id}/payments", response_model=AccountsReceivableResponse)
async def add_receivable_payment(
    receivable_id: int,
    payment_data: ARPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registrar pagamento de conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id
    ).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Conta a receber não encontrada")
    
    # Validar amount
    if payment_data.amount > receivable.balance:
        raise HTTPException(status_code=400, detail="Valor de pagamento maior que o saldo")
    
    # Criar pagamento
    payment = ARPayment(
        receivable_id=receivable_id,
        payment_date=payment_data.payment_date,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        bank_account_id=payment_data.bank_account_id,
        reference=payment_data.reference,
        notes=payment_data.notes,
    )
    db.add(payment)
    
    # Atualizar conta a receber
    receivable.received_amount += payment_data.amount
    receivable.balance -= payment_data.amount
    
    # Atualizar status
    if receivable.balance == 0:
        receivable.status = "paga"
    elif receivable.balance < receivable.amount:
        receivable.status = "parcial"
    
    receivable.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(receivable)
    return receivable


@router.delete("/receivables/{receivable_id}")
async def delete_receivable(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar conta a receber"""
    receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id
    ).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Conta a receber não encontrada")
    
    db.delete(receivable)
    db.commit()
    return {"message": "Conta a receber deletada com sucesso"}


# ============= ACCOUNTS PAYABLE ENDPOINTS =============

@router.post("/payables", response_model=AccountsPayableResponse, status_code=status.HTTP_201_CREATED)
async def create_payable(
    ap_data: AccountsPayableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova conta a pagar"""
    # Validar que a fatura não existe
    existing = db.query(AccountsPayable).filter(
        AccountsPayable.invoice_number == ap_data.invoice_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fatura já existe")
    
    payable = AccountsPayable(
        supplier_id=ap_data.supplier_id,
        invoice_number=ap_data.invoice_number,
        invoice_date=ap_data.invoice_date,
        due_date=ap_data.due_date,
        amount=ap_data.amount,
        balance=ap_data.amount,
        payment_method=ap_data.payment_method,
        payment_terms=ap_data.payment_terms,
        description=ap_data.description,
        notes=ap_data.notes,
        status="aberta",
    )
    db.add(payable)
    db.commit()
    db.refresh(payable)
    return payable


@router.get("/payables", response_model=AccountsPayableListResponse)
async def list_payables(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    supplier_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar contas a pagar"""
    query = db.query(AccountsPayable)
    
    if status:
        query = query.filter(AccountsPayable.status == status)
    if supplier_id:
        query = query.filter(AccountsPayable.supplier_id == supplier_id)
    
    total = query.count()
    payables = query.offset(skip).limit(limit).all()
    
    return AccountsPayableListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=payables
    )


@router.get("/payables/{payable_id}", response_model=AccountsPayableDetailResponse)
async def get_payable(
    payable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter detalhes de conta a pagar"""
    payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id
    ).first()
    if not payable:
        raise HTTPException(status_code=404, detail="Conta a pagar não encontrada")
    return payable


@router.put("/payables/{payable_id}", response_model=AccountsPayableResponse)
async def update_payable(
    payable_id: int,
    update_data: AccountsPayableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar conta a pagar"""
    payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id
    ).first()
    if not payable:
        raise HTTPException(status_code=404, detail="Conta a pagar não encontrada")
    
    if update_data.due_date:
        payable.due_date = update_data.due_date
    if update_data.amount:
        payable.amount = update_data.amount
        payable.balance = update_data.amount - payable.paid_amount
    if update_data.status:
        payable.status = update_data.status
    if update_data.notes:
        payable.notes = update_data.notes
    
    payable.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(payable)
    return payable


@router.post("/payables/{payable_id}/payments", response_model=AccountsPayableResponse)
async def add_payable_payment(
    payable_id: int,
    payment_data: APPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registrar pagamento de conta a pagar"""
    payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id
    ).first()
    if not payable:
        raise HTTPException(status_code=404, detail="Conta a pagar não encontrada")
    
    # Validar amount
    if payment_data.amount > payable.balance:
        raise HTTPException(status_code=400, detail="Valor de pagamento maior que o saldo")
    
    # Criar pagamento
    payment = APPayment(
        payable_id=payable_id,
        payment_date=payment_data.payment_date,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        bank_account_id=payment_data.bank_account_id,
        reference=payment_data.reference,
        notes=payment_data.notes,
    )
    db.add(payment)
    
    # Atualizar conta a pagar
    payable.paid_amount += payment_data.amount
    payable.balance -= payment_data.amount
    
    # Atualizar status
    if payable.balance == 0:
        payable.status = "paga"
    elif payable.balance < payable.amount:
        payable.status = "parcial"
    
    payable.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(payable)
    return payable


@router.delete("/payables/{payable_id}")
async def delete_payable(
    payable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar conta a pagar"""
    payable = db.query(AccountsPayable).filter(
        AccountsPayable.id == payable_id
    ).first()
    if not payable:
        raise HTTPException(status_code=404, detail="Conta a pagar não encontrada")
    
    db.delete(payable)
    db.commit()
    return {"message": "Conta a pagar deletada com sucesso"}


# ============= CASH FLOW ENDPOINTS =============

@router.post("/cash-flows", response_model=CashFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_cash_flow(
    cf_data: CashFlowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova projeção de fluxo de caixa"""
    cash_flow = CashFlow(
        projection_date=cf_data.projection_date,
        category=cf_data.category,
        type=cf_data.type,
        amount=cf_data.amount,
        probability=cf_data.probability,
        due_date=cf_data.due_date,
        reference_id=cf_data.reference_id,
        reference_type=cf_data.reference_type,
        description=cf_data.description,
        notes=cf_data.notes,
        status="planejado",
    )
    db.add(cash_flow)
    db.commit()
    db.refresh(cash_flow)
    return cash_flow


@router.get("/cash-flows", response_model=CashFlowListResponse)
async def list_cash_flows(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: str = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar projeções de fluxo de caixa"""
    query = db.query(CashFlow)
    
    if category:
        query = query.filter(CashFlow.category == category)
    if status:
        query = query.filter(CashFlow.status == status)
    
    total = query.count()
    cash_flows = query.order_by(CashFlow.due_date).offset(skip).limit(limit).all()
    
    return CashFlowListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=cash_flows
    )


@router.put("/cash-flows/{cash_flow_id}", response_model=CashFlowResponse)
async def update_cash_flow(
    cash_flow_id: int,
    update_data: CashFlowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Atualizar projeção de fluxo de caixa"""
    cash_flow = db.query(CashFlow).filter(CashFlow.id == cash_flow_id).first()
    if not cash_flow:
        raise HTTPException(status_code=404, detail="Fluxo de caixa não encontrado")
    
    if update_data.amount:
        cash_flow.amount = update_data.amount
    if update_data.probability is not None:
        cash_flow.probability = update_data.probability
    if update_data.due_date:
        cash_flow.due_date = update_data.due_date
    if update_data.status:
        cash_flow.status = update_data.status
    if update_data.notes:
        cash_flow.notes = update_data.notes
    
    cash_flow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cash_flow)
    return cash_flow


@router.delete("/cash-flows/{cash_flow_id}")
async def delete_cash_flow(
    cash_flow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar projeção de fluxo de caixa"""
    cash_flow = db.query(CashFlow).filter(CashFlow.id == cash_flow_id).first()
    if not cash_flow:
        raise HTTPException(status_code=404, detail="Fluxo de caixa não encontrado")
    
    db.delete(cash_flow)
    db.commit()
    return {"message": "Fluxo de caixa deletado com sucesso"}


@router.get("/cash-flows/projections/monthly")
async def get_monthly_cash_flow_projections(
    month: str = Query(None, description="YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter projeções de fluxo de caixa mensais"""
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")
    
    # Parse month
    try:
        period_start = datetime.strptime(f"{month}-01", "%Y-%m-%d")
        period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de mês inválido (use YYYY-MM)")
    
    # Query
    query = db.query(CashFlow).filter(
        CashFlow.due_date >= period_start,
        CashFlow.due_date <= period_end,
    )
    
    cash_flows = query.all()
    
    # Calcular projeção
    entries = sum([cf.amount for cf in cash_flows if cf.category == "entrada"])
    exits = sum([cf.amount for cf in cash_flows if cf.category == "saída"])
    
    return {
        "month": month,
        "projected_entries": entries,
        "projected_exits": exits,
        "net_projection": entries - exits,
        "items_count": len(cash_flows),
        "items": cash_flows,
    }


# ============= BANK RECONCILIATION ENDPOINTS =============

@router.post("/reconciliations", response_model=BankReconciliationResponse, status_code=status.HTTP_201_CREATED)
async def create_reconciliation(
    recon_data: BankReconciliationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Criar nova reconciliação bancária"""
    reconciliation = BankReconciliation(
        bank_account_id=recon_data.bank_account_id,
        reconciliation_date=recon_data.reconciliation_date,
        period_start=recon_data.period_start,
        period_end=recon_data.period_end,
        statement_balance=recon_data.statement_balance,
        system_balance=recon_data.system_balance,
        difference=abs(recon_data.statement_balance - recon_data.system_balance),
        notes=recon_data.notes,
    )
    
    # Determinar status
    if recon_data.statement_balance == recon_data.system_balance:
        reconciliation.status = "completa"
        reconciliation.reconciled_amount = recon_data.statement_balance
    else:
        reconciliation.status = "com_divergências"
    
    db.add(reconciliation)
    db.commit()
    db.refresh(reconciliation)
    return reconciliation


@router.get("/reconciliations", response_model=BankReconciliationListResponse)
async def list_reconciliations(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    bank_account_id: int = Query(None),
    status: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Listar reconciliações bancárias"""
    query = db.query(BankReconciliation)
    
    if bank_account_id:
        query = query.filter(BankReconciliation.bank_account_id == bank_account_id)
    if status:
        query = query.filter(BankReconciliation.status == status)
    
    total = query.count()
    reconciliations = query.offset(skip).limit(limit).all()
    
    return BankReconciliationListResponse(
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        items=reconciliations
    )


@router.get("/reconciliations/{recon_id}", response_model=BankReconciliationResponse)
async def get_reconciliation(
    recon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter detalhes de reconciliação bancária"""
    reconciliation = db.query(BankReconciliation).filter(
        BankReconciliation.id == recon_id
    ).first()
    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliação não encontrada")
    return reconciliation


@router.delete("/reconciliations/{recon_id}")
async def delete_reconciliation(
    recon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletar reconciliação bancária"""
    reconciliation = db.query(BankReconciliation).filter(
        BankReconciliation.id == recon_id
    ).first()
    if not reconciliation:
        raise HTTPException(status_code=404, detail="Reconciliação não encontrada")
    
    db.delete(reconciliation)
    db.commit()
    return {"message": "Reconciliação deletada com sucesso"}


# ============= FINANCIAL ANALYTICS ENDPOINTS =============

@router.get("/summary", response_model=FinancialSummary)
async def get_financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obter resumo financeiro geral"""
    # Contas a receber
    receivables = db.query(AccountsReceivable).all()
    total_receivable = sum([r.balance for r in receivables])
    overdue_receivable = sum([r.balance for r in receivables if r.due_date < datetime.utcnow()])
    
    # Contas a pagar
    payables = db.query(AccountsPayable).all()
    total_payable = sum([p.balance for p in payables])
    overdue_payable = sum([p.balance for p in payables if p.due_date < datetime.utcnow()])
    
    # Saldo bancário
    accounts = db.query(BankAccount).all()
    total_bank_balance = sum([a.current_balance for a in accounts])
    
    # Fluxo de caixa próximos 30 e 90 dias
    now = datetime.utcnow()
    cf_30 = db.query(CashFlow).filter(
        CashFlow.due_date >= now,
        CashFlow.due_date <= now + timedelta(days=30),
    ).all()
    cash_flow_30 = sum([cf.amount if cf.category == "entrada" else -cf.amount for cf in cf_30])
    
    cf_90 = db.query(CashFlow).filter(
        CashFlow.due_date >= now,
        CashFlow.due_date <= now + timedelta(days=90),
    ).all()
    cash_flow_90 = sum([cf.amount if cf.category == "entrada" else -cf.amount for cf in cf_90])
    
    return FinancialSummary(
        total_receivable=total_receivable,
        total_payable=total_payable,
        total_bank_balance=total_bank_balance,
        cash_flow_30_days=cash_flow_30,
        cash_flow_90_days=cash_flow_90,
        overdue_receivable=overdue_receivable,
        overdue_payable=overdue_payable,
        net_position=total_bank_balance + total_receivable - total_payable,
    )
