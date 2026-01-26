"""Attendance management endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List, Optional

from models import Attendance, Student, User, get_db
from schemas import AttendanceCreate, AttendanceResponse
from utils import get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("", response_model=AttendanceResponse)
async def mark_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Mark attendance for a student (Admin/Faculty only)"""
    # Check if student exists
    student = db.query(Student).filter(Student.id == attendance.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if already marked for today
    today = datetime.now(timezone.utc).date()
    existing = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        func.date(Attendance.date) == today
    ).first()
    
    if existing:
        existing.status = attendance.status
        existing.remarks = attendance.remarks
        db.commit()
        db.refresh(existing)
        return {
            "id": existing.id,
            "student_id": existing.student_id,
            "student_name": student.full_name,
            "date": existing.date,
            "status": existing.status,
            "remarks": existing.remarks
        }

    new_attendance = Attendance(
        student_id=attendance.student_id,
        status=attendance.status,
        remarks=attendance.remarks,
        date=datetime.now(timezone.utc)
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    
    return {
        "id": new_attendance.id,
        "student_id": new_attendance.student_id,
        "student_name": student.full_name,
        "date": new_attendance.date,
        "status": new_attendance.status,
        "remarks": new_attendance.remarks
    }


@router.get("", response_model=List[AttendanceResponse])
async def get_attendance(
    date: Optional[str] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance records, optionally filtered by date (YYYY-MM-DD) or student_id"""
    query = db.query(Attendance)
    
    if date:
        try:
            query_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(Attendance.date) == query_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
            
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
        
    records = query.all()
    
    response = []
    for record in records:
        response.append({
            "id": record.id,
            "student_id": record.student_id,
            "student_name": record.student.full_name if record.student else "Unknown",
            "date": record.date,
            "status": record.status,
            "remarks": record.remarks
        })
    return response


@router.get("/today/stats")
async def get_today_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summarized stats for today"""
    today = datetime.now(timezone.utc).date()
    total_students = db.query(Student).count()
    present_count = db.query(Attendance).filter(
        func.date(Attendance.date) == today,
        Attendance.status == 'Present'
    ).count()
    
    return {
        "total_students": total_students,
        "present_today": present_count,
        "absent_today": total_students - present_count,
        "date": today.isoformat()
    }
