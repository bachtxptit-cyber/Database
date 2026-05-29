#!/usr/bin/env python3
"""
Syntax checker for all Python files
Kiểm tra lỗi cú pháp trong tất cả các file Python
"""
import os
import py_compile
import sys

def check_syntax(filepath):
    """Check if a Python file has valid syntax"""
    try:
        py_compile.compile(filepath, doraise=True)
        return True, None
    except py_compile.PyCompileError as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("🔍 Python Syntax Checker")
    print("=" * 60 + "\n")
    
    python_files = [
        'app.py',
        'database.py',
        'products.py',
        'warehouse.py',
        'customer.py',
        'employee.py',
        'supliers.py',
        'import_good.py',
        'sales.py',
        'promotion.py',
        'payment.py',
        'dasrboard.py',
        'run.py'
    ]
    
    errors_found = False
    
    for filepath in python_files:
        if not os.path.exists(filepath):
            print(f"⚠️  {filepath:30} - FILE NOT FOUND")
            continue
            
        is_valid, error = check_syntax(filepath)
        if is_valid:
            print(f"✅ {filepath:30} - OK")
        else:
            print(f"❌ {filepath:30} - SYNTAX ERROR")
            print(f"   {error}\n")
            errors_found = True
    
    print("\n" + "=" * 60)
    if not errors_found:
        print("✅ All files have valid Python syntax!")
        print("\n🚀 Ready to run: python run.py")
    else:
        print("❌ Fix the syntax errors above before running the app")
        sys.exit(1)
    print("=" * 60)

if __name__ == '__main__':
    main()
