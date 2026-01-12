from sqlalchemy import Column, Integer, String, Boolean, Enum, create_engine, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, backref
import os
from datetime import datetime, timedelta
import enum
from typing import Optional

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:teja12345@localhost:3306/student_db")

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# User roles enum
class UserRole(enum.Enum):
    ADMIN = "admin"
    STUDENT = "student"
    FACULTY = "faculty"

# Student model
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    roll_number = Column(String(20), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone_number = Column(String(15), nullable=False)
    department = Column(String(50), nullable=False)
    year_of_study = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "roll_number": self.roll_number,
            "email": self.email,
            "phone_number": self.phone_number,
            "department": self.department,
            "year_of_study": self.year_of_study,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# User model for authentication
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.STUDENT.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# Course model
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String(20), unique=True, nullable=False)
    course_name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    credits = Column(Integer, nullable=False, default=3)
    department = Column(String(50), nullable=False)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    instructor = relationship("User", backref="courses_taught")

    def to_dict(self):
        return {
            "id": self.id,
            "course_code": self.course_code,
            "course_name": self.course_name,
            "description": self.description,
            "credits": self.credits,
            "department": self.department,
            "instructor_id": self.instructor_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# Enrollment model for student-course relationships
class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    grade = Column(String(5), nullable=True)

    student = relationship("Student", backref=backref("enrollments", cascade="all, delete-orphan"))
    course = relationship("Course", backref="enrollments")

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "course_id": self.course_id,
            "enrolled_at": self.enrolled_at.isoformat() if self.enrolled_at else None,
            "grade": self.grade
        }

# Attendance model
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum("Present", "Absent", "Late", "Excused", name="attendance_status"), default="Present")
    remarks = Column(String(200), nullable=True)

    student = relationship("Student", backref=backref("attendance_records", cascade="all, delete-orphan"))

    @property
    def student_name(self):
        return self.student.full_name if self.student else "Unknown"

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.full_name,
            "date": self.date.isoformat(),
            "status": self.status,
            "remarks": self.remarks
        }

# Function to create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Function to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get current user (will be used in main.py)
def get_current_user(db: SessionLocal, token: str):
    # This will be implemented in main.py with JWT decoding
    pass
