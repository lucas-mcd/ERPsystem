#!/usr/bin/env python3
"""
Teste da API de RH & Folha de Pagamento
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

# Credenciais de teste
LOGIN_EMAIL = "admin@example.com"
LOGIN_PASSWORD = "AdminPass123"

def login():
    """Faz login e retorna o token"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"❌ Erro ao fazer login: {response.status_code}")
        print(response.text)
        return None

def test_employee_crud(token):
    """Testa CRUD de funcionários"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n" + "="*50)
    print("🧑 TESTANDO CRUD DE FUNCIONÁRIOS")
    print("="*50)
    
    # 1. Criar funcionário
    print("\n1️⃣ Criando novo funcionário...")
    employee_data = {
        "full_name": "João Silva Santos",
        "email": "joao.silva@empresa.com",
        "phone": "(11) 99999-8888",
        "cpf": "12345678901",
        "position": "Software Engineer",
        "department": "TI",
        "hire_date": "2024-01-15",
        "salary": 5000.00,
        "contract_type": "CLT"
    }
    
    response = requests.post(
        f"{BASE_URL}/hr/employees",
        json=employee_data,
        headers=headers
    )
    
    if response.status_code == 201:
        employee = response.json()
        employee_id = employee["id"]
        print(f"✅ Funcionário criado com sucesso! ID: {employee_id}")
        print(f"   Nome: {employee['full_name']}")
        print(f"   Email: {employee['email']}")
        print(f"   Cargo: {employee['position']}")
        print(f"   Salário: R$ {employee['salary']:.2f}")
    else:
        print(f"❌ Erro ao criar funcionário: {response.status_code}")
        print(response.text)
        return None
    
    # 2. Listar funcionários
    print("\n2️⃣ Listando funcionários...")
    response = requests.get(
        f"{BASE_URL}/hr/employees",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total de funcionários: {len(data['items'])}")
        for emp in data["items"][:3]:
            print(f"   - {emp['full_name']} ({emp['position']})")
    else:
        print(f"❌ Erro ao listar: {response.status_code}")
    
    # 3. Atualizar funcionário
    print(f"\n3️⃣ Atualizando funcionário {employee_id}...")
    update_data = {"salary": 5500.00, "position": "Senior Software Engineer"}
    response = requests.put(
        f"{BASE_URL}/hr/employees/{employee_id}",
        json=update_data,
        headers=headers
    )
    
    if response.status_code == 200:
        print(f"✅ Funcionário atualizado!")
        print(f"   Novo salário: R$ {response.json()['salary']:.2f}")
        print(f"   Novo cargo: {response.json()['position']}")
    else:
        print(f"❌ Erro ao atualizar: {response.status_code}")
    
    # 4. Buscar detalhes
    print(f"\n4️⃣ Buscando detalhes do funcionário {employee_id}...")
    response = requests.get(
        f"{BASE_URL}/hr/employees/{employee_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        emp = response.json()
        print(f"✅ Detalhes obtidos:")
        print(f"   Nome: {emp['full_name']}")
        print(f"   Email: {emp['email']}")
        print(f"   Departamento: {emp['department']}")
        print(f"   Data de contratação: {emp['hire_date']}")
    else:
        print(f"❌ Erro ao buscar: {response.status_code}")
    
    return employee_id

def test_payroll(token, employee_id):
    """Testa operações de folha de pagamento"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n" + "="*50)
    print("💰 TESTANDO FOLHA DE PAGAMENTO")
    print("="*50)
    
    month = datetime.now().strftime("%Y-%m")
    
    # 1. Criar folha de pagamento
    print(f"\n1️⃣ Criando folha de pagamento para {month}...")
    payroll_data = {
        "employee_id": employee_id,
        "month": month,
        "base_salary": 5500.00,
        "bonus": 500.00,
        "inss_contribution": 440.00,
        "irpf": 550.00,
        "vale_transporte": 150.00,
        "vale_alimentacao": 500.00,
        "other_deductions": 0.00
    }
    
    response = requests.post(
        f"{BASE_URL}/hr/payroll",
        json=payroll_data,
        headers=headers
    )
    
    if response.status_code == 201:
        payroll = response.json()
        payroll_id = payroll["id"]
        print(f"✅ Folha criada! ID: {payroll_id}")
        print(f"   Salário Bruto: R$ {payroll['gross_salary']:.2f}")
        print(f"   Descontos: R$ {payroll.get('deductions', 0):.2f}")
        print(f"   Salário Líquido: R$ {payroll['net_salary']:.2f}")
        print(f"   Status: {payroll['status']}")
    else:
        print(f"❌ Erro ao criar folha: {response.status_code}")
        print(response.text)
        return
    
    # 2. Listar folhas do mês
    print(f"\n2️⃣ Listando folhas de {month}...")
    response = requests.get(
        f"{BASE_URL}/hr/payroll?month={month}",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Total de folhas: {len(data['items'])}")
        for pr in data["items"]:
            print(f"   - Funcionário ID {pr['employee_id']}: R$ {pr['net_salary']:.2f} (Status: {pr['status']})")
    else:
        print(f"❌ Erro ao listar: {response.status_code}")
    
    # 3. Buscar análise mensal
    print(f"\n3️⃣ Buscando análise mensal de {month}...")
    response = requests.get(
        f"{BASE_URL}/hr/payroll/analytics/monthly?month={month}",
        headers=headers
    )
    
    if response.status_code == 200:
        analytics = response.json()
        print(f"✅ Análise do mês:")
        print(f"   Total de funcionários: {analytics.get('total_employees', 0)}")
        print(f"   Total Bruto: R$ {analytics.get('total_gross', 0):.2f}")
        print(f"   Total Descontos: R$ {analytics.get('total_deductions', 0):.2f}")
        print(f"   Total Líquido: R$ {analytics.get('total_net', 0):.2f}")
        print(f"   Salário Médio: R$ {analytics.get('average_salary', 0):.2f}")
        print(f"   Folhas Processadas: {analytics.get('processed_count', 0)}")
        print(f"   Folhas Pagas: {analytics.get('paid_count', 0)}")
    else:
        print(f"❌ Erro ao buscar análise: {response.status_code}")

def main():
    """Função principal"""
    print("\n🚀 INICIANDO TESTES DA API DE RH\n")
    
    # Login
    print("📝 Fazendo login...")
    token = login()
    if not token:
        return
    
    print(f"✅ Login realizado! Token obtido")
    
    # Testar CRUD de funcionários
    employee_id = test_employee_crud(token)
    if employee_id:
        # Testar folha de pagamento
        test_payroll(token, employee_id)
    
    print("\n" + "="*50)
    print("✅ TESTES CONCLUÍDOS!")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
