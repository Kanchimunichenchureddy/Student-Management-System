"""Pydantic schemas for request/response validation"""

from pydantic import BaseModel, EmailStr, field_validator, Field
from datetime import datetime
from typing import Optional
import re


# ============== User Schemas ==============

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    role: str = Field(default="student")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError('Username must contain only letters, numbers, and underscores')
        return v.lower().strip()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[@$!%*?&]', v):
            raise ValueError('Password must contain at least one special character (@$!%*?&)')
        return v

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ["admin", "student", "faculty"]:
            raise ValueError('Role must be admin, student, or faculty')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============== Student Schemas ==============

class StudentCreate(BaseModel):
    full_name: str
    roll_number: str
    email: EmailStr
    phone_number: str
    department: str
    year_of_study: str

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        if len(v) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        return v.strip()

    @field_validator('roll_number')
    @classmethod
    def validate_roll_number(cls, v):
        if not v.strip():
            raise ValueError('Roll number cannot be empty')
        return v.strip().upper()

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v):
        if not v.strip():
            raise ValueError('Phone number cannot be empty')
        digits_only = re.sub(r'\D', '', v)
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError('Phone number must be between 10-15 digits')
        return v.strip()

    @field_validator('department')
    @classmethod
    def validate_department(cls, v):
        if not v.strip():
            raise ValueError('Department cannot be empty')
        return v.strip()

    @field_validator('year_of_study')
    @classmethod
    def validate_year_of_study(cls, v):
        if not v.strip():
            raise ValueError('Year of study cannot be empty')
        return v.strip()


class StudentResponse(BaseModel):
    id: int
    full_name: str
    roll_number: str
    email: str
    phone_number: str
    department: str
    year_of_study: str

    class Config:
        from_attributes = True


# ============== Course Schemas ==============

class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    description: Optional[str] = None
    credits: int = Field(default=3, ge=1, le=6)
    department: str

    @field_validator('course_code')
    @classmethod
    def validate_course_code(cls, v):
        if not v.strip():
            raise ValueError('Course code cannot be empty')
        return v.strip().upper()

    @field_validator('course_name')
    @classmethod
    def validate_course_name(cls, v):
        if not v.strip():
            raise ValueError('Course name cannot be empty')
        return v.strip()

    @field_validator('department')
    @classmethod
    def validate_department(cls, v):
        if not v.strip():
            raise ValueError('Department cannot be empty')
        return v.strip()


class CourseResponse(BaseModel):
    id: int
    course_code: str
    course_name: str
    description: Optional[str]
    credits: int
    department: str
    instructor_id: Optional[int]

    class Config:
        from_attributes = True


# ============== Attendance Schemas ==============

class AttendanceBase(BaseModel):
    student_id: int
    status: str
    remarks: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceResponse(AttendanceBase):
    id: int
    student_name: str
    date: datetime

    class Config:
        from_attributes = True


# ============== Enrollment Schemas ==============

class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int


class EnrollmentUpdate(BaseModel):
    grade: Optional[str] = Field(None, max_length=5)


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime
    grade: Optional[str]
    student_name: Optional[str] = None
    course_name: Optional[str] = None

    class Config:
        from_attributes = True
