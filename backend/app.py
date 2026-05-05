from flask import Flask
from routes.employee_routes import employee_bp
from routes.payroll_routes import payroll_bp
from routes.blockchain_routes import blockchain_bp
from routes.attendance_routes import attendance_bp
from routes.leaves_routes import leaves_bp
from routes.analytics_routes import analytics_bp
from routes.tax_routes import tax_bp
from flask_cors import CORS
from extensions import bcrypt, jwt
import os

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'adaptive-payroll-super-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400 # 24 hours in seconds
bcrypt.init_app(app)
jwt.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register Blueprints
app.register_blueprint(employee_bp, url_prefix='/api/employees')
app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(leaves_bp, url_prefix='/api/leaves')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(tax_bp, url_prefix='/api/tax')
from routes.auth_routes import auth_bp
app.register_blueprint(auth_bp, url_prefix='/api/auth')

@app.route('/api/health', methods=['GET'])
def health():
    return {"status": "ok", "message": "AdaptivePay API is running"}

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, port=port, host='0.0.0.0')
