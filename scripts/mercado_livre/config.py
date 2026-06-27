# config.py
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID     = os.getenv('ML_CLIENT_ID')
CLIENT_SECRET = os.getenv('ML_CLIENT_SECRET')
REDIRECT_URI  = os.getenv('REDIRECT_URI')
TOKEN_FILE    = 'ml_tokens.json'
DB_PATH       = os.getenv('DB_PATH', 'ml_data.db')
