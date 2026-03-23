import sqlite3
import os

# Deletar banco
db_path = 'erp_system.db'
if os.path.exists(db_path):
    os.remove(db_path)
    print("✓ Old database deleted")

# IMPORTAR MODELOS PRIMEIRO (importante!)
from app.models.models import User, Client, Product, Supplier, SupplierPricing, StockMovement, Order, OrderItem, SupplyHistory, StockAlert, AuditLog

# Recriar com SQLAlchemy
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)
print("✓ Schema created")

# Verificar
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(stock_movements);")
cols = cursor.fetchall()
print(f"\nColumns in stock_movements ({len(cols)} total):")
for col in cols:
    print(f"  {col[1]} ({col[2]})")
conn.close()
