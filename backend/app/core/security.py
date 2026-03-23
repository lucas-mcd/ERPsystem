"""
Segurança e autenticação JWT

Responsabilidade: Gerenciar tokens JWT, hashing de senhas e autenticação
- Criação e validação de tokens JWT
- Hashing bcrypt para senhas
- Geração de tokens de acesso
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.exceptions import AuthenticationError

# Contexto para hashing de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityService:
    """
    Serviço centralizado de segurança e autenticação
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Gera hash bcrypt de uma senha
        
        Args:
            password: Senha em texto plano
            
        Returns:
            Hash bcrypt seguro
        """
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verifica se a senha corresponde ao hash
        
        Args:
            plain_password: Senha em texto plano
            hashed_password: Hash armazenado
            
        Returns:
            True se as senhas coincidem
        """
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Cria um token JWT de acesso
        
        Args:
            data: Dados a serem codificados no token
            expires_delta: Tempo de expiração customizado
            
        Returns:
            Token JWT codificado
        """
        to_encode = data.copy()
        
        # Usar expiração customizada ou usar a padrão
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=settings.access_token_expire_minutes
            )
        
        to_encode.update({"exp": expire})
        
        # Codificar token JWT
        encoded_jwt = jwt.encode(
            to_encode,
            settings.secret_key,
            algorithm=settings.algorithm
        )
        
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """
        Decodifica e valida um token JWT
        
        Args:
            token: Token JWT a validar
            
        Returns:
            Dados decodificados do token
            
        Raises:
            AuthenticationError: Se o token for inválido ou expirado
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm]
            )
            return payload
        except JWTError as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")


# Instância global de segurança
security_service = SecurityService()
