import mysql.connector
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt

load_dotenv()
bcrypt = Bcrypt()

def seed_management_accounts():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "defaultdb"),
        port=int(os.getenv("DB_PORT", 17104)),
        ssl_disabled=False
    )
    cursor = conn.cursor()
    domain = 'adaptivepay.com'

    # 1. Accounts to create
    accounts = [
        ('HR Manager', 'hr@adaptivepay.com', 'hr123', 'HR'),
        ('Dept Manager', 'manager@adaptivepay.com', 'manager123', 'Manager')
    ]

    for name, email, pwd, role in accounts:
        hashed_pwd = bcrypt.generate_password_hash(pwd).decode('utf-8')
        
        # Add to users table for login
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        cursor.execute(
            "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
            (email, hashed_pwd, role, domain)
        )
        
        # Add to employees table for registry
        cursor.execute("DELETE FROM employees WHERE email = %s", (email,))
        cursor.execute(
            "INSERT INTO employees (name, email, department, role, base_salary, org_domain, joining_date) VALUES (%s, %s, %s, %s, %s, %s, '2023-01-01')",
            (name, email, role, role, 850000 if role == 'Manager' else 750000, domain)
        )

    conn.commit()
    print("Successfully synchronized HR and Manager accounts in both Users and Employees tables.")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    seed_management_accounts()
