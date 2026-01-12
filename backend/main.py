from fastapi import FastAPI, Depends, HTTPException, status, Security, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, EmailStr, field_validator, Field
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import re
import os
import secrets
from fastapi import Request
import bcrypt

from models import Student, User, Course, Enrollment, Attendance, get_db, create_tables, Base, engine, UserRole

# Create FastAPI app
app = FastAPI(
    title="Student Management System",
    description="A REST API for managing student details with authentication",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File to store the secret key for persistence
SECRET_KEY_FILE = os.path.join(os.path.dirname(__file__), '.secret_key')

def load_secret_key():
    """Load secret key from file or create new one"""
    if os.path.exists(SECRET_KEY_FILE):
        with open(SECRET_KEY_FILE, 'r') as f:
            return f.read().strip()
    else:
        # Create new secret key
        secret_key = secrets.token_hex(32)
        with open(SECRET_KEY_FILE, 'w') as f:
            f.write(secret_key)
        return secret_key

# Security configuration - secret key persists across restarts
SECRET_KEY = os.getenv("SECRET_KEY", load_secret_key())
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# HTTP Bearer token security
security = HTTPBearer()

# ============== Pydantic Models ==============

# Password reset request
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

# User models
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
        # Check for at least one uppercase, one lowercase, one number, one special char
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

# Student models (existing ones)
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

# Course models
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

# Attendance Models
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

# ============== Utility Functions ==============

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    # Ensure password is a plain string
    if isinstance(password, bytes):
        password = password.decode('utf-8')
    
    # Ensure it's a string
    password = str(password)
    
    # Truncate to 72 bytes max (bcrypt limitation) and ensure UTF-8 encoding doesn't exceed limit
    password_bytes = password.encode('utf-8')[:72]
    
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Ensure both are bytes
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    
    try:
        return bcrypt.checkpw(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWT Decode Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ============== Dependencies ==============

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    return user

def require_role(allowed_roles: List[str]):
    """Dependency factory to require specific roles"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
        return current_user
    return role_checker

# ============== Authentication Endpoints ==============

@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        # Debug: Log password length
        print(f"DEBUG: Received password length: {len(user_data.password)}")
        print(f"DEBUG: Password bytes: {len(user_data.password.encode('utf-8'))}")
        
        # Check if email already exists
        existing_email = db.query(User).filter(User.email == user_data.email.lower()).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email.lower().strip(),
            username=user_data.username,
            full_name=user_data.full_name.strip(),
            hashed_password=hashed_password,
            role=user_data.role
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Generate tokens
        access_token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
        refresh_token = create_refresh_token(data={"sub": str(db_user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserResponse.model_validate(db_user)
        }
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in register: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": UserResponse.model_validate(user)
    }

@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(token_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    try:
        payload = decode_token(token_request.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id: int = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new tokens
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserResponse.model_validate(user)
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@app.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard tokens)"""
    return {"message": "Successfully logged out"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.put("/auth/me", response_model=UserResponse)
async def update_current_user(
    full_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    if full_name:
        current_user.full_name = full_name.strip()
    
    db.commit()
    db.refresh(current_user)
    return current_user

@app.get("/users", response_model=List[UserResponse])
async def get_all_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Get all users (Admin only), optionally filtered by role"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()

@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a user (Admin only)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    db.delete(user)
    db.commit()
    return None

# ============== Student Endpoints ==============

@app.get("/")
async def root():
    return {"message": "Student Management System API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Public endpoint - anyone can view students
@app.get("/students", response_model=List[StudentResponse])
async def get_all_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all students with pagination"""
    try:
        students = db.query(Student).offset(skip).limit(limit).all()
        return students
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching students: {str(e)}"
        )

@app.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a single student by ID"""
    try:
        db_student = db.query(Student).filter(Student.id == student_id).first()
        if db_student is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        return db_student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching student: {str(e)}"
        )

# Admin/Faculty only endpoints
@app.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty", "student"]))
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating student: {str(e)}"
        )

@app.put("/students/{student_id}", response_model=StudentResponse)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating student: {str(e)}"
        )

@app.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "faculty"]))
):
    """Delete a student (Admin only)"""
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting student: {str(e)}"
        )

# ============== Course Endpoints ==============

@app.get("/courses", response_model=List[CourseResponse])
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching courses: {str(e)}"
        )

@app.get("/courses/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a course by ID"""
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return course
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching course: {str(e)}"
        )

@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating course: {str(e)}"
        )

@app.put("/courses/{course_id}", response_model=CourseResponse)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating course: {str(e)}"
        )

@app.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting course: {str(e)}"
        )

# ============== Admin Endpoints ==============

@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Get all users (Admin only)"""
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )

@app.put("/admin/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Activate a user account (Admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_active = True
        db.commit()
        
        return {"message": f"User {user.username} activated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error activating user: {str(e)}"
        )

@app.put("/admin/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Deactivate a user account (Admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent deactivating yourself
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account"
            )
        
        user.is_active = False
        db.commit()
        
        return {"message": f"User {user.username} deactivated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deactivating user: {str(e)}"
        )

@app.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Update user role (Admin only)"""
    try:
        if role not in ["admin", "student", "faculty"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent changing your own role
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot change your own role"
            )
        
        user.role = role
        db.commit()
        
        return {"message": f"User {user.username} role updated to {role}"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user role: {str(e)}"
        )

# ============== Attendance Endpoints ==============

@app.post("/attendance", response_model=AttendanceResponse)
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

    # Check if already marked for today (simplification: strict date check)
    today = datetime.utcnow().date()
    existing = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        func.date(Attendance.date) == today
    ).first()
    
    if existing:
        existing.status = attendance.status
        existing.remarks = attendance.remarks
        db.commit()
        db.refresh(existing)
        return existing

    new_attendance = Attendance(
        student_id=attendance.student_id,
        status=attendance.status,
        remarks=attendance.remarks,
        date=datetime.utcnow()
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    return new_attendance

@app.get("/attendance", response_model=List[AttendanceResponse])
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
    # Manually construct response to ensure student_name is populated
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

@app.get("/attendance/today/stats")
async def get_today_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summarized stats for today"""
    today = datetime.utcnow().date()
    total_students = db.query(Student).count()
    present_count = db.query(Attendance).filter(
        func.date(Attendance.date) == today,
        Attendance.status == 'Present'
    ).count()
    
    return {
        "total_students": total_students,
        "present_today": present_count,
        "absent_today": total_students - present_count, # Approximation
        "date": today.isoformat()
    }


# ============== Dashboard Endpoints ==============

@app.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics"""
    try:
        total_students = db.query(Student).count()
        total_courses = db.query(Course).count()
        
        # Calculate Real Attendance
        today = datetime.utcnow().date()
        present_count = db.query(Attendance).filter(
            func.date(Attendance.date) == today,
            Attendance.status == 'Present'
        ).count()
        
        # Mocking other data for now since models don't exist
        stats = {
            "total_students": total_students,
            "total_courses": total_courses,
            "students_present": present_count, # Connected to Real DB
            "employees_present": 4,  # Mock
            "fees_collected": 250000,  # Mock
            "staff_alerts": 2         # Mock
        }
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )

# ============== Main Entry Point ==============

if __name__ == "__main__":
    import uvicorn
    
    # Create tables on startup
    create_tables()
    
    # Run the server
    uvicorn.run(app, host="127.0.0.1", port=8005)
