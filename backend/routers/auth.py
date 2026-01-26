"""Authentication endpoints"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from jose import JWTError
from typing import List, Optional

from models import User, get_db
from schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, 
    RefreshTokenRequest, PasswordResetRequest, PasswordResetConfirm
)
from utils import (
    get_password_hash, verify_password, create_access_token, 
    create_refresh_token, decode_token, get_current_user, require_role
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
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
        logger.exception(f"Error in register: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
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


@router.post("/refresh", response_model=TokenResponse)
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
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "user": UserResponse.model_validate(user)
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should discard tokens)"""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=UserResponse)
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


@router.post("/forgot-password")
async def forgot_password(reset_request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset (sends email with reset token)"""
    user = db.query(User).filter(User.email == reset_request.email.lower()).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account with this email exists, a password reset link has been sent."}
    
    # Generate password reset token
    reset_token = create_access_token(
        data={"sub": str(user.id), "type": "password_reset"},
    )
    
    # TODO: Send email with reset token
    # For now, just log it (in production, send email)
    logger.info(f"Password reset requested for {user.email}")
    
    return {"message": "If an account with this email exists, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(reset_confirm: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using token"""
    try:
        payload = decode_token(reset_confirm.token)
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = get_password_hash(reset_confirm.new_password)
        db.commit()
        
        return {"message": "Password has been reset successfully"}
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
