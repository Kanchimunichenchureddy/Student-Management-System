"""Course management endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from models import Course, User, get_db
from schemas import CourseCreate, CourseResponse
from utils import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("", response_model=List[CourseResponse])
async def get_all_courses(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all courses (Authenticated users only)"""
    try:
        query = db.query(Course)
        if department:
            query = query.filter(Course.department == department)
        courses = query.offset(skip).limit(limit).all()
        return courses
    except Exception as e:
        logger.exception(f"Error fetching courses: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching courses"
        )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a course by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Create a new course (Admin/Faculty only)"""
    try:
        # Check if course code already exists
        existing = db.query(Course).filter(Course.course_code == course.course_code.upper()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course code already exists"
            )
        
        db_course = Course(
            course_code=course.course_code.upper(),
            course_name=course.course_name,
            description=course.description,
            credits=course.credits,
            department=course.department,
            instructor_id=current_user.id if current_user.role == "faculty" else None
        )
        
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
        
        return db_course
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating course"
        )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Update a course (Admin only)"""
    try:
        db_course = db.query(Course).filter(Course.id == course_id).first()
        if db_course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check for duplicate course code
        existing = db.query(Course).filter(
            Course.course_code == course_update.course_code.upper(),
            Course.id != course_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course code already exists"
            )
        
        db_course.course_code = course_update.course_code.upper()
        db_course.course_name = course_update.course_name
        db_course.description = course_update.description
        db_course.credits = course_update.credits
        db_course.department = course_update.department
        
        db.commit()
        db.refresh(db_course)
        
        return db_course
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating course"
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a course (Admin only)"""
    try:
        db_course = db.query(Course).filter(Course.id == course_id).first()
        if db_course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        db.delete(db_course)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting course: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting course"
        )
