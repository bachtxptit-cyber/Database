#!/usr/bin/env python
import os
import sqlite3

# Xóa database cũ
db_path = 'fashion_store_v2_fixed.db'
if os.path.exists(db_path):
    os.remove(db_path)
    print(f"✓ Deleted {db_path}")

if os.path.exists(f'{db_path}-journal'):
    os.remove(f'{db_path}-journal')
    print(f"✓ Deleted {db_path}-journal")

# Test database initialization
try:
    from database import init_db
    print("\n🔄 Initializing database...")
    init_db()
    print("✅ Database initialization successful!")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
