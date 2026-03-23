"""
Aplicação FastAPI principal

Responsabilidade: Inicializar e configurar a aplicação FastAPI
- Configurar CORS
- Registrar rotas
- Configurar tratamento de exceções
- Inicializar banco de dados
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
from starlette.middleware.base import BaseHTTPMiddleware

from .core.config import settings
from .core.exceptions import AppException
from .core.database import init_db
from .core.logging import logger

# Imports das rotas
from .api.routes import auth, users, clients, products, reports, reports_advanced, stock, orders, suppliers, financial, hr, accounts


# Lifecycle events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerencia eventos de inicialização e shutdown da aplicação
    """
    # Startup
    logger.info("Iniciando aplicação ERP System")
    init_db()
    logger.info("Banco de dados inicializado")
    
    yield
    
    # Shutdown
    logger.info("Desligando aplicação")


# Criar aplicação FastAPI
app = FastAPI(
    title="ERP System API",
    description="API completa para gestão empresarial",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.debug,
)


# ============= SECURITY MIDDLEWARE =============

# Adicionar headers de segurança
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Previne ClickJacking
        response.headers["X-Frame-Options"] = "DENY"
        # Previne MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Previne XSS
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http: https:"
        )
        # Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Configurar CORS com domínios específicos

# Corrigir CORS para aceitar frontend local e facilitar testes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Permite frontend local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

allowed_origins = ["localhost", "127.0.0.1"]
# Trusted Host Middleware para prevenir Host Header Injection
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_origins
)


# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """
    Handler customizado para AppException
    Retorna resposta estruturada com erro
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handler genérico para exceções não capturadas
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
            }
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Endpoint de verificação de saúde da aplicação
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "development" if settings.debug else "production"
    }


# Root endpoint
@app.get("/")
async def root():
    """
    Endpoint raiz da API
    """
    return {
        "message": "ERP System API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Registrar rotas da API
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(clients.router, prefix="/api/v1/clients", tags=["Clients"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(suppliers.router, tags=["Suppliers"])
app.include_router(accounts.router, tags=["Accounts & Treasury"])
app.include_router(financial.router, prefix="/api/v1/financial", tags=["Financial - Pricing & Analysis"])
app.include_router(reports.router, prefix="/api/v1", tags=["Reports & Audit"])
app.include_router(reports_advanced.router)
app.include_router(stock.router)
app.include_router(hr.router, tags=["HR & Payroll"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
