from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from utils.auth_utils import extract_domain
from extensions import bcrypt, jwt
from flask_jwt_extended import create_access_token
import mysql.connector

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def unified_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            # --- Just-in-Time Account Creation: Check if they are an employee ---
            cursor.execute("SELECT * FROM employees WHERE email = %s AND status = 'Active'", (email,))
            emp = cursor.fetchone()
            if emp:
                first_name = emp['name'].split(' ')[0]
                pin = f"{first_name}{emp['employee_id']}"
                # If the password matches the PIN formula, create the account on the fly
                if password == pin:
                    hashed_pwd = bcrypt.generate_password_hash(pin).decode('utf-8')
                    cursor.execute(
                        "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
                        (email, hashed_pwd, 'Employee', emp['org_domain'])
                    )
                    conn.commit()
                    # Re-fetch the newly created user
                    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                    user = cursor.fetchone()
                else:
                    return jsonify({"error": "Account not initialized. Use your default PIN (FirstName + ID)."}), 401
            else:
                return jsonify({"error": "Invalid credentials"}), 401

        if user and bcrypt.check_password_hash(user['password'], password):
            # If it's an employee, we need to find their actual employee_id from the employees table
            real_id = user['id']
            if user['role'] == 'Employee':
                cursor.execute("SELECT employee_id FROM employees WHERE email = %s", (user['email'],))
                emp_data = cursor.fetchone()
                if emp_data:
                    real_id = emp_data['employee_id']

            access_token = create_access_token(
                identity=user['email'],
                additional_claims={"role": user['role'], "org_domain": user['org_domain'], "user_id": user['id'], "employee_id": real_id}
            )
            return jsonify({
                "message": "Login successful",
                "access_token": access_token,
                "user": {
                    "id": real_id,
                    "email": user['email'],
                    "role": user['role'],
                    "org_domain": user['org_domain']
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'Employee')

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    org_domain = extract_domain(email) or 'adaptivepay.com'
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
            (email, hashed_password, role, org_domain)
        )
        conn.commit()
        return jsonify({"message": "User registered successfully", "org_domain": org_domain}), 201
    except Exception as e:
        print(f"REGISTRATION ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
