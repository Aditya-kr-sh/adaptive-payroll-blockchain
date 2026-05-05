from models.db import get_db_connection
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Check if Anika exists and find her ID
    cursor.execute("SELECT employee_id, name, email FROM employees WHERE name LIKE 'Anika%'")
    employee = cursor.fetchone()
    
    if employee:
        print(f"FOUND EMPLOYEE: {employee['name']}")
        print(f"ID: {employee['employee_id']}")
        print(f"EMAIL: {employee['email']}")
        
        # Check if a user account exists for this email
        cursor.execute("SELECT role FROM users WHERE email = %s", (employee['email'],))
        user = cursor.fetchone()
        if user:
            print(f"USER ACCOUNT EXISTS. ROLE: {user['role']}")
        else:
            print("WARNING: NO USER ACCOUNT FOUND. You must register her as an admin first.")
    else:
        print("NO EMPLOYEE FOUND with the name starting with Anika.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
