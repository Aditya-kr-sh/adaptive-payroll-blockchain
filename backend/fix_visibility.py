import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def fix_employee_visibility():
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

    # Ensure all employees for this domain are 'Active'
    cursor.execute(
        "UPDATE employees SET status = 'Active' WHERE org_domain = %s",
        (domain,)
    )
    
    conn.commit()
    count = cursor.rowcount
    print(f"Successfully activated and synced {count} employees for visibility.")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    fix_employee_visibility()
