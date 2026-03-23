"""
Logging configuration

Responsabilidade: Configurar logs estruturados da aplicação
- Logging em arquivo e console
- Diferentes níveis de log
- Formatação padronizada
"""

import logging
import logging.handlers
from pathlib import Path
from app.core.config import settings


def setup_logging():
    """
    Configura o sistema de logging da aplicação
    
    Logs são salvos em:
    - logs/app.log (todas as mensagens)
    - logs/error.log (apenas erros)
    """
    
    # Criar diretório de logs se não existir
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configurar logger raiz
    logger = logging.getLogger("erp_system")
    logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    
    # Formato de log padronizado
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler para arquivo geral
    file_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "app.log",
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Handler para arquivo de erros
    error_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "error.log",
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


# Logger global
logger = setup_logging()
