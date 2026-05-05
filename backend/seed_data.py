import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def push_sample_data():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME", "defaultdb"),
        port=int(os.getenv("DB_PORT", 3306)),
        ssl_disabled=False
    )
    cursor = conn.cursor()

    # Domain for sample data
    domain = 'adaptivepay.com'

    # 1. Clear existing sample employees to avoid duplicates
    cursor.execute("DELETE FROM employees WHERE org_domain = %s", (domain,))

    # 2. Insert Sample Employees
    employees = [
        ('Aarav Sharma', 'aarav.sharma@adaptivepay.com', 'Engineering', 'Senior Developer', 950000, domain),
        ('Vivaan Patel', 'vivaan.patel@adaptivepay.com', 'Engineering', 'Backend Engineer', 800000, domain),
        ('Priya Singh', 'priya.singh@adaptivepay.com', 'HR', 'HR Manager', 700000, domain),
        ('Aditya Gupta', 'aditya.gupta@adaptivepay.com', 'Finance', 'Financial Analyst', 750000, domain),
        ('Anika Joshi', 'anika.joshi@adaptivepay.com', 'Marketing', 'Marketing Lead', 720000, domain)
    ]
    
    cursor.executemany(
        "INSERT INTO employees (name, email, department, role, base_salary, org_domain, joining_date) VALUES (%s, %s, %s, %s, %s, %s, '2023-01-01')",
        employees
    )
    
    conn.commit()
    print(f"Successfully pushed {len(employees)} sample employees to {domain}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    push_sample_data()
