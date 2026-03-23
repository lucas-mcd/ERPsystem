"""
Rate Limiting e Proteção contra Força Bruta

Protege endpoints contra ataques de força bruta
"""

from datetime import datetime, timedelta
from typing import Dict, Tuple
from functools import lru_cache


class RateLimiter:
    """
    Implementa rate limiting em memória
    Nota: Para produção, usar Redis
    """
    
    def __init__(self):
        self.attempts: Dict[str, list] = {}  # {ip: [timestamps]}
    
    def is_rate_limited(
        self, 
        identifier: str, 
        max_attempts: int = 5, 
        window_minutes: int = 15
    ) -> Tuple[bool, int]:
        """
        Verifica se uma requisição deve ser bloqueada por rate limiting
        
        Args:
            identifier: IP/user ID/email a limitar
            max_attempts: Máximo de tentativas permitidas
            window_minutes: Janela de tempo em minutos
            
        Returns:
            (is_limited, remaining_attempts)
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=window_minutes)
        
        # Obter tentativas anteriores para este identificador
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        # Remover tentativas fora da janela de tempo
        self.attempts[identifier] = [
            ts for ts in self.attempts[identifier] 
            if ts > cutoff
        ]
        
        # Contar tentativas na janela
        attempt_count = len(self.attempts[identifier])
        
        # Se excedeu límite
        if attempt_count >= max_attempts:
            return True, 0
        
        # Registrar nova tentativa
        self.attempts[identifier].append(now)
        
        return False, max_attempts - attempt_count - 1
    
    def reset(self, identifier: str):
        """
        Reseta contador de tentativas para um identificador
        """
        if identifier in self.attempts:
            del self.attempts[identifier]
    
    def cleanup(self):
        """
        Remove entradas antigas do rate limiter
        Deve ser chamado periodicamente
        """
        now = datetime.utcnow()
        expired_keys = []
        
        for identifier, attempts in self.attempts.items():
            # Se não houver tentativas recentes, remover
            if not attempts or all(ts < now - timedelta(hours=1) for ts in attempts):
                expired_keys.append(identifier)
        
        for key in expired_keys:
            del self.attempts[key]


# Instância global
rate_limiter = RateLimiter()


# Limites específicos por tipo de operação
RATE_LIMITS = {
    "login": {"max_attempts": 5, "window_minutes": 15},
    "register": {"max_attempts": 3, "window_minutes": 60},
    "password_reset": {"max_attempts": 3, "window_minutes": 60},
    "api_general": {"max_attempts": 100, "window_minutes": 1},
}
