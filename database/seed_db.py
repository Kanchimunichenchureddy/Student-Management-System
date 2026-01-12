#!/usr/bin/env python3
"""
Database seed script for Student Management System
Run this script to create the database, tables, and an admin user
"""

import sysh
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import create_tables, engine, SessionLocal, User
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def seed_database():
    """Create database, tables, and seed with initial data"""
    print("Setting up database...")

    # Create tables
    print("Creating tables...")
    create_tables()
    print("Tables created successfully!")

    # Create session
    db = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin = db.query(User).filter(User.username == "admin").first()
        
        if admin:
            print("Admin user already exists!")
            print(f"  Email: {admin.email}")
            print(f"  Username: {admin.username}")
            print(f"  Role: {admin.role}")
        else:
            # Create admin user
            print("Creating admin user...")
            hashed_password = hash_password("Admin@123")
            admin_user = User(
                email="admin@example.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=hashed_password,
                role="admin",
                is_active=True
            )
            
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            print("Admin user created successfully!")
            print(f"  Email: {admin_user.email}")
            print(f"  Username: {admin_user.username}")
            print(f"  Password: Admin@123")
            print(f"  Role: {admin_user.role}")
        
        # Create sample faculty user
        faculty = db.query(User).filter(User.username == "faculty").first()
        
        if not faculty:
            print("\nCreating sample faculty user...")
            hashed_password = hash_password("Faculty@123")
            faculty_user = User(
                email="faculty@example.com",
                username="faculty",
                full_name="Sample Faculty",
                hashed_password=hashed_password,
                role="faculty",
                is_active=True
            )
            
            db.add(faculty_user)
            db.commit()
            
            print("Faculty user created successfully!")
            print(f"  Email: {faculty_user.email}")
            print(f"  Username: {faculty_user.username}")
            print(f"  Password: Faculty@123")
            print(f"  Role: {faculty_user.role}")
        
        # Create sample student user
        student = db.query(User).filter(User.username == "student").first()
        
        if not student:
            print("\nCreating sample student user...")
            hashed_password = hash_password("Student@123")
            student_user = User(
                email="student@example.com",
                username="student",
                full_name="Sample Student",
                hashed_password=hashed_password,
                role="student",
                is_active=True
            )
            
            db.add(student_user)
            db.commit()
            
            print("Student user created successfully!")
            print(f"  Email: {student_user.email}")
            print(f"  Username: {student_user.username}")
            print(f"  Password: Student@123")
            print(f"  Role: {student_user.role}")
        
        print("\n" + "="*50)
        print("Database setup completed successfully!")
        print("="*50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = seed_database()
    sys.exit(0 if success else 1)
