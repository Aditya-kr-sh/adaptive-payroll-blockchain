from flask import Blueprint, request, jsonify, send_file
from services.payroll_engine import generate_payroll
from services.payslip_service import generate_payslip_pdf
from blockchain.audit_chain import audit_chain
from models.db import get_db_connection
from utils.auth_utils import get_request_domain, role_required
from flask_jwt_extended import get_jwt
import io
import mysql.connector

payroll_bp = Blueprint('payroll_bp', __name__)

@payroll_bp.route('/generate', methods=['POST'])
@role_required(['HR', 'Admin'])
def generate():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    employee_id = data.get('employee_id')
    month = data.get('month')
    overtime = float(data.get('overtime', 0))
    bonus = float(data.get('bonus', 0))

    payroll_data = generate_payroll(employee_id, month, domain, overtime, bonus)

    if "error" in payroll_data:
        return jsonify(payroll_data), 400

    # Removed audit_chain.add_block from here per prompt rule:
    # "Block should be added ONLY when payroll status == 'Final Approved'"

    return jsonify({"message": "Payroll generated successfully", "data": payroll_data}), 201

@payroll_bp.route('/history', methods=['GET'])
@role_required(['Manager', 'HR', 'Admin', 'Employee'])
def history():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    claims = get_jwt()
    user_role = claims.get('role')
    user_emp_id = claims.get('employee_id')

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        emp_id = request.args.get('employee_id')

        # Security: Employees can only see their own payroll history
        if user_role == 'Employee':
            emp_id = user_emp_id

        query = """
            SELECT p.*, e.name as employee_name, e.department
            FROM payroll p 
            JOIN employees e ON p.employee_id = e.employee_id
            WHERE p.org_domain = %s
        """
        params = [domain]
        if emp_id:
            query += " AND p.employee_id = %s"
            params.append(emp_id)
        query += " ORDER BY p.payroll_id DESC"
        cursor.execute(query, params)
        records = cursor.fetchall()
        return jsonify(records), 200
    finally:
        conn.close()

@payroll_bp.route('/<int:payroll_id>/approve', methods=['PUT'])
@role_required(['Manager', 'HR', 'Admin'])
def approve_payroll(payroll_id):
    claims = get_jwt()
    domain = claims.get('org_domain', get_request_domain())
    user_role = claims.get('role')
    user_email = claims.get('sub', '')
    
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        # Check current status
        cursor.execute("SELECT * FROM payroll WHERE payroll_id=%s AND org_domain=%s", (payroll_id, domain))
        payroll = cursor.fetchone()
        
        if not payroll:
            return jsonify({"error": "Payroll not found"}), 404
            
        current_status = payroll['status']
        new_status = current_status
        
        # Enforce multi-level logic
        if user_role == 'Manager':
            if current_status != 'Pending':
                return jsonify({"error": f"Manager can only approve Pending payrolls, current is {current_status}"}), 403
            new_status = 'Manager Approved'
        elif user_role == 'HR':
            if current_status != 'Manager Approved':
                return jsonify({"error": f"HR can only approve Manager Approved payrolls, current is {current_status}"}), 403
            new_status = 'HR Approved'
        elif user_role == 'Admin':
            if current_status != 'HR Approved':
                return jsonify({"error": f"Admin can only approve HR Approved payrolls, current is {current_status}"}), 403
            new_status = 'Final Approved'
        else:
            return jsonify({"error": "Unauthorized role for approval"}), 403
            
        # Append to approved_by
        approved_by = payroll.get('approved_by') or ''
        approved_by += f"[{user_role}:{user_email}] "

        cursor.execute(
            "UPDATE payroll SET status=%s, approved_by=%s WHERE payroll_id=%s", 
            (new_status, approved_by, payroll_id)
        )
        conn.commit()
        
        # Blockchain storage strictly on Final Approved
        if new_status == 'Final Approved':
            # Block contains: employee_id, salary, month, timestamp, previous_hash, hash
            audit_chain.add_block(data={
                "employee_id": payroll['employee_id'],
                "salary": float(payroll['net_salary']),
                "month": payroll['month_year'],
                "org_domain": domain
            })
            # Optionally update status again just to reflect stored status 
            cursor.execute("UPDATE payroll SET status='Stored in Blockchain' WHERE payroll_id=%s", (payroll_id,))
            conn.commit()
            new_status = 'Stored in Blockchain'
            
        return jsonify({"message": f"Payroll validated. New status: {new_status}"}), 200
    finally:
        conn.close()

@payroll_bp.route('/payslip/<int:payroll_id>', methods=['GET'])
def get_payslip(payroll_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, e.name as employee_name, e.email, e.department, e.role, e.phone
            FROM payroll p JOIN employees e ON p.employee_id = e.employee_id
            WHERE p.payroll_id = %s AND p.org_domain = %s
        """, (payroll_id, domain))
        record = cursor.fetchone()
        if not record:
            return jsonify({"error": "Payroll record not found in your organization"}), 404
        return jsonify(record), 200
    finally:
        conn.close()

@payroll_bp.route('/payslip/<int:payroll_id>/download', methods=['GET'])
def download_payslip(payroll_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, e.name as employee_name, e.email, e.department, e.role, e.phone, b.hash
            FROM payroll p 
            JOIN employees e ON p.employee_id = e.employee_id
            LEFT JOIN blockchain_blocks b ON p.employee_id = b.employee_id AND p.month_year = b.month
            WHERE p.payroll_id = %s AND p.org_domain = %s
        """, (payroll_id, domain))
        record = cursor.fetchone()
        if not record:
            return jsonify({"error": "Payroll record not found"}), 404

        pdf_buffer = generate_payslip_pdf(record)
        audit_chain.add_block(data={
            "action": "PAYSLIP_DOWNLOADED",
            "payroll_id": payroll_id,
            "employee_id": record['employee_id'],
            "month": record['month_year'],
            "org_domain": domain
        })

        return send_file(
            io.BytesIO(pdf_buffer),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f"payslip_{record['employee_name'].replace(' ', '_')}_{record['month_year']}.pdf"
        )
    finally:
        conn.close()
