import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration from .env
db_config = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "adaptive_payroll"),
    "port": int(os.getenv("DB_PORT", 3306))
}

# Create a connection pool
try:
    connection_pool = pooling.MySQLConnectionPool(
        pool_name="adaptive_pool",
        pool_size=20,
        pool_reset_session=True,
        **db_config
    )
    print("Database connection pool created successfully.")
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    connection_pool = None

def get_db_connection():
    """
    Returns a connection from the pool.
    """
    if connection_pool:
        return connection_pool.get_connection()
    else:
        # Fallback to direct connection if pool failed
        return mysql.connector.connect(**db_config)
