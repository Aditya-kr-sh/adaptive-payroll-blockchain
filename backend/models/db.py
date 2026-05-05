import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
try:
    raw_port = os.getenv("DB_PORT", "17104")
    db_port = int(raw_port)
except Exception:
    db_port = 17104

db_config = {
    "host": os.getenv("DB_HOST", "mysql-2e9703cd-adaptive-payroll-db.l.aivencloud.com"),
    "user": os.getenv("DB_USER", "avnadmin"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "defaultdb"),
    "port": db_port
}

print(f"[DB INFO] Attempting connection to {db_config['host']} on port {db_config['port']}")

# Create a connection pool
try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="adaptive_pool",
        pool_size=10,
        pool_reset_session=True,
        ssl_disabled=False,
        **db_config
    )
    print("✅ [DB SUCCESS] Connection pool created.")
except mysql.connector.Error as err:
    print(f"❌ [DB ERROR] Pool creation failed: {err}")
    connection_pool = None

def get_db_connection():
    if connection_pool:
        try:
            return connection_pool.get_connection()
        except mysql.connector.Error:
            print("⚠️ [DB WARNING] Pool exhausted, using direct connection.")
            return mysql.connector.connect(**db_config)
    else:
        return mysql.connector.connect(**db_config)
