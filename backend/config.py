# Production Configuration for Student Management System

import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/student_db"
)

# Security Configuration
SECRET_KEY_FILE = Path(__file__).parent / '.secret_key'


def load_secret_key() -> str:
    """Load secret key from environment, file, or generate new one"""
    # First, check environment variable
    env_key = os.getenv("SECRET_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    
    # Then, check file
    if SECRET_KEY_FILE.exists():
        with open(SECRET_KEY_FILE, 'r') as f:
            key = f.read().strip()
            if key:
                return key
    
    # Generate new secret key and save to file
    secret_key = secrets.token_hex(32)
    with open(SECRET_KEY_FILE, 'w') as f:
        f.write(secret_key)
    return secret_key


SECRET_KEY = load_secret_key()
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# CORS Configuration
# In production, specify your frontend domain instead of "*"
_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [origin.strip() for origin in _origins.split(",") if origin.strip()]

# Server Configuration
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8005"))

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
