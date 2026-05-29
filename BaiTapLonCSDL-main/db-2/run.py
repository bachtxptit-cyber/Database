#!/usr/bin/env python3
"""
Startup script for Fashion Store application
Kiểm tra và khởi tạo mọi thứ trước khi chạy app
"""
import os
import sys
import subprocess
import site

if site.ENABLE_USER_SITE:
    site.addsitedir(site.getusersitepackages())


def main():
    print("=" * 60)
    print("🏪 LUXE Fashion Store - Startup Script")
    print("=" * 60)
    
    # 1. Check Python version
    print("\n1️⃣  Checking Python version...")
    py_version = sys.version_info
    print(f"   Python {py_version.major}.{py_version.minor}.{py_version.micro}")
    
    # 2. Check if dependencies are installed
    print("\n2️⃣  Checking dependencies...")
    try:
        import flask
        print("   ✅ Flask installed")
    except ImportError:
        print("   ❌ Flask not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("   ✅ Dependencies installed")
    
    try:
        import flask_cors
        print("   ✅ Flask-CORS installed")
    except ImportError:
        print("   ❌ Flask-CORS not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Flask-CORS"])
    
    # 3. Initialize database
    print("\n3️⃣  Initializing database...")
    try:
        from database import init_db
        init_db()
        print("   ✅ Database ready")
    except Exception as e:
        print(f"   ❌ Database error: {e}")
        sys.exit(1)
    
    # 4. Start Flask app
    print("\n4️⃣  Starting Flask application...")
    print("=" * 60)
    print("\n🚀 Server running at http://localhost:5000")
    print("   Press CTRL+C to stop\n")
    print("=" * 60 + "\n")
    
    try:
        from app import app
        app.run(debug=True, port=5000, use_reloader=False)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
