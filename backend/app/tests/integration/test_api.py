"""
Testes de Integração - API Endpoints

Responsabilidade: Testar endpoints da API completos (banco + lógica)
"""

import pytest
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.models import User, UserRole
from app.core.security import security_service


# ============================================================================
# FIXTURES
# ============================================================================

# Usar SQLite em memória para testes
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Criar banco de teste para cada teste"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    """Criar cliente de teste com banco mockado"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Criar usuário admin para testes"""
    user = User(
        email="admin@example.com",
        full_name="Admin User",
        password_hash=security_service.hash_password("AdminPass123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token(client, email: str, password: str) -> str:
    """Helper para obter token JWT"""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Testes de autenticação"""
    
    def test_login_success(self, client, admin_user, db):
        """Testa login bem-sucedido"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.com", "password": "AdminPass123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] == 1800
    
    def test_login_invalid_credentials(self, client, admin_user):
        """Testa login com credenciais inválidas"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "admin@example.com", "password": "WrongPassword"}
        )
        
        assert response.status_code == 401
    
    def test_get_current_user(self, client, admin_user, db):
        """Testa obtenção de usuário autenticado"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@example.com"
        assert data["role"] == "admin"


# ============================================================================
# USER ENDPOINTS TESTS
# ============================================================================

class TestUserEndpoints:
    """Testes dos endpoints de usuários"""
    
    def test_create_user_as_admin(self, client, admin_user, db):
        """Testa criação de usuário como admin"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.post(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "email": "newuser@example.com",
                "full_name": "New User",
                "password": "NewPass123",
                "role": "user"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["role"] == "user"
    
    def test_list_users(self, client, admin_user, db):
        """Testa listagem de usuários"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.get(
            "/api/v1/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "items" in data
        assert data["total"] >= 1
    
    def test_get_user(self, client, admin_user, db):
        """Testa obtenção de usuário específico"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.get(
            f"/api/v1/users/{admin_user.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == admin_user.id


# ============================================================================
# CLIENT ENDPOINTS TESTS
# ============================================================================

class TestClientEndpoints:
    """Testes dos endpoints de clientes"""
    
    def test_create_client(self, client, admin_user, db):
        """Testa criação de cliente"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.post(
            "/api/v1/clients",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "ACME Corporation",
                "email": "contact@acme.com",
                "phone": "+55 11 98765-4321",
                "city": "São Paulo",
                "country": "Brazil"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "ACME Corporation"
        assert data["email"] == "contact@acme.com"
    
    def test_list_clients(self, client, admin_user, db):
        """Testa listagem de clientes"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.get(
            "/api/v1/clients",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "items" in data


# ============================================================================
# PRODUCT ENDPOINTS TESTS
# ============================================================================

class TestProductEndpoints:
    """Testes dos endpoints de produtos"""
    
    def test_create_product(self, client, admin_user, db):
        """Testa criação de produto"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.post(
            "/api/v1/products",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "sku": "PROD-001",
                "name": "Product Premium",
                "price": 99.99,
                "cost": 50.00,
                "quantity": 100,
                "category": "Electronics"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["sku"] == "PROD-001"
        assert data["price"] == 99.99
    
    def test_list_products(self, client, admin_user, db):
        """Testa listagem de produtos"""
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        response = client.get(
            "/api/v1/products",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "items" in data
    
    def test_adjust_stock(self, client, admin_user, db):
        """Testa ajuste de estoque"""
        # Criar produto primeiro
        token = get_token(client, "admin@example.com", "AdminPass123")
        
        create_response = client.post(
            "/api/v1/products",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "sku": "PROD-002",
                "name": "Stock Product",
                "price": 50.00,
                "quantity": 100
            }
        )
        
        product_id = create_response.json()["id"]
        
        # Ajustar estoque
        adjust_response = client.post(
            f"/api/v1/products/{product_id}/adjust-stock",
            headers={"Authorization": f"Bearer {token}"},
            params={"quantity_change": -10, "reason": "Venda"}
        )
        
        assert adjust_response.status_code == 200
        data = adjust_response.json()
        assert data["quantity"] == 90


# ============================================================================
# AUTHORIZATION TESTS
# ============================================================================

class TestAuthorization:
    """Testes de controle de acesso"""
    
    def test_viewers_cannot_create_clients(self, client, admin_user, db):
        """Testa que viewers não podem criar clientes"""
        # Criar usuário viewer
        viewer = User(
            email="viewer@example.com",
            full_name="Viewer User",
            password_hash=security_service.hash_password("ViewerPass123"),
            role=UserRole.VIEWER,
            is_active=True
        )
        db.add(viewer)
        db.commit()
        
        token = get_token(client, "viewer@example.com", "ViewerPass123")
        
        response = client.post(
            "/api/v1/clients",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": "Test Client",
                "email": "test@example.com"
            }
        )
        
        assert response.status_code == 403
    
    def test_missing_token_returns_401(self, client):
        """Testa que requisição sem token retorna 401"""
        response = client.get("/api/v1/users")
        
        assert response.status_code == 403 or response.status_code == 401


# ============================================================================
# HEALTH CHECK
# ============================================================================

class TestHealth:
    """Testes de saúde da aplicação"""
    
    def test_health_check(self, client):
        """Testa endpoint de health check"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_root_endpoint(self, client):
        """Testa endpoint raiz"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
