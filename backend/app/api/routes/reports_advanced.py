"""
Advanced Reports Routes
Download PDF reports and chart data
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.models import User
from app.services.report_generator import report_generator
import io

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("/clients/pdf")
async def get_clients_pdf(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download clients report as PDF
    
    Parameters:
    - days: Number of days to include in report (default: 30)
    """
    
    start_date = datetime.now() - timedelta(days=days)
    end_date = datetime.now()
    
    try:
        pdf_buffer = report_generator.generate_clients_report(db, start_date, end_date)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_clientes_{datetime.now().strftime('%d_%m_%Y')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar relatório: {str(e)}"
        )


@router.get("/products/pdf")
async def get_products_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download products report as PDF"""
    
    try:
        pdf_buffer = report_generator.generate_products_report(db)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_produtos_{datetime.now().strftime('%d_%m_%Y')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar relatório: {str(e)}"
        )


@router.get("/orders/pdf")
async def get_orders_pdf(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download orders report as PDF
    
    Parameters:
    - days: Number of days to include in report (default: 30)
    """
    
    start_date = datetime.now() - timedelta(days=days)
    end_date = datetime.now()
    
    try:
        pdf_buffer = report_generator.generate_orders_report(db, start_date, end_date)
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=relatorio_pedidos_{datetime.now().strftime('%d_%m_%Y')}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar relatório: {str(e)}"
        )


@router.get("/charts/{report_type}")
async def get_chart_data(
    report_type: str,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chart data for frontend visualization
    
    report_type: clients, products, orders, financial
    """
    
    if report_type not in ["clients", "products", "orders", "financial"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report type inválido"
        )
    
    start_date = datetime.now() - timedelta(days=days)
    end_date = datetime.now()
    
    try:
        data = report_generator.get_report_data(db, report_type, start_date, end_date)
        return data
    except Exception as e:
        import traceback
        print(f"Error in get_chart_data for {report_type}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter dados: {str(e)}"
        )
