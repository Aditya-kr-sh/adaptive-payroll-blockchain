
import hashlib
import json
from datetime import datetime
import threading
from models.db import get_db_connection

class Blockchain:
    def __init__(self):
        self.chain = []
        self.lock = threading.Lock()
        try:
            self._load_chain_from_db()
        except:
            pass # DB might not be ready yet during first import

    def _load_chain_from_db(self):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM blockchain_blocks ORDER BY block_index ASC")
        blocks = cursor.fetchall()
        if not blocks:
            self.create_genesis_block()
        else:
            self.chain = blocks
        conn.close()

    def create_genesis_block(self):
        genesis_block = {
            'block_index': 0,
            'timestamp': str(datetime.now()),
            'data': json.dumps({"message": "Genesis Block"}),
            'previous_hash': "0",
            'hash': self.hash_block(0, str(datetime.now()), '{"message": "Genesis Block"}', "0"),
            'org_domain': 'system'
        }
        self.save_block_to_db(genesis_block)
        self.chain.append(genesis_block)

    def get_latest_block(self):
        if not self.chain:
             self._load_chain_from_db()
        return self.chain[-1]

    def hash_block(self, index, timestamp, data, previous_hash):
        block_string = f"{index}{timestamp}{data}{previous_hash}".encode()
        return hashlib.sha256(block_string).hexdigest()

    def add_block(self, data):
        with self.lock:
            # Extract org_domain from data if present
            org_domain = data.get('org_domain', 'adaptivepay.com')
            
            latest = self.get_latest_block()
            index = latest['block_index'] + 1
            timestamp = str(datetime.now())
            data_str = json.dumps(data)
            previous_hash = latest['hash']
            hash_val = self.hash_block(index, timestamp, data_str, previous_hash)

            new_block = {
                'block_index': index,
                'timestamp': timestamp,
                'data': data_str,
                'previous_hash': previous_hash,
                'hash': hash_val,
                'org_domain': org_domain
            }
            self.save_block_to_db(new_block)
            self.chain.append(new_block)
            return new_block

    def save_block_to_db(self, block):
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO blockchain_blocks (block_index, timestamp, data, previous_hash, hash, org_domain) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (block['block_index'], block['timestamp'], block['data'], block['previous_hash'], block['hash'], block['org_domain'])
            )
            conn.commit()
        finally:
            conn.close()

# Singleton instance
audit_chain = Blockchain()
