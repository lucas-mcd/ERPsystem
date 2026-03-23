"""
Script para inicializar banco de dados

IMPORTANTISSIMO:
- Cria as TABELAS (schema do banco)
- Popula com dados INICIAIS apenas na PRIMEIRA execução
- NAO deleta dados existentes (é para ser permanente!)

Se quiser RESETAR tudo, use: python reset_db.py
"""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import SessionLocal, init_db, engine, Base
from app.models.models import User, Client, Product, Supplier, SupplierPricing, UserRole, SupplierStatus, SupplierType, BusinessSegment, Employee, Payroll
from app.core.security import security_service
from app.services.financial_service import FinancialCalculator

def init_test_data():
    """Inicializa dados de teste no banco (apenas se vazio)"""
    
    # Criar todas as tabelas (se não existirem)
    Base.metadata.create_all(bind=engine)
    print("[OK] Tabelas criadas/verificadas")
    
    db = SessionLocal()
    
    try:
        # VERIFICA se banco ja tem dados
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("[INFO] Banco ja tem dados, pulando populacao inicial")
            print(f"[INFO] Usuarios: {existing_users}")
            return
        
        print("[NOVO] Banco vazio, criando dados iniciais...")
        
        # Criar usuários
        print("\n[USERS] Criando usuarios...")
        
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
                "phone": "+55 85 97777-6666",
                "address": "Avenida Beira Mar, 2000",
                "city": "Fortaleza",
                "state": "CE",
                "postal_code": "60000-000",
                "country": "Brazil",
                "tax_id": "55.555.555/0001-11",
                "created_by_id": admin_user.id
            },
        ]
        
        for client_data in clients_data:
            client = Client(**client_data)
            db.add(client)
        
        db.commit()
        print(f"[OK] {len(clients_data)} clientes criados")
        
        # Criar fornecedores
        print("\n[SUPPLIERS] Criando fornecedores...")
        
        suppliers_data = [
            {
                "name": "Samsung Electronics",
                "email": "samsung@samsung.com",
                "phone": "+55 11 3050-5000",
                "contact_person": "João Silva",
                "address": "Avenida Presidente Juscelino Kubitschek, 500",
                "city": "São Paulo",
                "state": "SP",
                "postal_code": "04543-000",
                "country": "Brazil",
                "tax_id": "34.028.430/0001-85",
                "sla_days": 7,
                "status": "active",
                "supplier_type": "equipment",
                "business_segment": "technology",
                "is_active": True,
                "notes": "Principal fornecedor de componentes eletrônicos",
                "created_by_id": admin_user.id
            },
            {
                "name": "Logística Brasil S.A.",
                "email": "vendas@logisticabrasil.com.br",
                "phone": "+55 11 4743-1000",
                "contact_person": "Maria Santos",
                "address": "Avenida das Nações Unidas, 12000",
                "city": "São Paulo",
                "state": "SP",
                "postal_code": "04578-000",
                "country": "Brazil",
                "tax_id": "61.065.669/0001-22",
                "sla_days": 5,
                "status": "active",
                "supplier_type": "services",
                "business_segment": "logistics",
                "is_active": True,
                "notes": "Fornecedor de serviços logísticos e distribuição",
                "created_by_id": admin_user.id
            },
            {
                "name": "TechSupply Components",
                "email": "comercial@techsupply.com",
                "phone": "+55 21 2555-5555",
                "contact_person": "Carlos Oliveira",
                "address": "Rua da Computação, 100",
                "city": "Rio de Janeiro",
                "state": "RJ",
                "postal_code": "20000-000",
                "country": "Brazil",
                "tax_id": "11.111.111/0001-11",
                "sla_days": 10,
                "status": "active",
                "supplier_type": "components",
                "business_segment": "technology",
                "is_active": True,
                "notes": "Especializada em componentes de computador",
                "created_by_id": admin_user.id
            },
            {
                "name": "Matérias Primas Industrial",
                "email": "info@materiasbrfom.com.br",
                "phone": "+55 41 3322-2222",
                "contact_person": "Ana Costa",
                "address": "Avenida Industrial, 500",
                "city": "Curitiba",
                "state": "PR",
                "postal_code": "80000-000",
                "country": "Brazil",
                "tax_id": "22.222.222/0001-22",
                "sla_days": 14,
                "status": "active",
                "supplier_type": "raw_materials",
                "business_segment": "manufacturing",
                "is_active": True,
                "notes": "Fornecedor de matérias-primas para manufatura",
                "created_by_id": admin_user.id
            },
            {
                "name": "Serviços Técnicos Nacionais",
                "email": "suporte@stn.com.br",
                "phone": "+55 85 3333-3333",
                "contact_person": "Roberto Ferreira",
                "address": "Avenida Técnica, 1000",
                "city": "Fortaleza",
                "state": "CE",
                "postal_code": "60000-000",
                "country": "Brazil",
                "tax_id": "33.333.333/0001-33",
                "sla_days": 3,
                "status": "active",
                "supplier_type": "services",
                "business_segment": "consulting",
                "is_active": True,
                "notes": "Serviços de consultoria e suporte técnico",
                "created_by_id": admin_user.id
            },
        ]
        
        for supplier_data in suppliers_data:
            supplier = Supplier(**supplier_data)
            db.add(supplier)
        
        db.commit()
        print(f"[OK] {len(suppliers_data)} fornecedores criados")
        
        print("\n" + "="*50)
        print("[SUCCESS] Dados de teste inicializados com sucesso!")
        print("="*50)
        
        # Recuperar os fornecedores criados
        suppliers = db.query(Supplier).all()
        financial_calc = FinancialCalculator()
        
        # Dados de preço para cada fornecedor
        supplier_pricing_data = [
            # Samsung Electronics - Equipment
            {
                "supplier_id": suppliers[0].id,
                "product_name": "Laptops para Corporativo i7",
                "cost_price": 2500.00,
                "sale_price": 4500.00,
                "transportation_cost": 150.00,
                "icms_rate": 18.0,  # ICMS padrão
                "ipi_rate": 0.0,     # Sem IPI para eletrônicos processados
                "cofins_rate": 7.6,  # COFINS padrão
                "pis_rate": 1.65,    # PIS padrão
                "other_taxes": 0.0,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
            # Samsung Electronics - Second pricing (Monitor)
            {
                "supplier_id": suppliers[0].id,
                "product_name": "Monitores 4K 27 polegadas",
                "cost_price": 800.00,
                "sale_price": 1500.00,
                "transportation_cost": 50.00,
                "icms_rate": 18.0,
                "ipi_rate": 0.0,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 0.0,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
            # Logística Brasil - Services
            {
                "supplier_id": suppliers[1].id,
                "product_name": "Serviço de Transporte e Logística",
                "cost_price": 500.00,
                "sale_price": 850.00,
                "transportation_cost": 0.0,
                "icms_rate": 0.0,    # Sem ICMS em serviços
                "ipi_rate": 0.0,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 3.0,  # ISS - Imposto sobre Serviço
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
            # Tech Supply - Components
            {
                "supplier_id": suppliers[2].id,
                "product_name": "Componentes Eletrônicos (Resistor, Capacitor, etc)",
                "cost_price": 0.50,
                "sale_price": 1.25,
                "transportation_cost": 0.05,
                "icms_rate": 18.0,
                "ipi_rate": 5.0,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 0.0,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
            # Tech Supply - Second pricing (Chips)
            {
                "supplier_id": suppliers[2].id,
                "product_name": "Microchips e Processadores",
                "cost_price": 50.00,
                "sale_price": 125.00,
                "transportation_cost": 5.00,
                "icms_rate": 18.0,
                "ipi_rate": 10.0,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 0.0,
                "currency": "USD",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
            # Matérias Primas Brasil - Raw Materials
            {
                "supplier_id": suppliers[3].id,
                "product_name": "Matérias Primas (Aço, Alumínio)",
                "cost_price": 2000.00,
                "sale_price": 3200.00,
                "transportation_cost": 300.00,
                "icms_rate": 18.0,
                "ipi_rate": 0.0,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 0.0,
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
            # Serviços Técnicos - Consulting
            {
                "supplier_id": suppliers[4].id,
                "product_name": "Consultoria e Suporte Técnico",
                "cost_price": 300.00,
                "sale_price": 900.00,
                "transportation_cost": 0.0,
                "icms_rate": 0.0,
                "ipi_rate": 0.0,
                "cofins_rate": 7.6,
                "pis_rate": 1.65,
                "other_taxes": 5.0,  # ISS - 5% para consultoria
                "currency": "BRL",
                "effective_date": datetime.now(),
                "expiry_date": datetime.now() + timedelta(days=180)
            },
        ]
        
        # Criar registros de preços com cálculos financeiros automáticos
        for pricing_data in supplier_pricing_data:
            # Calcular valores financeiros
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
            
            # Criar registro de preço com valores calculados
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
        
        
        # Criar funcionários
        print("\n👥 Criando funcionários...")
        
        employees_data = [
            {
                "full_name": "João Silva",
                "email": "joao.silva@empresa.com",
                "phone": "+55 11 98765-4321",
                "cpf": "12345678901",
                "position": "Desenvolvedor Sênior",
                "department": "TI",
                "hire_date": datetime(2022, 1, 15),
                "salary": 8500.00,
                "contract_type": "CLT",
                "status": "ativo",
                "is_active": True
            },
            {
                "full_name": "Maria Santos",
                "email": "maria.santos@empresa.com",
                "phone": "+55 11 99999-8888",
                "cpf": "98765432109",
                "position": "Gerente de Projeto",
                "department": "TI",
                "hire_date": datetime(2021, 6, 20),
                "salary": 7200.00,
                "contract_type": "CLT",
                "status": "ativo",
                "is_active": True
            },
            {
                "full_name": "Carlos Oliveira",
                "email": "carlos.oliveira@empresa.com",
                "phone": "+55 11 97777-6666",
                "cpf": "11122233344",
                "position": "Vendedor",
                "department": "Vendas",
                "hire_date": datetime(2023, 3, 10),
                "salary": 4500.00,
                "contract_type": "CLT",
                "status": "ativo",
                "is_active": True
            },
            {
                "full_name": "Ana Costa",
                "email": "ana.costa@empresa.com",
                "phone": "+55 11 95555-4444",
                "cpf": "55566677788",
                "position": "Analista de RH",
                "department": "RH",
                "hire_date": datetime(2022, 9, 5),
                "salary": 5000.00,
                "contract_type": "CLT",
                "status": "ativo",
                "is_active": True
            },
        ]
        
        created_employees = []
        for employee_data in employees_data:
            employee = Employee(**employee_data)
            db.add(employee)
            db.flush()
            created_employees.append(employee)
        
        db.commit()
        print(f"[OK] {len(employees_data)} funcionários criados")
        
        
        # Criar folhas de pagamento para os funcionários
        print("\n💰 Criando folhas de pagamento...")
        current_month = datetime.now().strftime("%Y-%m")
        previous_month = (datetime.now() - timedelta(days=30)).strftime("%Y-%m")
        
        payrolls_data = []
        for employee in created_employees:
            # Folha do mês anterior
            inss = employee.salary * 0.08
            irpf = employee.salary * 0.075
            vale_transporte = 200.00
            vale_alimentacao = 500.00
            gross_salary = employee.salary + 500  # Com bônus
            deductions = inss + irpf + vale_transporte + vale_alimentacao
            net_salary = gross_salary - deductions
            
            payroll_prev = Payroll(
                employee_id=employee.id,
                month=previous_month,
                base_salary=employee.salary,
                bonus=500.00,
                gross_salary=gross_salary,
                deductions=deductions,
                inss_contribution=inss,
                irpf=irpf,
                vale_transporte=vale_transporte,
                vale_alimentacao=vale_alimentacao,
                other_deductions=0.0,
                net_salary=net_salary,
                status="pago",
                paid_date=datetime.now() - timedelta(days=20),
                notes=f"Folha de pagamento de {previous_month} - Processada"
            )
            payrolls_data.append(payroll_prev)
            
            # Folha do mês atual
            gross_salary = employee.salary
            deductions = inss + irpf + vale_transporte + vale_alimentacao
            net_salary = gross_salary - deductions
            
            payroll_current = Payroll(
                employee_id=employee.id,
                month=current_month,
                base_salary=employee.salary,
                bonus=0.0,
                gross_salary=gross_salary,
                deductions=deductions,
                inss_contribution=inss,
                irpf=irpf,
                vale_transporte=vale_transporte,
                vale_alimentacao=vale_alimentacao,
                other_deductions=0.0,
                net_salary=net_salary,
                status="processado",
                notes=f"Folha de pagamento de {current_month} - Pronta para pagamento"
            )
            payrolls_data.append(payroll_current)
        
        for payroll in payrolls_data:
            db.add(payroll)
        
        db.commit()
        print(f"[OK] {len(payrolls_data)} folhas de pagamento criadas")
        
        print("\n" + "="*50)
        print("[SUCCESS] Dados de teste inicializados com sucesso!")
        print("="*50)
        print("\n[CREDENTIALS] Credenciais de teste:")
        print("   Admin:  admin@example.com / AdminPass123")
        print("   User:   user@example.com / UserPass123")
        print("   Viewer: viewer@example.com / ViewerPass123")
        print("\n[RUN] Inicie a aplicacao com: python -m uvicorn app.main:app --reload")
        
    except Exception as e:
        print(f"[ERROR] Erro ao inicializar dados: {e}")
        print(f"[ERROR] Tipo: {type(e).__name__}")
        
        # Debug info
        import traceback
        print(f"\n[DEBUG] Traceback:")
        traceback.print_exc()
        
        # Tentar rollback
        try:
            db.rollback()
            print("[INFO] Rollback executado")
        except:
            pass
        
        # Tentar informar qual tabela causou o erro
        print("\n[INFO] Verifique:")
        print("  1. Se o banco de dados esta corrompido: rm backend/erp_system.db")
        print("  2. Se reencaminhe de migrations: rm -rf backend/migrations/versions/*")
        print("  3. Tente novamente: cd backend && python init_db.py")
        
        raise  # Re-lançar exception para que o setup script note o erro
    finally:
        db.close()


if __name__ == "__main__":
    init_test_data()
