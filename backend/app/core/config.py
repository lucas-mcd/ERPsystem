"""
Core configuration module

Responsabilidade: Centralizar todas as configurações da aplicação
- Variáveis de ambiente
- Configuração de banco de dados
- Secrets e JWT
- Modo debug
"""

import secrets
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Configurações centralizadas da aplicação
    
    As variáveis são carregadas do arquivo .env ou variáveis de ambiente.
    """
    
    # Database Configuration
    database_url: Optional[str] = None  # Para Railway (DATABASE_URL)
    db_host: str = "localhost"
    db_port: int = 5432  # PostgreSQL default
    db_user: str = "postgres"
    db_password: str = "password"
    db_name: str = "erp_system"
    use_sqlite: bool = True  # SQLite PADRÃO para desenvolvimento local
    
    # JWT Configuration (SEGURO)
    secret_key: str = "change-this-in-production"  # Será regenerado automaticamente
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Security Configuration
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"  # CORS restrito
    max_login_attempts: int = 5  # Rate limiting de login
    login_lockout_minutes: int = 15  # Minutos de lockout após falhas
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False  # NUNCA use True em produção!
    
    # Redis Configuration
    redis_host: Optional[str] = "localhost"
    redis_port: int = 6379
    
    @property
    def get_database_url(self) -> str:
        """
        Retorna a URL do banco de dados com prioridade:
        1. DATABASE_URL (fornecido por Railway)
        2. Construir URL manualmente a partir das variáveis
        
        Suporta: PostgreSQL (produção), SQLite (desenvolvimento local)
        """
        # Se DATABASE_URL está definida (Railway), usar ela
        if self.database_url:
            return self.database_url
        
        # Se usar SQLite (desenvolvimento local)
        if self.use_sqlite:
            return "sqlite:///./erp_system.db"
        
        # Caso contrário, construir URL PostgreSQL manualmente
        return (
            f"postgresql://{self.db_user}:{self.db_password}@"
            f"{self.db_host}:{self.db_port}/{self.db_name}"
        )
    
    def __init__(self, **data):
        super().__init__(**data)
        # Gerar secret_key seguro se não estiver definido
        if not self.secret_key or len(self.secret_key) < 32:
            self.secret_key = secrets.token_urlsafe(32)
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Instância global de configurações
settings = Settings()
