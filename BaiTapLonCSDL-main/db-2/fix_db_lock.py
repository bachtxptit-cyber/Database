#!/usr/bin/env python3
"""Fix database locked error by removing lock files and reinitializing"""
import os
import sqlite3
import glob

db_dir = r"C:\Users\Admin\Desktop\db-2"
db_files = glob.glob(os.path.join(db_dir, "fashion_store*.db*"))

print("🔍 Found database files:")
for f in sorted(db_files):
    print(f"  {os.path.basename(f)}")

# Remove lock/journal files
lock_patterns = [
    os.path.join(db_dir, "*.db-journal"),
    os.path.join(db_dir, "*.db-wal"),
    os.path.join(db_dir, "*.db-shm"),
]

print("\n🧹 Removing lock files...")
for pattern in lock_patterns:
    for f in glob.glob(pattern):
        try:
            os.remove(f)
            print(f"  ✓ Removed {os.path.basename(f)}")
        except Exception as e:
            print(f"  ✗ Failed to remove {os.path.basename(f)}: {e}")

# Test database connection
db_path = os.path.join(db_dir, "fashion_store_v2_fixed.db")
print(f"\n✓ Testing database: {os.path.basename(db_path)}")
try:
    # Try basic pragma without WAL first
    conn = sqlite3.connect(db_path, timeout=10, check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 10000")
    # Test if table exists
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
    result = cursor.fetchone()
    if result:
        print(f"  ✓ Database is accessible, tables exist")
    else:
        print(f"  ⚠ Database exists but is empty")
    conn.close()
    print("\n✅ Database lock fixed! You can now run the app.")
except Exception as e:
    print(f"  ✗ Error: {e}")
    print("\n❌ Database is still locked. Try:")
    print("  1. Close any other Python processes")
    print("  2. Restart your terminal")
    print("  3. Delete fashion_store_v2_fixed.db and rebuild")
