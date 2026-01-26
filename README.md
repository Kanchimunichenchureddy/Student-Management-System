# Student Management System

A full-stack web application for managing student details with secure authentication, role-based access control, and course management.

## Features

### Authentication & Security
- **Secure Login/Logout**: JWT-based authentication with access and refresh tokens
- **Password Hashing**: bcrypt encryption for secure password storage
- **Role-Based Access Control**: Three user roles - Admin, Faculty, and Student
- **Token Refresh**: Automatic token refresh mechanism

### User Roles & Permissions
- **Admin**: Full access to all features (users, students, courses)
- **Faculty**: Can manage students and create courses
- **Student**: Read-only access to students and courses

### Core Features
- **Student Management**: CRUD operations for student records
- **Course Management**: CRUD operations for courses
- **User Management**: Admin can manage user accounts
- **Responsive Design**: Works on desktop, tablet, and mobile devices

---

## 🖼️ Visual Overview

### User Interface
![Dashboard UI](file:///Users/teja.kanchi/.gemini/antigravity/brain/896ed92e-d693-4729-9506-d3edbf90a3d4/dashboard_ui_mockup_1769323986186.png)

### System Diagrams
| Use Case Diagram | Activity Diagram |
| :--- | :--- |
| ![Use Case](file:///Users/teja.kanchi/.gemini/antigravity/brain/896ed92e-d693-4729-9506-d3edbf90a3d4/use_case_diagram_image_1769324521890.png) | ![Activity](file:///Users/teja.kanchi/.gemini/antigravity/brain/896ed92e-d693-4729-9506-d3edbf90a3d4/activity_diagram_image_1769324538987.png) |

### Database Schema (ERD)
![Database ERD](file:///Users/teja.kanchi/.gemini/antigravity/brain/896ed92e-d693-4729-9506-d3edbf90a3d4/database_erd_diagram_image_1769324558289.png)

---

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework with automatic API documentation
- **SQLAlchemy**: Database ORM for MySQL
- **Pydantic**: Data validation and settings management
- **PyJWT**: JWT token handling
- **Passlib**: Password hashing

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Responsive design with modern styling
- **Vanilla JavaScript**: ES6+ with fetch API

### Database
- **MySQL**: Relational database
- **PyMySQL**: MySQL connector

## Project Structure

```
students form/
├── backend/
│   ├── main.py              # FastAPI application with all endpoints
│   ├── models.py            # SQLAlchemy models and database configuration
│   ├── config.py            # Production configuration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # Main HTML file with login, register, and dashboard
│   ├── styles.css           # CSS for styling and responsive design
│   └── script.js            # JavaScript for authentication and API calls
├── database/
│   ├── setup_db.py          # Database setup script
│   └── seed_db.py           # Database seeding with sample users
└── README.md                # This file
```

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- MySQL Server
- pip (Python package manager)

### 1. Database Setup

Make sure MySQL server is running and create the database:

```bash
# Start MySQL server (platform-specific command)
# On macOS: brew services start mysql
# On Linux: sudo systemctl start mysql
# On Windows: net start mysql

# Run the database setup and seed script
cd database
python seed_db.py
```

This will create:
- The `student_db` database
- All required tables
- Sample users:
  - **Admin**: admin@example.com / Admin@123
  - **Faculty**: faculty@example.com / Faculty@123
  - **Student**: student@example.com / Student@123

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI server:
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8005`
   
   API Documentation (Swagger UI): `http://localhost:8005/docs`
   
   ReDoc Documentation: `http://localhost:8005/redoc`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register a new user | Public |
| POST | `/auth/login` | Login and get tokens | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout | Authenticated |
| GET | `/auth/me` | Get current user | Authenticated |
| PUT | `/auth/me` | Update profile | Authenticated |

### Students

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/students` | Get all students | Public |
| GET | `/students/{id}` | Get student by ID | Public |
| POST | `/students` | Create student | Admin/Faculty |
| PUT | `/students/{id}` | Update student | Admin/Faculty |
| DELETE | `/students/{id}` | Delete student | Admin |

### Courses

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/courses` | Get all courses | Authenticated |
| GET | `/courses/{id}` | Get course by ID | Authenticated |
| POST | `/courses` | Create course | Admin/Faculty |
| PUT | `/courses/{id}` | Update course | Admin |
| DELETE | `/courses/{id}` | Delete course | Admin |

### Admin

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/users` | Get all users | Admin |
| PUT | `/admin/users/{id}/activate` | Activate user | Admin |
| PUT | `/admin/users/{id}/deactivate` | Deactivate user | Admin |
| PUT | `/admin/users/{id}/role` | Update user role | Admin |

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### JWT Tokens
- **Access Token**: Expires in 30 minutes
- **Refresh Token**: Expires in 7 days
- Tokens contain user ID and role information

### Input Validation
- Server-side validation using Pydantic
- Email format validation
- Phone number validation (10-15 digits)
- Role validation

### SQL Injection Prevention
- SQLAlchemy ORM with parameterized queries
- No raw SQL execution

## Usage Guide

### Login
1. Enter your email and password
2. Click "Sign In"
3. You'll be redirected to the dashboard

### Registration
1. Click "Register here" on the login form
2. Fill in your details
3. Select your role (Student/Faculty/Admin)
4. Click "Create Account"

### Dashboard Navigation
- **Students**: View and manage student records
- **Courses**: View and manage courses
- **Profile**: View your profile information
- **Logout**: Sign out of the application

## Development

### Running in Development Mode

1. Start the backend server:
   ```bash
   cd backend
   python main.py
   ```

2. Serve the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/student_db

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8005

# Logging
LOG_LEVEL=INFO
```

## Production Deployment

### Security Checklist
- [ ] Set a strong `SECRET_KEY` environment variable
- [ ] Configure `ALLOWED_ORIGINS` with your production domain
- [ ] Use HTTPS in production
- [ ] Set up a process manager (e.g., gunicorn, supervisor)
- [ ] Configure proper logging
- [ ] Set up database backups
- [ ] Use environment variables for sensitive data

### Running with Gunicorn

```bash
cd backend
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8005
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
COPY database/seed_db.py .

RUN python database/seed_db.py

EXPOSE 8005

CMD ["python", "main.py"]
```

## Testing API with curl

### Register a new user
```bash
curl -X POST "http://localhost:8005/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@example.com",
       "username": "newuser",
       "full_name": "New User",
       "password": "Password@123",
       "role": "student"
     }'
```

### Login
```bash
curl -X POST "http://localhost:8005/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "Admin@123"
     }'
```

### Get all students (with token)
```bash
curl -X GET "http://localhost:8005/students" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure MySQL server is running
   - Check database credentials in `backend/models.py`
   - Verify database and user exist

2. **Port Already in Use**:
   - Change the port in `backend/main.py`
   - Kill the process using the port: `lsof -ti:8005 | xargs kill -9`

3. **CORS Errors**:
   - Configure allowed origins in CORS middleware
   - For development, all origins are allowed

4. **Module Not Found Errors**:
   - Install missing dependencies: `pip install -r backend/requirements.txt`

5. **JWT Token Errors**:
   - Ensure tokens are not expired
   - Check if SECRET_KEY is consistent
   - Verify token format (Bearer token)

### Getting Help

- Check the API documentation at `/docs`
- Review server logs for detailed error messages
- Test endpoints using Swagger UI

## License

This project is for educational purposes. Modify as needed for your use case.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the project repository.
# Student-Management-System
