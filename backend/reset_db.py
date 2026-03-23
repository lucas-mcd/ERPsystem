"""
Script para RESETAR (limpar e recriar) o banco de dados completamente

Use APENAS quando quiser:
- Deletar TUDO (usuários, produtos, clientes, fornecedores)
- Recriar do zero com dados iniciais
"""

import os
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import SessionLocal, init_db, engine, Base
from app.models.models import User, Client, Product, Supplier, SupplierPricing, UserRole, SupplierStatus, SupplierType, BusinessSegment
from app.core.security import security_service
from app.services.financial_service import FinancialCalculator

def reset_database():
    """DELETA TUDO E RECRIAR DO ZERO"""
    
    # Deletar arquivo do banco
    db_file = "erp_system.db"
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"[DELETE] {db_file} removido")
        except PermissionError:
            print(f"[WARN] {db_file} ainda em uso, continuando mesmo assim...")
    
    # Recriar tabelas vazias
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Tabelas recriadas (vazias)")
    
    db = SessionLocal()
    
    try:
        print("[NOVO] Criando todos os dados do zero...\n")
        
        # Criar usuários
        print("[USERS] Criando usuarios...")
        
        admin_user = User(
            email="admin@example.com",
            full_name="Admin User",
            password_hash=security_service.hash_password("AdminPass123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        
        user_user = User(
            email="user@example.com",
            full_name="Regular User",
            password_hash=security_service.hash_password("UserPass123"),
            role=UserRole.USER,
            is_active=True
        )
        db.add(user_user)
        
        viewer_user = User(
            email="viewer@example.com",
            full_name="Viewer User",
            password_hash=security_service.hash_password("ViewerPass123"),
            role=UserRole.VIEWER,
            is_active=True
        )
        db.add(viewer_user)
        
        db.commit()
        print("[OK] 3 usuarios criados")
        
        # Criar fornecedores
        print("\n[SUPPLIERS] Criando fornecedores...")
        
        suppliers_data = [
            {
                "name": "TechSupply Brasil",
                "email": "tech@supply.com",
                "phone": "+55 11 3000-0001",
                "address": "Rua Industrial, 500",
                "city": "São Paulo",
                "state": "SP",
                "postal_code": "01234-567",
                "country": "Brazil",
                "tax_id": "11.222.333/0001-44",
                "supplier_type": SupplierType.COMPONENTS,
                "business_segment": BusinessSegment.TECHNOLOGY,
                "status": SupplierStatus.ACTIVE,
                "created_by_id": admin_user.id
            },
            {
                "name": "Componentes Eletrônicos Ltda",
                "email": "comp@eletro.com",
                "phone": "+55 21 2500-0002",
                "address": "Av. Rio Branco, 2000",
                "city": "Rio de Janeiro",
                "state": "RJ",
                "postal_code": "20000-000",
                "country": "Brazil",
                "tax_id": "22.333.444/0001-55",
                "supplier_type": SupplierType.EQUIPMENT,
                "business_segment": BusinessSegment.TECHNOLOGY,
                "status": SupplierStatus.ACTIVE,
                "created_by_id": admin_user.id
            },
            {
                "name": "Global Hardware Inc",
                "email": "contact@globalhw.com",
                "phone": "+1 415-555-1234",
                "address": "123 Tech Street",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94105",
                "country": "USA",
                "tax_id": "33.444.555/0001-66",
                "supplier_type": SupplierType.COMPONENTS,
                "business_segment": BusinessSegment.TECHNOLOGY,
                "status": SupplierStatus.ACTIVE,
                "created_by_id": admin_user.id
            },
            {
                "name": "EMPOWER Distribuição",
                "email": "empower@dist.com",
                "phone": "+55 31 3000-0003",
                "address": "Rua das Máquinas, 1500",
                "city": "Belo Horizonte",
                "state": "MG",
                "postal_code": "30130-100",
                "country": "Brazil",
                "tax_id": "44.555.666/0001-77",
                "supplier_type": SupplierType.EQUIPMENT,
                "business_segment": BusinessSegment.TECHNOLOGY,
                "status": SupplierStatus.ACTIVE,
                "created_by_id": admin_user.id
            },
            {
                "name": "Premium Imports S.A.",
                "email": "imports@premium.com",
                "phone": "+55 85 8888-0004",
                "address": "Porto do Mucuripe, 300",
                "city": "Fortaleza",
                "state": "CE",
                "postal_code": "60010-000",
                "country": "Brazil",
                "tax_id": "55.666.777/0001-88",
                "supplier_type": SupplierType.SERVICES,
                "business_segment": BusinessSegment.TECHNOLOGY,
                "status": SupplierStatus.ACTIVE,
                "created_by_id": admin_user.id
            }
        ]
        
        suppliers = {}
        for supplier_data in suppliers_data:
            supplier = Supplier(**supplier_data)
            db.add(supplier)
            suppliers[supplier_data["name"]] = supplier
        
        db.commit()
        suppliers = {s.name: s for s in db.query(Supplier).all()}
        print(f"[OK] {len(suppliers)} fornecedores criados")
        
        # Criar clientes
        print("\n[CLIENTS] Criando clientes...")
        
        clients_data = [
            {
                "name": "ACME Corporation",
                "email": "contact@acme.com",
                "phone": "+55 11 98765-4321",
                "address": "Rua das Flores, 123",
                "city": "São Paulo",
                "state": "SP",
                "postal_code": "01234-567",
                "country": "Brazil",
                "tax_id": "12.345.678/0001-90",
                "created_by_id": admin_user.id
            },
            {
                "name": "Tech Solutions Inc.",
                "email": "info@techsolutions.com",
                "phone": "+55 21 99999-8888",
                "address": "Avenida Paulista, 1000",
                "city": "Rio de Janeiro",
                "state": "RJ",
                "postal_code": "20000-000",
                "country": "Brazil",
                "tax_id": "98.765.432/0001-01",
                "created_by_id": admin_user.id
            },
            {
                "name": "Global Trading Ltd.",
                "email": "sales@globaltrading.com",
                "phone": "+55 31 91234-5678",
                "address": "Av. Getúlio Vargas, 5000",
                "city": "Belo Horizonte",
                "state": "MG",
                "postal_code": "30130-100",
                "country": "Brazil",
                "tax_id": "34.567.890/0001-12",
                "created_by_id": admin_user.id
            }
        ]
        
        for client_data in clients_data:
            client = Client(**client_data)
            db.add(client)
        
        db.commit()
        print(f"[OK] {len(clients_data)} clientes criados")
        
        # Criar preços dos fornecedores
        print("\n[PRICING] Criando precos de fornecedores...")
        
        financial_calc = FinancialCalculator()
        
        supplier_pricing_data = [
            {
                "supplier_id": suppliers["TechSupply Brasil"].id,
                "product_name": "Laptop Dell XPS",
                "cost_price": 3000.00,
                "sale_price": 4999.99,
                "transportation_cost": 200.00,
                "icms_rate": 0.07,
                "ipi_rate": 0.00,
                "cofins_rate": 0.0765,
                "pis_rate": 0.0165,
                "other_taxes": 0.00,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=365)
            },
            {
                "supplier_id": suppliers["Componentes Eletrônicos Ltda"].id,
                "product_name": "Monitor LG 27 polegadas",
                "cost_price": 700.00,
                "sale_price": 1299.99,
                "transportation_cost": 50.00,
                "icms_rate": 0.07,
                "ipi_rate": 0.00,
                "cofins_rate": 0.0765,
                "pis_rate": 0.0165,
                "other_taxes": 0.00,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=365)
            },
            {
                "supplier_id": suppliers["Global Hardware Inc"].id,
                "product_name": "Teclado Mecânico RGB",
                "cost_price": 150.00,
                "sale_price": 349.99,
                "transportation_cost": 30.00,
                "icms_rate": 0.07,
                "ipi_rate": 0.10,
                "cofins_rate": 0.0765,
                "pis_rate": 0.0165,
                "other_taxes": 25.00,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=365)
            },
            {
                "supplier_id": suppliers["EMPOWER Distribuição"].id,
                "product_name": "Mouse Logitech MX Master",
                "cost_price": 100.00,
                "sale_price": 249.99,
                "transportation_cost": 15.00,
                "icms_rate": 0.07,
                "ipi_rate": 0.00,
                "cofins_rate": 0.0765,
                "pis_rate": 0.0165,
                "other_taxes": 0.00,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=365)
            },
            {
                "supplier_id": suppliers["Premium Imports S.A."].id,
                "product_name": "Webcam HD 1080p",
                "cost_price": 80.00,
                "sale_price": 199.99,
                "transportation_cost": 20.00,
                "icms_rate": 0.07,
                "ipi_rate": 0.05,
                "cofins_rate": 0.0765,
                "pis_rate": 0.0165,
                "other_taxes": 10.00,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=365)
            }
        ]
        
        for pricing_data in supplier_pricing_data:
            calculations = financial_calc.calculate_margins(
                cost_price=pricing_data["cost_price"],
                sale_price=pricing_data["sale_price"],
                transportation_cost=pricing_data["transportation_cost"],
                icms_rate=pricing_data["icms_rate"],
                ipi_rate=pricing_data["ipi_rate"],
                cofins_rate=pricing_data["cofins_rate"],
                pis_rate=pricing_data["pis_rate"],
                other_taxes=pricing_data["other_taxes"]
            )
            
            pricing = SupplierPricing(
                supplier_id=pricing_data["supplier_id"],
                product_name=pricing_data["product_name"],
                cost_price=pricing_data["cost_price"],
                sale_price=pricing_data["sale_price"],
                transportation_cost=pricing_data["transportation_cost"],
                icms_rate=pricing_data["icms_rate"],
                ipi_rate=pricing_data["ipi_rate"],
                cofins_rate=pricing_data["cofins_rate"],
                pis_rate=pricing_data["pis_rate"],
                other_taxes=pricing_data["other_taxes"],
                gross_margin=calculations["gross_margin"],
                net_margin=calculations["net_margin"],
                profit_amount=calculations["net_profit"],
                currency=pricing_data["currency"],
                effective_date=pricing_data["effective_date"],
                expiry_date=pricing_data["expiry_date"]
            )
            db.add(pricing)
        
        db.commit()
        print(f"[OK] {len(supplier_pricing_data)} registros de precos criados")
        
        # Criar produtos
        print("\n📦 Criando produtos...")
        
        products_data = [
            {
                "sku": "PROD-001",
                "name": "Laptop Dell XPS",
                "description": "Laptop profissional com processador Intel i7",
                "price": 4999.99,
                "cost": 3000.00,
                "quantity": 50,
                "category": "Eletrônicos",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-002",
                "name": "Monitor LG 27 polegadas",
                "description": "Monitor 4K com HDR",
                "price": 1299.99,
                "cost": 700.00,
                "quantity": 100,
                "category": "Eletrônicos",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-003",
                "name": "Teclado Mecânico RGB",
                "description": "Teclado RGB com switches mecânicos",
                "price": 349.99,
                "cost": 150.00,
                "quantity": 200,
                "category": "Periféricos",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-004",
                "name": "Mouse Logitech MX Master",
                "description": "Mouse profissional wireless",
                "price": 249.99,
                "cost": 100.00,
                "quantity": 150,
                "category": "Periféricos",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-005",
                "name": "Webcam HD 1080p",
                "description": "Câmera com microfone estéreo",
                "price": 199.99,
                "cost": 80.00,
                "quantity": 5,
                "category": "Periféricos",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-006",
                "name": "SSD Samsung 1TB",
                "description": "Unidade SSD NVMe high-speed",
                "price": 599.99,
                "cost": 350.00,
                "quantity": 30,
                "category": "Armazenamento",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-007",
                "name": "HD Externo 2TB",
                "description": "Disco rígido portátil",
                "price": 399.99,
                "cost": 200.00,
                "quantity": 75,
                "category": "Armazenamento",
                "is_active": True,
                "created_by_id": admin_user.id
            },
            {
                "sku": "PROD-008",
                "name": "Hub USB-C 7 em 1",
                "description": "Adaptador multipurpose",
                "price": 129.99,
                "cost": 50.00,
                "quantity": 8,
                "category": "Acessórios",
                "is_active": True,
                "created_by_id": admin_user.id
            },
        ]
        
        for product_data in products_data:
            product = Product(**product_data)
            db.add(product)
        
        db.commit()
        print(f"[OK] {len(products_data)} produtos criados")
        
        print("\n" + "="*50)
        print("[SUCCESS] Banco resetado e repopulado!")
        print("="*50)
        print("\n[CREDENTIALS] Credenciais de teste:")
        print("   Admin:  admin@example.com / AdminPass123")
        print("   User:   user@example.com / UserPass123")
        print("   Viewer: viewer@example.com / ViewerPass123")
        
    except Exception as e:
        print(f"[ERROR] Erro ao resetar banco: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    reset_database()
