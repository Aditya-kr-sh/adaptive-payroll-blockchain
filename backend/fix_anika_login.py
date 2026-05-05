from models.db import get_db_connection
from extensions import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Get Anika's details
    cursor.execute("SELECT employee_id, email FROM employees WHERE name LIKE 'Anika%'")
    emp = cursor.fetchone()
    
    if emp:
        email = emp['email']
        # Default PIN formula: FirstName + ID -> Anika5
        # However, the user is expecting a password. Let's use the standard 'admin123' hash for her PIN/Password
        # hash for 'Anika5'
        password_to_hash = f"Anika{emp['employee_id']}"
        hashed_password = bcrypt.generate_password_hash(password_to_hash).decode('utf-8')
        
        # 2. Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            print("User already exists. Updating password...")
            cursor.execute("UPDATE users SET password = %s WHERE email = %s", (hashed_password, email))
        else:
            print(f"Creating user account for {email}...")
            cursor.execute(
                "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
                (email, hashed_password, 'Employee', 'adaptivepay.com')
            )
        
        conn.commit()
        print(f"SUCCESS! Anika can now log in.")
        print(f"EMAIL: {email}")
        print(f"NEW PIN: {password_to_hash}")
    else:
        print("Anika not found in employees table.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
