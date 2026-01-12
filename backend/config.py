# Production Configuration for Student Management System

# Environment variables (set these in your production environment)
import os

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:teja12345@localhost:3306/student_db"
)

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY")  # Must be set in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# CORS Configuration
# In production, specify your frontend domain instead of "*"
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

# Server Configuration
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8005"))

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
