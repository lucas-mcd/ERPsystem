import sqlite3

conn = sqlite3.connect('erp_system.db')
cursor = conn.cursor()

# Listar todas as tabelas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables in database:")
for table in tables:
    print(f"  {table[0]}")

# Verificar stock_movements
if ('stock_movements',) in tables:
    cursor.execute("PRAGMA table_info(stock_movements);")
    cols = cursor.fetchall()
    print(f"\nstock_movements columns ({len(cols)} total):")
    for col in cols:
        print(f"  {col[1]}")
else:
    print("\nstock_movements table NOT FOUND!")

conn.close()
