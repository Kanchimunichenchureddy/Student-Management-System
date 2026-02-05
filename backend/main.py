"""
Student Management System - Main Application

A REST API for managing student details with authentication.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models import create_tables
from config import (
    ALLOWED_ORIGINS,
    LOG_LEVEL,
    SERVER_HOST,
    SERVER_PORT
)
from routers import (
    auth_router,
    students_router,
    courses_router,
    attendance_router,
    admin_router,
    enrollments_router
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Creating database tables...")
    create_tables()
    logger.info("Database tables created successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="Student Management System",
    description="A REST API for managing student details with authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware with configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Root Endpoints ==============

@app.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Student Management System API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


app.include_router(auth_router)
app.include_router(students_router)
app.include_router(courses_router)
app.include_router(attendance_router)
app.include_router(admin_router)
app.include_router(enrollments_router)


# ============== Main Entry Point ==============

if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {SERVER_HOST}:{SERVER_PORT}")
    
    # Run the server
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
