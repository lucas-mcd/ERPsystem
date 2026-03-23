"""
Exceções de domínio da aplicação

Responsabilidade: Definir exceções específicas de negócio e erros da aplicação
- Exceções customizadas para diferentes cenários
- Mapeamento para respostas HTTP apropriadas
"""

from typing import Any, Dict, Optional


class AppException(Exception):
    """
    Exceção base para todas as exceções da aplicação
    """
    
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(AppException):
    """Erro de validação de dados"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )


class AuthenticationError(AppException):
    """Erro de autenticação"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(AppException):
    """Erro de autorização/permissão"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR"
        )


class NotFoundError(AppException):
    """Recurso não encontrado"""
    
    def __init__(self, resource: str, resource_id: Any = None):
        if resource_id:
            message = f"{resource} with id {resource_id} not found"
        else:
            message = f"{resource} not found"
        super().__init__(
            message=message,
            status_code=404,
            error_code="NOT_FOUND"
        )


class ConflictError(AppException):
    """Conflito de dados (ex: duplicação)"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="CONFLICT",
            details=details
        )


class BusinessRuleError(AppException):
    """Violação de regra de negócio"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="BUSINESS_RULE_VIOLATION",
            details=details
        )


class InvalidCredentialsError(AuthenticationError):
    """Credenciais inválidas"""
    
    def __init__(self):
        super().__init__("Invalid email or password")


class EmailAlreadyExistsError(ConflictError):
    """Email já existe no sistema"""
    
    def __init__(self, email: str):
        super().__init__(
            message=f"Email {email} already exists",
            details={"field": "email", "value": email}
        )


class DatabaseError(AppException):
    """Erro geral de banco de dados"""
    
    def __init__(self, message: str = "Database error"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR"
        )


class InternalServerError(AppException):
    """Erro interno do servidor"""
    
    def __init__(self, message: str = "Internal server error"):
        super().__init__(
            message=message,
            status_code=500,
            error_code="INTERNAL_SERVER_ERROR"
        )
