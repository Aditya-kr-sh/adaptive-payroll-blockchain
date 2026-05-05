from models.db import get_db_connection
from extensions import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Get all employees
    cursor.execute("SELECT employee_id, name, email, org_domain FROM employees")
    employees = cursor.fetchall()
    
    print(f"Syncing {len(employees)} employee accounts...")
    
    for emp in employees:
        email = emp['email']
        first_name = emp['name'].split(' ')[0]
        pin = f"{first_name}{emp['employee_id']}"
        hashed_password = bcrypt.generate_password_hash(pin).decode('utf-8')
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"Creating account for {emp['name']} (PIN: {pin})")
            cursor.execute(
                "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
                (email, hashed_password, 'Employee', emp['org_domain'])
            )
        else:
            # Update PIN to match the formula if they already exist
            cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed_password, email))
            print(f"Updated account for {emp['name']} (PIN: {pin})")
            
    conn.commit()
    print("\n✅ ALL EMPLOYEE ACCOUNTS ARE NOW LIVE!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
