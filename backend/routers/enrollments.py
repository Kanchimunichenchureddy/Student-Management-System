"""Enrollment management endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from models import Enrollment, Student, Course, User, get_db
from schemas import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse
from utils import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("", response_model=List[EnrollmentResponse])
async def get_enrollments(
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all enrollments with optional filters"""
    try:
        query = db.query(Enrollment)
        
        if student_id:
            query = query.filter(Enrollment.student_id == student_id)
        if course_id:
            query = query.filter(Enrollment.course_id == course_id)
            
        enrollments = query.offset(skip).limit(limit).all()
        
        response = []
        for enrollment in enrollments:
            response.append({
                "id": enrollment.id,
                "student_id": enrollment.student_id,
                "course_id": enrollment.course_id,
                "enrolled_at": enrollment.enrolled_at,
                "grade": enrollment.grade,
                "student_name": enrollment.student.full_name if enrollment.student else None,
                "course_name": enrollment.course.course_name if enrollment.course else None
            })
        return response
        
    except Exception as e:
        logger.exception(f"Error fetching enrollments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching enrollments"
        )


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
async def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single enrollment by ID"""
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    
    return {
        "id": enrollment.id,
        "student_id": enrollment.student_id,
        "course_id": enrollment.course_id,
        "enrolled_at": enrollment.enrolled_at,
        "grade": enrollment.grade,
        "student_name": enrollment.student.full_name if enrollment.student else None,
        "course_name": enrollment.course.course_name if enrollment.course else None
    }


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Enroll a student in a course (Admin/Faculty only)"""
    try:
        # Check if student exists
        student = db.query(Student).filter(Student.id == enrollment.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Check if course exists
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Check if already enrolled
        existing = db.query(Enrollment).filter(
            Enrollment.student_id == enrollment.student_id,
            Enrollment.course_id == enrollment.course_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student is already enrolled in this course"
            )
        
        db_enrollment = Enrollment(
            student_id=enrollment.student_id,
            course_id=enrollment.course_id
        )
        
        db.add(db_enrollment)
        db.commit()
        db.refresh(db_enrollment)
        
        return {
            "id": db_enrollment.id,
            "student_id": db_enrollment.student_id,
            "course_id": db_enrollment.course_id,
            "enrolled_at": db_enrollment.enrolled_at,
            "grade": db_enrollment.grade,
            "student_name": student.full_name,
            "course_name": course.course_name
        }
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enrollment already exists"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating enrollment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating enrollment"
        )


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
async def update_enrollment(
    enrollment_id: int,
    enrollment_update: EnrollmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Update an enrollment (e.g., add grade) (Admin/Faculty only)"""
    try:
        db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if db_enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found"
            )
        
        if enrollment_update.grade is not None:
            db_enrollment.grade = enrollment_update.grade
        
        db.commit()
        db.refresh(db_enrollment)
        
        return {
            "id": db_enrollment.id,
            "student_id": db_enrollment.student_id,
            "course_id": db_enrollment.course_id,
            "enrolled_at": db_enrollment.enrolled_at,
            "grade": db_enrollment.grade,
            "student_name": db_enrollment.student.full_name if db_enrollment.student else None,
            "course_name": db_enrollment.course.course_name if db_enrollment.course else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating enrollment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating enrollment"
        )


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Remove a student from a course (Admin only)"""
    try:
        db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if db_enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found"
            )
        
        db.delete(db_enrollment)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting enrollment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting enrollment"
        )


@router.get("/student/{student_id}/courses", response_model=List[EnrollmentResponse])
async def get_student_courses(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all courses a student is enrolled in"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    
    response = []
    for enrollment in enrollments:
        response.append({
            "id": enrollment.id,
            "student_id": enrollment.student_id,
            "course_id": enrollment.course_id,
            "enrolled_at": enrollment.enrolled_at,
            "grade": enrollment.grade,
            "student_name": student.full_name,
            "course_name": enrollment.course.course_name if enrollment.course else None
        })
    return response


@router.get("/course/{course_id}/students", response_model=List[EnrollmentResponse])
async def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all students enrolled in a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    
    response = []
    for enrollment in enrollments:
        response.append({
            "id": enrollment.id,
            "student_id": enrollment.student_id,
            "course_id": enrollment.course_id,
            "enrolled_at": enrollment.enrolled_at,
            "grade": enrollment.grade,
            "student_name": enrollment.student.full_name if enrollment.student else None,
            "course_name": course.course_name
        })
    return response
