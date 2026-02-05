
import {
    isLoggedIn,
    handleAuthError,
    saveTokens,
    saveUser,
    clearAuthData,
    getCurrentUser
} from './auth.js';
import { API_BASE_URL } from './config.js';
import { showMessage, clearErrors, escapeHtml } from './utils.js';

// Module Imports for Event Listeners and Globals
import * as StudentModule from './modules/students.js';
import * as CourseModule from './modules/courses.js';
import * as EmployeeModule from './modules/employees.js';
import * as AttendanceModule from './modules/attendance.js';
import * as EnrollmentModule from './modules/enrollments.js';
import * as DashboardModule from './modules/dashboard.js';
import * as Nav from './navigation.js';


// Global assignments for inline onclick events
window.deleteStudent = StudentModule.deleteStudent;
window.deleteCourse = CourseModule.deleteCourse;
window.deleteUser = EmployeeModule.deleteUser;
window.deleteEnrollment = EnrollmentModule.deleteEnrollment;
window.markStudent = AttendanceModule.markStudent;
window.loadAttendance = AttendanceModule.loadAttendance; // For the 'Load' button
window.loadMyAttendance = AttendanceModule.loadMyAttendance; // For student attendance view


// DOM Elements - Auth & Containers
const authWrapper = document.getElementById('authWrapper');
const authContainer = document.getElementById('authContainer');
const authHeader = document.getElementById('authHeader');
const dashboard = document.getElementById('dashboard');

// Forms
const loginForm = document.getElementById('login');
const registerForm = document.getElementById('register');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const loginFormContainer = document.getElementById('loginForm');
const registerFormContainer = document.getElementById('registerForm');

// Header
const userNameDisplay = document.getElementById('userNameDisplay');
const headerUserName = document.getElementById('headerUserName');
const headerProfileImg = document.getElementById('headerProfileImg');
const userProfileDropdownTrigger = document.getElementById('userProfileDropdownTrigger');
const userDropdown = document.getElementById('userDropdown');
const dropdownLogout = document.getElementById('dropdownLogout');
const dropdownProfile = document.getElementById('dropdownProfile');


// UI State Management

function showLogin() {
    if (authWrapper) authWrapper.style.display = 'flex';
    if (authContainer) authContainer.style.display = 'block';
    if (authHeader) authHeader.style.display = 'block';
    if (loginFormContainer) loginFormContainer.style.display = 'block';
    if (registerFormContainer) registerFormContainer.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    document.title = "Student Management System - Login";
}

function showRegister() {
    if (authWrapper) authWrapper.style.display = 'flex';
    if (authContainer) authContainer.style.display = 'block';
    if (authHeader) authHeader.style.display = 'block';
    if (loginFormContainer) loginFormContainer.style.display = 'none';
    if (registerFormContainer) registerFormContainer.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
}

function showDashboard() {
    if (authWrapper) authWrapper.style.display = 'none';
    if (authContainer) authContainer.style.display = 'none';
    if (authHeader) authHeader.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';

    const user = getCurrentUser();
    if (user) {
        if (userNameDisplay) userNameDisplay.textContent = user.full_name;
        if (headerUserName) headerUserName.textContent = user.username;
        if (headerProfileImg) headerProfileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`;
    }

    // Setup role-based navigation
    Nav.setupRoleBasedUI();

    // Load Dashboard Data
    DashboardModule.loadDashboardStats();
    DashboardModule.renderCalendar();

    // Default view
    Nav.switchToHome();
}

function logout() {
    clearAuthData();
    showMessage('Logged out successfully', 'info');
    showLogin();
}


// API Interactions (Auth)

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            saveTokens(data.access_token, data.refresh_token);
            saveUser(data.user);
            showMessage('Login successful!', 'success');
            if (loginForm) loginForm.reset();
            showDashboard();
        } else {
            const err = await response.json();
            showMessage(err.detail || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Check backend.', 'error');
    }
}

async function register(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();

        if (response.ok) {
            saveTokens(data.access_token, data.refresh_token);
            saveUser(data.user);
            showDashboard();
            showMessage('Account created successfully!', 'success');
        } else {
            showMessage(data.detail || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error.', 'error');
    }
}


// Event Listeners

document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) showDashboard();
    else showLogin();

    // Auth Forms
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(loginForm);
        await login(fd.get('email'), fd.get('password'));
    });

    if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('registerForm');
        const fd = new FormData(e.target);
        const data = {
            full_name: fd.get('full_name'),
            username: fd.get('username'),
            email: fd.get('email'),
            password: fd.get('password'),
            role: fd.get('role')
        };
        await register(data);
    });

    // User Profile Dropdown
    if (userProfileDropdownTrigger) {
        userProfileDropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (userDropdown) userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    document.addEventListener('click', () => {
        if (userDropdown) userDropdown.style.display = 'none';
    });

    if (dropdownLogout) dropdownLogout.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    if (dropdownProfile) dropdownProfile.addEventListener('click', (e) => {
        e.preventDefault();
        Nav.switchToProfile();
    });

    // Navigation Events
    const navHome = document.getElementById('navHome');
    if (navHome) navHome.addEventListener('click', Nav.switchToHome);

    const navStudents = document.getElementById('navStudents');
    if (navStudents) navStudents.addEventListener('click', Nav.switchToStudents);

    const navAssignments = document.getElementById('navAssignments');
    if (navAssignments) navAssignments.addEventListener('click', Nav.switchToCourses);

    const navEmployees = document.getElementById('navEmployees');
    if (navEmployees) navEmployees.addEventListener('click', Nav.switchToEmployees);

    const navAttendance = document.getElementById('navAttendance');
    if (navAttendance) navAttendance.addEventListener('click', Nav.switchToAttendance);

    const navFees = document.getElementById('navFees');
    if (navFees) navFees.addEventListener('click', Nav.switchToFees);

    const navReports = document.getElementById('navReports');
    if (navReports) navReports.addEventListener('click', Nav.switchToReports);

    const navSettings = document.getElementById('navSettings');
    if (navSettings) navSettings.addEventListener('click', Nav.switchToSettings);

    const navHelp = document.getElementById('navHelp');
    if (navHelp) navHelp.addEventListener('click', Nav.switchToHelp);

    const navEnrollments = document.getElementById('navEnrollments');
    if (navEnrollments) navEnrollments.addEventListener('click', Nav.switchToEnrollments);

    const navMyCourses = document.getElementById('navMyCourses');
    if (navMyCourses) navMyCourses.addEventListener('click', Nav.switchToMyCourses);

    const navMyAttendance = document.getElementById('navMyAttendance');
    if (navMyAttendance) navMyAttendance.addEventListener('click', Nav.switchToMyAttendance);


    // --- Specific module listeners ---

    // Student Form
    const addStudentModalBtn = document.getElementById('addStudentModalBtn');
    const quickAddStudent = document.getElementById('quickAddStudent');
    const addStudentForm = document.getElementById('addStudentForm');
    const cancelStudentBtn = document.getElementById('cancelStudentBtn');
    const studentForm = document.getElementById('studentForm');

    if (addStudentModalBtn) addStudentModalBtn.addEventListener('click', () => { if (addStudentForm) addStudentForm.style.display = 'block'; });
    if (quickAddStudent) quickAddStudent.addEventListener('click', () => {
        Nav.switchToStudents();
        if (addStudentForm) addStudentForm.style.display = 'block';
    });
    if (cancelStudentBtn) cancelStudentBtn.addEventListener('click', () => {
        if (addStudentForm) addStudentForm.style.display = 'none';
        if (studentForm) studentForm.reset();
    });
    if (studentForm) studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('addStudentForm');
        const fd = new FormData(e.target);
        const data = {
            full_name: fd.get('full_name'),
            roll_number: fd.get('roll_number'),
            email: fd.get('email'),
            phone_number: fd.get('phone_number'),
            department: fd.get('department'),
            year_of_study: fd.get('year_of_study')
        };
        await StudentModule.createStudent(data);
    });

    // Course Form
    const addCourseModalBtn = document.getElementById('addCourseModalBtn');
    const addCourseForm = document.getElementById('addCourseForm');
    const cancelCourseBtn = document.getElementById('cancelCourseBtn');
    const courseForm = document.getElementById('courseForm');

    if (addCourseModalBtn) addCourseModalBtn.addEventListener('click', () => { if (addCourseForm) addCourseForm.style.display = 'block'; });
    if (cancelCourseBtn) cancelCourseBtn.addEventListener('click', () => {
        if (addCourseForm) addCourseForm.style.display = 'none';
        if (courseForm) courseForm.reset();
    });
    if (courseForm) courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors('addCourseForm');
        const fd = new FormData(e.target);
        const data = {
            course_code: fd.get('course_code'),
            course_name: fd.get('course_name'),
            description: fd.get('description'),
            credits: parseInt(fd.get('credits')),
            department: fd.get('department')
        };
        await CourseModule.createCourse(data);
    });

    // Employee Form
    const addEmployeeModalBtn = document.getElementById('addEmployeeModalBtn');
    const addEmployeeForm = document.getElementById('addEmployeeForm');
    const cancelEmployeeBtn = document.getElementById('cancelEmployeeBtn');
    const employeeForm = document.getElementById('employeeForm');

    if (addEmployeeModalBtn) addEmployeeModalBtn.addEventListener('click', () => { if (addEmployeeForm) addEmployeeForm.style.display = 'block'; });
    if (cancelEmployeeBtn) cancelEmployeeBtn.addEventListener('click', () => {
        if (addEmployeeForm) addEmployeeForm.style.display = 'none';
        if (employeeForm) employeeForm.reset();
    });
    if (employeeForm) employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        await EmployeeModule.createEmployee(data);
    });

    // Enrollment Form
    const addEnrollmentBtn = document.getElementById('addEnrollmentBtn');
    const addEnrollmentForm = document.getElementById('addEnrollmentForm');
    const cancelEnrollmentBtn = document.getElementById('cancelEnrollmentBtn');
    const enrollmentForm = document.getElementById('enrollmentForm');

    if (addEnrollmentBtn) addEnrollmentBtn.addEventListener('click', () => {
        if (addEnrollmentForm) addEnrollmentForm.style.display = 'block';
        EnrollmentModule.loadEnrollmentSelects();
    });
    if (cancelEnrollmentBtn) cancelEnrollmentBtn.addEventListener('click', () => {
        if (addEnrollmentForm) addEnrollmentForm.style.display = 'none';
        if (enrollmentForm) enrollmentForm.reset();
    });
    if (enrollmentForm) enrollmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        await EnrollmentModule.createEnrollment(fd.get('student_id'), fd.get('course_id'));
    });

    // Profile Edit Form
    const profileEditForm = document.getElementById('profileEditForm');
    if (profileEditForm) profileEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('editProfileName').value;
        await DashboardModule.updateProfile(fullName);
    });

});
