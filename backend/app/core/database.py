"""
Database connection and session management

Responsabilidade: Gerenciar conexão e sessão com o banco de dados
- Criar engines SQLAlchemy
- Gerenciar sessões
- Base de modelos ORM
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import QueuePool
from app.core.config import settings

# Base para todos os modelos
Base = declarative_base()

# Criar engine com pool de conexões
engine = create_engine(
    settings.get_database_url,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=0,
    echo=settings.debug,
    pool_pre_ping=True,  # Verificar conexão antes de usar
)

# Criar factory de sessões
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Session:
    """
    Dependency para injetar sessão de banco de dados nos endpoints
    
    Yields:
        Sessão SQLAlchemy
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializa o banco de dados criando todas as tabelas
    """
    Base.metadata.create_all(bind=engine)
