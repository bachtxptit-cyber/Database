from flask import Flask
from flask_cors import CORS
import os

from products import products_bp
from warehouse import warehouse_bp
from customer import customers_bp
from employee import employees_bp
from supliers import suppliers_bp
from import_good import import_bp
from sales import sales_bp
from promotion import promotions_bp
from payment import payments_bp
from dasrboard import dashboard_bp
from database import init_db

app = Flask(__name__, 
            static_url_path='/static',
            static_folder='frontend',
            template_folder='frontend')

app.config['SECRET_KEY'] = 'fashion_store_secret_2024'
CORS(app)

# Register blueprints
app.register_blueprint(products_bp, url_prefix='/api/products')
app.register_blueprint(warehouse_bp, url_prefix='/api/warehouse')
app.register_blueprint(customers_bp, url_prefix='/api/customers')
app.register_blueprint(employees_bp, url_prefix='/api/employees')
app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
app.register_blueprint(import_bp, url_prefix='/api/imports')
app.register_blueprint(sales_bp, url_prefix='/api/sales')
app.register_blueprint(promotions_bp, url_prefix='/api/promotions')
app.register_blueprint(payments_bp, url_prefix='/api/payments')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

from flask import send_from_directory, render_template

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:path>')
def catch_all(path):
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    print("🚀 Fashion Store Server running at http://localhost:5000")
    app.run(debug=True, port=5000)