"""
Input Sanitization and Validation

Previnir XSS, SQL Injection e outras vulnerabilidades de entrada
"""

import html
import re
from typing import Any, Union


class InputSanitizer:
    """
    Sanitiza entradas para prevenir XSS e injeção de código
    """
    
    # Padrões perigosos que indicam potencial XSS
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',  # <script> tags
        r'javascript:',  # javascript: protocol
        r'on\w+\s*=',  # event handlers (onclick, onerror, etc)
        r'<iframe[^>]*>',  # iframes
        r'<object[^>]*>',  # object tags
        r'<embed[^>]*>',  # embed tags
    ]
    
    @staticmethod
    def sanitize_string(value: str, allow_html: bool = False) -> str:
        """
        Remove caracteres perigosos de uma string
        
        Args:
            value: String a sanitizar
            allow_html: Se True, permite HTML (mal recomendado)
            
        Returns:
            String sanitizada
        """
        if not isinstance(value, str):
            return str(value)
        
        # Remove espaços em branco no início e fim
        value = value.strip()
        
        # Se não permitir HTML, escape tudo
        if not allow_html:
            return html.escape(value)
        
        # Se permitir HTML, verificar padrões XSS
        for pattern in InputSanitizer.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
                # Se encontrou padrão perigoso, remover
                value = re.sub(pattern, '', value, flags=re.IGNORECASE | re.DOTALL)
        
        return value
    
    @staticmethod
    def sanitize_input(value: Any) -> Any:
        """
        Sanitiza qualquer tipo de entrada
        
        Args:
            value: Valor a sanitizar (string, dict, list, etc)
            
        Returns:
            Valor sanitizado
        """
        if isinstance(value, str):
            return InputSanitizer.sanitize_string(value)
        elif isinstance(value, dict):
            return {k: InputSanitizer.sanitize_input(v) for k, v in value.items()}
        elif isinstance(value, (list, tuple)):
            return [InputSanitizer.sanitize_input(item) for item in value]
        else:
            return value
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        Valida formato de email com regex seguro
        """
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """
        Valida formato de telefone (simplificado)
        """
        # Remove caracteres não numéricos
        digits = re.sub(r'\D', '', phone)
        # Deve ter entre 10 e 15 dígitos (padrão internacional)
        return 10 <= len(digits) <= 15
    
    @staticmethod
    def validate_cpf(cpf: str) -> bool:
        """
        Valida formato de CPF brasileiro
        """
        # Remove caracteres não numéricos
        cpf = re.sub(r'\D', '', cpf)
        
        # CPF deve ter exatamente 11 dígitos
        if len(cpf) != 11:
            return False
        
        # CPF não pode ter todos os dígitos iguais
        if cpf == cpf[0] * 11:
            return False
        
        return True
    
    @staticmethod
    def truncate_string(value: str, max_length: int = 255) -> str:
        """
        Trunca string para evitar ataques de estouro de buffer
        """
        if not isinstance(value, str):
            return str(value)
        
        return value[:max_length]


# Instância global
sanitizer = InputSanitizer()
