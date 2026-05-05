import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'port': int(os.getenv('DB_PORT')),
    'ssl_disabled': False
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Inject Attendance for Vivaan (ID 8) for May 2026
    attendance_data = [
        (8, '2026-05-01', 'Present', 'adaptivepay.com'),
        (8, '2026-05-02', 'Present', 'adaptivepay.com'),
        (8, '2026-05-03', 'Absent', 'adaptivepay.com'),
        (8, '2026-05-04', 'Present', 'adaptivepay.com'),
        (8, '2026-05-05', 'Present', 'adaptivepay.com')
    ]
    
    cursor.executemany(
        "INSERT INTO attendance (employee_id, date, status, org_domain) VALUES (%s, %s, %s, %s) "
        "ON DUPLICATE KEY UPDATE status=VALUES(status)",
        attendance_data
    )
    
    # Inject a Leave Request for Vivaan
    cursor.execute(
        "INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, org_domain) "
        "VALUES (8, 1, '2026-05-10', '2026-05-12', 'Family function', 'Pending', 'adaptivepay.com')"
    )
    
    conn.commit()
    print("Successfully injected simulation data for employee 8.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
