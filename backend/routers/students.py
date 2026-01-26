"""Student management endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from models import Student, User, get_db
from schemas import StudentCreate, StudentResponse
from utils import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=List[StudentResponse])
async def get_all_students(
    skip: int = 0,
    limit: int = 100,
    department: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all students with pagination"""
    try:
        query = db.query(Student)
        if department:
            query = query.filter(Student.department == department)
        students = query.offset(skip).limit(limit).all()
        return students
    except Exception as e:
        logger.exception(f"Error fetching students: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching students"
        )


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single student by ID"""
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if db_student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return db_student


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Create a new student (Admin/Faculty only)"""
    try:
        # Check if roll number already exists
        existing_student = db.query(Student).filter(Student.roll_number == student.roll_number.upper()).first()
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number already exists"
            )
        
        # Check if email already exists
        existing_email = db.query(Student).filter(Student.email == student.email.lower()).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Create new student
        db_student = Student(
            full_name=student.full_name,
            roll_number=student.roll_number.upper(),
            email=student.email.lower(),
            phone_number=student.phone_number,
            department=student.department,
            year_of_study=student.year_of_study
        )
        
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        
        return db_student
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this roll number or email already exists"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating student"
        )


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_update: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Update a student (Admin/Faculty only)"""
    try:
        db_student = db.query(Student).filter(Student.id == student_id).first()
        if db_student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Check for duplicate roll number
        existing_roll = db.query(Student).filter(
            Student.roll_number == student_update.roll_number.upper(),
            Student.id != student_id
        ).first()
        if existing_roll:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number already exists"
            )
        
        # Check for duplicate email
        existing_email = db.query(Student).filter(
            Student.email == student_update.email.lower(),
            Student.id != student_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )
        
        # Update fields
        db_student.full_name = student_update.full_name
        db_student.roll_number = student_update.roll_number.upper()
        db_student.email = student_update.email.lower()
        db_student.phone_number = student_update.phone_number
        db_student.department = student_update.department
        db_student.year_of_study = student_update.year_of_study
        
        db.commit()
        db.refresh(db_student)
        
        return db_student
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error updating student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating student"
        )


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Delete a student (Admin/Faculty only)"""
    try:
        db_student = db.query(Student).filter(Student.id == student_id).first()
        if db_student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        db.delete(db_student)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.exception(f"Error deleting student: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting student"
        )
