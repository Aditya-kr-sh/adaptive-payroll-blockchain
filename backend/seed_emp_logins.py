import mysql.connector
import os
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt

load_dotenv()
bcrypt = Bcrypt()

def seed_employee_logins():
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

    # Employee Logins to create
    logins = [
        ('vivaan.patel@adaptivepay.com', 'vivaan007'),
        ('aarav.sharma@adaptivepay.com', 'aarav123'),
        ('anika.joshi@adaptivepay.com', 'anika123')
    ]

    for email, pin in logins:
        hashed_pin = bcrypt.generate_password_hash(pin).decode('utf-8')
        
        # Ensure they exist in users table as 'Employee'
        cursor.execute("DELETE FROM users WHERE email = %s", (email,))
        cursor.execute(
            "INSERT INTO users (email, password, role, org_domain) VALUES (%s, %s, %s, %s)",
            (email, hashed_pin, 'Employee', domain)
        )

    conn.commit()
    print("Successfully activated logins for sample employees.")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    seed_employee_logins()
