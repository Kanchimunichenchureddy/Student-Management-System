"""API Routers"""

from .auth import router as auth_router
from .students import router as students_router
from .courses import router as courses_router
from .attendance import router as attendance_router
from .admin import router as admin_router
from .enrollments import router as enrollments_router

__all__ = [
    "auth_router",
    "students_router", 
    "courses_router",
    "attendance_router",
    "admin_router",
    "enrollments_router"
]
