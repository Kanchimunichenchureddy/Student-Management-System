#!/usr/bin/env python3
"""
Database setup script for Student Management System
Run this script to create the database and tables
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import create_tables, engine
from sqlalchemy import text

def setup_database():
    """Create database and tables"""
    print("Setting up database...")

    # Create database if it doesn't exist
    try:
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text("SHOW DATABASES LIKE 'student_db'"))
            if not result.fetchone():
                print("Creating database 'student_db'...")
                conn.execute(text("CREATE DATABASE student_db"))
                print("Database 'student_db' created successfully!")
            else:
                print("Database 'student_db' already exists.")

            # Switch to the database
            conn.execute(text("USE student_db"))

        # Create tables
        print("Creating tables...")
        create_tables()
        print("Tables created successfully!")

    except Exception as e:
        print(f"Error setting up database: {e}")
        return False

    print("Database setup completed successfully!")
    return True

if __name__ == "__main__":
    setup_database()