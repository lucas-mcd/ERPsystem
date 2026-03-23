"""
Rotas de Audit Logs e Relatórios

Responsabilidade:
- Visualizar logs de auditoria
- Gerar relatórios (CSV, PDF)
- Importar dados (CSV)
"""

import csv
import json
from datetime import datetime
from io import StringIO
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch
from reportlab.lib import colors

from app.core.database import get_db
from app.core.exceptions import AppException, ValidationError
from app.models.models import User, UserRole, Client, Product
from app.schemas.schemas import AuditLogResponse, AuditLogListResponse
from app.services.service import AuditLogService, ClientService, ProductService
from app.api.dependencies.auth import get_current_user, get_current_admin

router = APIRouter()


# ============================================================================
# AUDIT LOG ENDPOINTS
# ============================================================================

@router.get(
    "/audit-logs",
    response_model=AuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar audit logs",
    dependencies=[Depends(get_current_admin)]
)
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    entity: str = Query(None, description="Filtrar por entidade"),
    action: str = Query(None, description="Filtrar por ação"),
    user_id: int = Query(None, description="Filtrar por usuário"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Listar audit logs (Admin only)
    
    Permite filtrar por:
    - entity: User, Client, Product
    - action: CREATE, UPDATE, DELETE, LOGIN
    - user_id: ID do usuário que realizou ação
    """
    audit_service = AuditLogService(db)
    
    if user_id:
        logs, total = audit_service.get_user_activity(user_id, skip, limit)
    elif action:
        logs, total = audit_service.get_action_logs(action, skip, limit)
    else:
        # Retornar todos os logs
        logs = audit_service.repo.get_all(skip, limit)
        total = audit_service.repo.get_count()
    
    return AuditLogListResponse(
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        items=logs
    )


@router.get(
    "/audit-logs/entity/{entity}/{entity_id}",
    response_model=AuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter histórico de uma entidade",
    dependencies=[Depends(get_current_user)]
)
async def get_entity_history(
    entity: str,
    entity_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter histórico completo de alterações de uma entidade
    
    Path parameters:
    - entity: Tipo de entidade (User, Client, Product)
    - entity_id: ID da entidade
    
    Response:
    ```json
    {
        "total": 15,
        "page": 1,
        "page_size": 100,
        "items": [
            {
                "id": 45,
                "user_id": 1,
                "action": "UPDATE",
                "entity": "Client",
                "entity_id": 5,
                "old_values": "{\"name\": \"Old Name\"}",
                "new_values": "{\"name\": \"New Name\"}",
                "timestamp": "2024-01-15T10:30:00"
            }
        ]
    }
    ```
    """
    audit_service = AuditLogService(db)
    logs, total = audit_service.get_entity_history(entity, entity_id, skip, limit)
    
    return AuditLogListResponse(
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        items=logs
    )


# ============================================================================
# RELATÓRIOS - CSV
# ============================================================================

@router.get(
    "/reports/clients/csv",
    status_code=status.HTTP_200_OK,
    summary="Exportar clientes em CSV",
    dependencies=[Depends(get_current_user)]
)
async def export_clients_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exportar lista de clientes em formato CSV
    
    Query parameters:
    - start_date: Data inicial (ISO format)
    - end_date: Data final (ISO format)
    """
    client_service = ClientService(db)
    clients, _ = client_service.list_clients(skip=0, limit=99999)
    
    # Criar CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Nome", "Email", "Telefone", "Cidade", "Estado",
        "CEP", "País", "CNPJ", "Data de Criação"
    ])
    
    # Dados
    for client in clients:
        writer.writerow([
            client.id,
            client.name,
            client.email,
            client.phone or "",
            client.city or "",
            client.state or "",
            client.postal_code or "",
            client.country,
            client.tax_id or "",
            client.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    # Retornar como download
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=clientes.csv"}
    )


@router.get(
    "/reports/products/csv",
    status_code=status.HTTP_200_OK,
    summary="Exportar produtos em CSV",
    dependencies=[Depends(get_current_user)]
)
async def export_products_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exportar lista de produtos em formato CSV
    """
    product_service = ProductService(db)
    products, _ = product_service.list_products(skip=0, limit=99999)
    
    # Criar CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "SKU", "Nome", "Preço", "Custo", "Estoque",
        "Categoria", "Ativo", "Margem %", "Data de Criação"
    ])
    
    # Dados
    for product in products:
        margin = product_service.get_profit_margin(product)
        writer.writerow([
            product.id,
            product.sku,
            product.name,
            f"{product.price:.2f}",
            f"{product.cost:.2f}" if product.cost else "N/A",
            product.quantity,
            product.category or "",
            "Sim" if product.is_active else "Não",
            f"{margin:.2f}%",
            product.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    # Retornar como download
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=produtos.csv"}
    )


# ============================================================================
# RELATÓRIOS - PDF
# ============================================================================

@router.get(
    "/reports/products/pdf",
    status_code=status.HTTP_200_OK,
    summary="Exportar produtos em PDF",
    dependencies=[Depends(get_current_user)]
)
async def export_products_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exportar relatório de produtos em PDF com gráfico e estatísticas
    """
    from io import BytesIO
    
    product_service = ProductService(db)
    products, total = product_service.list_products(skip=0, limit=99999)
    
    # Criar PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Título
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=30,
        alignment=1  # Center
    )
    elements.append(Paragraph("RELATÓRIO DE PRODUTOS", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Informações gerais
    total_products = len(products)
    active_products = sum(1 for p in products if p.is_active)
    total_value = sum(p.quantity * p.price for p in products)
    
    info_text = f"""
    <b>Data do Relatório:</b> {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}<br/>
    <b>Total de Produtos:</b> {total_products}<br/>
    <b>Produtos Ativos:</b> {active_products}<br/>
    <b>Valor Total em Estoque:</b> R$ {total_value:,.2f}
    """
    elements.append(Paragraph(info_text, styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Tabela de produtos
    data = [["SKU", "Nome", "Preço", "Estoque", "Categoria", "Margem"]]
    for product in products[:50]:  # Limitar a 50 para caber no PDF
        margin = product_service.get_profit_margin(product)
        data.append([
            product.sku,
            product.name[:20],  # Truncar nome
            f"R$ {product.price:.2f}",
            str(product.quantity),
            product.category or "-",
            f"{margin:.1f}%"
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorio_produtos.pdf"}
    )


# ============================================================================
# IMPORTAÇÃO - CSV
# ============================================================================

@router.post(
    "/imports/clients/csv",
    status_code=status.HTTP_201_CREATED,
    summary="Importar clientes de CSV",
    dependencies=[Depends(get_current_admin)]
)
async def import_clients_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Importar clientes a partir de arquivo CSV
    
    Formato esperado do CSV:
    ```
    Nome,Email,Telefone,Cidade,Estado,CEP,País,CNPJ
    ACME Corp,contact@acme.com,+55 11 98765-4321,São Paulo,SP,01234-567,Brazil,12.345.678/0001-90
    ```
    
    Resposta:
    ```json
    {
        "success": true,
        "total_rows": 50,
        "imported": 48,
        "errors": [
            {"row": 2, "error": "Email already exists"},
            {"row": 15, "error": "Invalid email format"}
        ]
    }
    ```
    """
    try:
        client_service = ClientService(db)
        
        # Ler arquivo CSV
        contents = await file.read()
        csv_reader = csv.DictReader(contents.decode('utf-8').splitlines())
        
        imported = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Começar em 2 (linha 1 é header)
            try:
                # Validar campos obrigatórios
                if not row.get('Nome') or not row.get('Email'):
                    errors.append({"row": row_num, "error": "Name and Email are required"})
                    continue
                
                # Criar cliente
                client_service.create_client(
                    name=row['Nome'],
                    email=row['Email'],
                    phone=row.get('Telefone'),
                    address=row.get('Endereço'),
                    city=row.get('Cidade'),
                    state=row.get('Estado'),
                    postal_code=row.get('CEP'),
                    country=row.get('País', 'Brazil'),
                    tax_id=row.get('CNPJ'),
                    current_user=current_user
                )
                imported += 1
            
            except AppException as e:
                errors.append({"row": row_num, "error": str(e.message)})
            except Exception as e:
                errors.append({"row": row_num, "error": str(e)})
        
        return {
            "success": True,
            "total_rows": row_num - 1,  # Excluir header
            "imported": imported,
            "errors": errors
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )


@router.post(
    "/imports/products/csv",
    status_code=status.HTTP_201_CREATED,
    summary="Importar produtos de CSV",
    dependencies=[Depends(get_current_admin)]
)
async def import_products_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Importar produtos a partir de arquivo CSV
    
    Formato esperado do CSV:
    ```
    SKU,Nome,Preço,Custo,Estoque,Categoria,Ativo
    PROD-001,Produto Premium,99.99,50.00,100,Eletrônicos,Sim
    ```
    
    Resposta:
    ```json
    {
        "success": true,
        "total_rows": 500,
        "imported": 498,
        "errors": [
            {"row": 25, "error": "SKU already exists"},
            {"row": 150, "error": "Invalid price"}
        ]
    }
    ```
    """
    try:
        product_service = ProductService(db)
        
        # Ler arquivo CSV
        contents = await file.read()
        csv_reader = csv.DictReader(contents.decode('utf-8').splitlines())
        
        imported = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Validar campos obrigatórios
                if not row.get('SKU') or not row.get('Nome') or not row.get('Preço'):
                    errors.append({"row": row_num, "error": "SKU, Nome, and Preço are required"})
                    continue
                
                # Converter valores
                price = float(row['Preço'])
                cost = float(row.get('Custo', 0)) if row.get('Custo') else None
                quantity = int(row.get('Estoque', 0))
                is_active = row.get('Ativo', 'Sim').lower() in ['sim', 'true', '1']
                
                # Criar produto
                product_service.create_product(
                    sku=row['SKU'],
                    name=row['Nome'],
                    price=price,
                    cost=cost,
                    quantity=quantity,
                    category=row.get('Categoria'),
                    description=row.get('Descrição'),
                    is_active=is_active,
                    current_user=current_user
                )
                imported += 1
            
            except ValueError as e:
                errors.append({"row": row_num, "error": f"Invalid numeric value: {str(e)}"})
            except AppException as e:
                errors.append({"row": row_num, "error": str(e.message)})
            except Exception as e:
                errors.append({"row": row_num, "error": str(e)})
        
        return {
            "success": True,
            "total_rows": row_num - 1,
            "imported": imported,
            "errors": errors
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )
