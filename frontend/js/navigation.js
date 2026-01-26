
import { loadStudents } from './modules/students.js';
import { loadCourses } from './modules/courses.js';
import { loadEmployees } from './modules/employees.js';
import { loadAttendance, loadMyAttendance } from './modules/attendance.js';
import { loadEnrollments, loadMyCourses } from './modules/enrollments.js';
import { loadDashboardStats, renderCalendar, loadFees, loadProfileData } from './modules/dashboard.js';
import { getCurrentUser } from './auth.js';

// Views
const viewHome = document.getElementById('viewHome');
const viewStudents = document.getElementById('viewStudents');
const viewEmployees = document.getElementById('viewEmployees');
const viewAttendance = document.getElementById('viewAttendance');
const viewCourses = document.getElementById('viewCourses');
const viewProfile = document.getElementById('viewProfile');
const viewFees = document.getElementById('viewFees');
const viewReports = document.getElementById('viewReports');
const viewSettings = document.getElementById('viewSettings');
const viewHelp = document.getElementById('viewHelp');
const viewComingSoon = document.getElementById('viewComingSoon');
const viewEnrollments = document.getElementById('viewEnrollments');
const viewMyCourses = document.getElementById('viewMyCourses');
const viewMyAttendance = document.getElementById('viewMyAttendance');

// Nav Items
const navHome = document.getElementById('navHome');
const navStudents = document.getElementById('navStudents');
const navEmployees = document.getElementById('navEmployees');
const navAttendance = document.getElementById('navAttendance');
const navAssignments = document.getElementById('navAssignments'); // Courses
const navEnrollments = document.getElementById('navEnrollments');
const navFees = document.getElementById('navFees');
const navReports = document.getElementById('navReports');
const navSettings = document.getElementById('navSettings');
const navHelp = document.getElementById('navHelp');
const navMyCourses = document.getElementById('navMyCourses');
const navMyAttendance = document.getElementById('navMyAttendance');

const comingSoonTitle = document.getElementById('comingSoonTitle');

// Buttons
const addStudentModalBtn = document.getElementById('addStudentModalBtn');
const addCourseModalBtn = document.getElementById('addCourseModalBtn');
const quickAddStudent = document.getElementById('quickAddStudent');
const addEmployeeModalBtn = document.getElementById('addEmployeeModalBtn');


export function hideAllViews() {
    const allViews = [viewHome, viewStudents, viewEmployees, viewAttendance, viewCourses,
        viewProfile, viewFees, viewReports, viewSettings, viewHelp,
        viewComingSoon, viewEnrollments, viewMyCourses, viewMyAttendance];
    allViews.forEach(v => { if (v) v.style.display = 'none'; });

    // Reset active nav state
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
}

export function activateView(viewElement, navElement) {
    hideAllViews();
    if (viewElement) viewElement.style.display = 'block';
    if (navElement) navElement.classList.add('active');
}

export function setupRoleBasedUI() {
    const user = getCurrentUser();
    if (!user) return;

    const role = user.role;
    const isStudent = role === 'student';
    const isAdmin = role === 'admin';
    const isFaculty = role === 'faculty';
    const isAdminOrFaculty = isAdmin || isFaculty;

    // Student-only navigation
    document.querySelectorAll('.student-only').forEach(el => {
        el.style.display = isStudent ? 'flex' : 'none';
    });

    // Admin-only navigation
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });

    // Admin/Faculty navigation
    document.querySelectorAll('.admin-faculty').forEach(el => {
        el.style.display = isAdminOrFaculty ? 'flex' : 'none';
    });

    // Hide ADD buttons for students
    if (isStudent) {
        if (addStudentModalBtn) addStudentModalBtn.style.display = 'none';
        if (addCourseModalBtn) addCourseModalBtn.style.display = 'none';
        if (quickAddStudent) quickAddStudent.style.display = 'none';
        if (addEmployeeModalBtn) addEmployeeModalBtn.style.display = 'none';
    } else {
        if (addStudentModalBtn) addStudentModalBtn.style.display = 'inline-block';
        if (addCourseModalBtn) addCourseModalBtn.style.display = 'inline-block';
        if (quickAddStudent) quickAddStudent.style.display = 'flex';
        if (addEmployeeModalBtn) addEmployeeModalBtn.style.display = 'inline-block';
    }

    // Update dashboard greeting based on role
    const roleGreeting = {
        'admin': 'Administrator',
        'faculty': 'Faculty',
        'student': 'Student'
    };
    document.title = `Dashboard - ${roleGreeting[role] || 'User'}`;
}

// Switching Functions
export function switchToHome() {
    activateView(viewHome, navHome);
    loadDashboardStats();
    renderCalendar();
}

export function switchToStudents() {
    activateView(viewStudents, navStudents);
    loadStudents();
}

export function switchToEmployees() {
    activateView(viewEmployees, navEmployees);
    loadEmployees();
}

export function switchToAttendance() {
    activateView(viewAttendance, navAttendance);
    const attendanceDateInput = document.getElementById('attendanceDate');
    if (attendanceDateInput && !attendanceDateInput.value) {
        attendanceDateInput.valueAsDate = new Date();
    }
    loadAttendance();
}

export function switchToCourses() {
    activateView(viewCourses, navAssignments);
    loadCourses();
}

export function switchToFees() {
    activateView(viewFees, navFees);
    loadFees();
}

export function switchToReports() {
    activateView(viewReports, navReports);
    switchToComingSoon('Progress Reports', navReports); // Or actual view
}

export function switchToSettings() {
    activateView(viewSettings, navSettings);
}

export function switchToHelp() {
    activateView(viewHelp, navHelp);
}

export function switchToComingSoon(title, navElement) {
    activateView(viewComingSoon, navElement);
    if (comingSoonTitle) comingSoonTitle.textContent = title;
}

export function switchToProfile() {
    hideAllViews();
    if (viewProfile) viewProfile.style.display = 'block';
    loadProfileData();
}

export function switchToEnrollments() {
    activateView(viewEnrollments, navEnrollments);
    loadEnrollments();
}

export function switchToMyCourses() {
    activateView(viewMyCourses, navMyCourses);
    loadMyCourses();
}

export function switchToMyAttendance() {
    activateView(viewMyAttendance, navMyAttendance);
    loadMyAttendance();
}
