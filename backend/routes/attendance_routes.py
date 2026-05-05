from flask import Blueprint, request, jsonify
from models.db import get_db_connection
from models.db import get_db_connection
from utils.auth_utils import get_request_domain, role_required
from flask_jwt_extended import get_jwt
import mysql.connector

attendance_bp = Blueprint('attendance_bp', __name__)

@attendance_bp.route('', methods=['GET'], strict_slashes=False)
@role_required(['Manager', 'HR', 'Admin', 'Employee'])
def get_all_attendance():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    claims = get_jwt()
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        emp_id = request.args.get('employee_id')
        month = request.args.get('month')
        
        # Security: Employees can only see their own
        if claims.get('role') == 'Employee':
            emp_id = claims.get('employee_id')

        query = """
            SELECT a.*, e.name as employee_name 
            FROM attendance a JOIN employees e ON a.employee_id = e.employee_id
            WHERE a.org_domain = %s
        """
        params = [domain]
        
        if emp_id:
            query += " AND a.employee_id = %s"
            params.append(emp_id)
        if month:
            query += " AND DATE_FORMAT(a.date, '%Y-%m') = %s"
            params.append(month)
            
        query += " ORDER BY a.date DESC"
        cursor.execute(query, params)
        records = cursor.fetchall()
        return jsonify(records), 200
    finally:
        conn.close()

@attendance_bp.route('/mark', methods=['POST'])
def mark_attendance():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO attendance (employee_id, date, status, org_domain) VALUES (%s, %s, %s, %s)",
            (data['employee_id'], data['date'], data['status'], domain)
        )
        conn.commit()
        return jsonify({"message": "Attendance marked successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@attendance_bp.route('/bulk', methods=['POST'])
@role_required(['Manager', 'HR', 'Admin'])
def mark_bulk_attendance():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    data = request.json
    date = data.get('date')
    records = data.get('records', [])
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        success_count = 0
        errors = []
        
        for rec in records:
            try:
                cursor.execute(
                    "INSERT INTO attendance (employee_id, date, status, org_domain) VALUES (%s, %s, %s, %s) "
                    "ON DUPLICATE KEY UPDATE status=%s",
                    (rec['employee_id'], date, rec['status'], domain, rec['status'])
                )
                success_count += 1
            except Exception as e:
                errors.append(f"Error for emp {rec.get('employee_id')}: {str(e)}")
                
        conn.commit()
        if errors:
            return jsonify({
                "message": f"Bulk attendance processed with errors", 
                "saved": success_count,
                "errors": errors[:5]
            }), 207
            
        return jsonify({"message": f"Bulk attendance saved", "saved": success_count}), 200
    finally:
        conn.close()

@attendance_bp.route('/summary', methods=['GET'])
@role_required(['Manager', 'HR', 'Admin', 'Employee'])
def get_attendance_summary():
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    claims = get_jwt()
    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        month = request.args.get('month')
        emp_id = request.args.get('employee_id')

        # Security: Employees can only see their own
        if claims.get('role') == 'Employee':
            emp_id = claims.get('employee_id')

        query = """
            SELECT 
                e.employee_id, e.name, e.department,
                COALESCE(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END), 0) as present_days,
                COALESCE(SUM(CASE WHEN a.status='Absent' THEN 1 ELSE 0 END), 0) as absent_days,
                COALESCE(SUM(CASE WHEN a.status='Leave' THEN 1 ELSE 0 END), 0) as leave_days
            FROM employees e
            LEFT JOIN attendance a ON e.employee_id = a.employee_id AND a.org_domain = %s
        """
        params = [domain]
        if month:
            query += " AND DATE_FORMAT(a.date, '%Y-%m') = %s"
            params.append(month)
        
        query += " WHERE e.status = 'Active' AND e.org_domain = %s "
        params.append(domain)

        if emp_id:
            query += " AND e.employee_id = %s "
            params.append(emp_id)

        query += " GROUP BY e.employee_id, e.name, e.department"
        
        cursor.execute(query, params)
        summary = cursor.fetchall()
        return jsonify(summary), 200
    finally:
        conn.close()

@attendance_bp.route('/<int:employee_id>', methods=['GET'])
@role_required(['Manager', 'HR', 'Admin', 'Employee'])
def get_attendance_by_employee(employee_id):
    domain = get_request_domain()
    if not domain:
        return jsonify({"error": "Organization domain required"}), 400
        
    claims = get_jwt()
    if claims.get('role') == 'Employee' and claims.get('employee_id') != employee_id:
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_db_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM attendance WHERE employee_id = %s AND org_domain = %s ORDER BY date DESC", 
            (employee_id, domain)
        )
        records = cursor.fetchall()
        return jsonify(records), 200
    finally:
        conn.close()
