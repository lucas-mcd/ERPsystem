#!/usr/bin/env python3
import requests
import json

# Token do login
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc3MDk0NDQyNn0.pQc9hVTf1zdEeF3UcM0QxkwsdL9ke8aFLMSRBd5qlpU"

# Headers
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Dados do novo produto
data = {
    "product_name": "Samsung New Product",
    "supplier_id": 32,
    "quantity": 5,
    "cost_price": 100.0,
    "sale_price": 200.0,
    "transportation_cost": 10.0,
    "icms_rate": 18.0,
    "ipi_rate": 0,
    "cofins_rate": 0,
    "pis_rate": 0,
    "other_taxes": 0,
    "currency": "BRL",
    "reason": "compra",
    "notes": "Test"
}

# URL
url = "http://localhost:8000/api/v1/stock/entry-with-financial"

print(f"POST to {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"\nStatus: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
