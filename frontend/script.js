// API Configuration
const API_BASE_URL = ''; // Proxied via Vite in development

// Token storage
let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');

// DOM Elements - Auth & Containers
const authWrapper = document.getElementById('authWrapper');
const authContainer = document.getElementById('authContainer');
const authHeader = document.getElementById('authHeader');
const dashboard = document.getElementById('dashboard');

// Forms
const loginForm = document.getElementById('login');
const registerForm = document.getElementById('register');
const loginFormContainer = document.getElementById('loginForm');
const registerFormContainer = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Header Elements
const userNameDisplay = document.getElementById('userNameDisplay');
const headerUserName = document.getElementById('headerUserName');
const headerProfileImg = document.getElementById('headerProfileImg');
const userProfileDropdownTrigger = document.getElementById('userProfileDropdownTrigger');
const userDropdown = document.getElementById('userDropdown');
const dropdownLogout = document.getElementById('dropdownLogout');

// Sidebar Navigation
const navHome = document.getElementById('navHome');
const navStudents = document.getElementById('navStudents');
const navEmployees = document.getElementById('navEmployees');
const navAttendance = document.getElementById('navAttendance');
const navAssignments = document.getElementById('navAssignments'); // For Courses/Assignments
const navMore = document.getElementById('navMore');

// Views
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
const comingSoonTitle = document.getElementById('comingSoonTitle');

// Student Management
const studentForm = document.getElementById('studentForm');
const addStudentModalBtn = document.getElementById('addStudentModalBtn');
const quickAddStudent = document.getElementById('quickAddStudent'); // New Quick Action
const addStudentForm = document.getElementById('addStudentForm');
const cancelStudentBtn = document.getElementById('cancelStudentBtn');
const studentsTableBody = document.getElementById('studentsTableBody');
const loading = document.getElementById('loading');
const noData = document.getElementById('noData');

// Course Management
const courseForm = document.getElementById('courseForm');
const addCourseModalBtn = document.getElementById('addCourseModalBtn');
const addCourseForm = document.getElementById('addCourseForm');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const coursesTableBody = document.getElementById('coursesTableBody');
const courseLoading = document.getElementById('courseLoading');
const courseNoData = document.getElementById('courseNoData');

// Employee Management
const employeeForm = document.getElementById('employeeForm');
const addEmployeeModalBtn = document.getElementById('addEmployeeModalBtn');
const addEmployeeForm = document.getElementById('addEmployeeForm');
const cancelEmployeeBtn = document.getElementById('cancelEmployeeBtn');
const employeesTableBody = document.getElementById('employeesTableBody');
const employeeLoading = document.getElementById('employeeLoading');
const employeeNoData = document.getElementById('employeeNoData');

// Attendance
const attendanceTableBody = document.getElementById('attendanceTableBody');
const attendanceDateInput = document.getElementById('attendanceDate');
const attendanceLoading = document.getElementById('attendanceLoading');

// Profile View
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileUsername = document.getElementById('profileUsername');
const profileRole = document.getElementById('profileRole');

// Dashboard Elements
const statStudentsPresent = document.querySelector('.stat-card:nth-child(1) .stat-value');
const statEmployeesPresent = document.querySelector('.stat-card:nth-child(2) .stat-value');
const statFeesCollected = document.querySelector('.stat-card:nth-child(3) .stat-value');
const statStaffAlerts = document.querySelector('.stat-card:nth-child(4) .stat-value');
const chartContainer = document.querySelector('.section-card:nth-child(3) div'); // Chart placeholder div

// Messages
const messageContainer = document.getElementById('messageContainer');
const messageContent = document.getElementById('messageContent');


// ============== Utility Functions ==============

function isLoggedIn() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    return token !== null && user !== null;
}

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function saveTokens(newAccessToken, newRefreshToken) {
    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}

function saveUser(user) {
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuthData() {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

function showMessage(message, type = 'info') {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);

    // Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} fa-lg"></i>
        <div class="toast-content">${messageString}</div>
    `;

    messageContainer.appendChild(toast);
    messageContainer.style.display = 'block';

    // Slide In
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            if (messageContainer.children.length === 0) {
                messageContainer.style.display = 'none'; // logic optional depending on CSS
            }
        }, 300);
    }, 3000);
}

function clearErrors(formId) {
    const errorElements = document.querySelectorAll(`#${formId} .error`);
    const inputElements = document.querySelectorAll(`#${formId} input, #${formId} select`);
    errorElements.forEach(el => el.textContent = '');
    inputElements.forEach(el => el.classList.remove('error'));
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============== Navigation Functions ==============

function hideAllViews() {
    viewHome.style.display = 'none';
    viewStudents.style.display = 'none';
    viewStudents.style.display = 'none';
    if (viewEmployees) viewEmployees.style.display = 'none';
    if (viewAttendance) viewAttendance.style.display = 'none';
    viewCourses.style.display = 'none';
    viewProfile.style.display = 'none';
    if (viewFees) viewFees.style.display = 'none';
    if (viewReports) viewReports.style.display = 'none';
    if (viewSettings) viewSettings.style.display = 'none';
    if (viewHelp) viewHelp.style.display = 'none';
    if (viewComingSoon) viewComingSoon.style.display = 'none';

    // Reset active nav state
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
}

function activateView(viewElement, navElement) {
    hideAllViews();
    if (viewElement) viewElement.style.display = 'block';
    if (navElement) navElement.classList.add('active');
}

function switchToHome() {
    activateView(viewHome, navHome);
}

function switchToStudents() {
    activateView(viewStudents, navStudents);
    loadStudents();
}

function switchToEmployees() {
    activateView(viewEmployees, navEmployees);
    loadEmployees();
}
function switchToAttendance() {
    activateView(viewAttendance, navAttendance);
    // Set today if empty
    if (attendanceDateInput && !attendanceDateInput.value) {
        attendanceDateInput.valueAsDate = new Date();
    }
    loadAttendance();
}

function switchToCourses() {
    activateView(viewCourses, navAssignments);
    loadCourses();
}

function switchToFees() {
    activateView(viewFees, navFees);
    loadFees(); // Load mock fees
}

function switchToReports() {
    activateView(viewReports, navReports);
}

function switchToSettings() {
    activateView(viewSettings, navSettings);
}

function switchToHelp() {
    activateView(viewHelp, navHelp);
}

function switchToComingSoon(title, navElement) {
    activateView(viewComingSoon, navElement);
    if (comingSoonTitle) comingSoonTitle.textContent = title;
}

function switchToProfile() {
    hideAllViews();
    viewProfile.style.display = 'block';
    // No specific nav item for profile in sidebar usually, but header dropdown link goes here
}

// ============== Auth Functions ==============

function showLogin() {
    authWrapper.style.display = 'flex'; // Restore flex container
    authContainer.style.display = 'block';
    authHeader.style.display = 'block';
    loginFormContainer.style.display = 'block';
    registerFormContainer.style.display = 'none';
    dashboard.style.display = 'none';
    document.title = "Student Management System - Login";
}

function showRegister() {
    authWrapper.style.display = 'flex';
    authContainer.style.display = 'block';
    authHeader.style.display = 'block';
    loginFormContainer.style.display = 'none';
    registerFormContainer.style.display = 'block';
    dashboard.style.display = 'none';
}

function showDashboard() {
    authWrapper.style.display = 'none'; // Hide entire auth container
    authContainer.style.display = 'none';
    authHeader.style.display = 'none';
    dashboard.style.display = 'flex'; // Important for Sidebar layout
    document.title = "Dashboard - MySchool";

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        userNameDisplay.textContent = user.full_name;
        headerUserName.textContent = user.username;
        headerProfileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`;

        // Profile View Data
        profileName.textContent = user.full_name;
        profileEmail.textContent = user.email;
        profileUsername.textContent = user.username;
        profileUsername.textContent = user.username;
        profileRole.textContent = user.role;
    }

    // Load Dashboard Data
    loadDashboardStats();
    renderCalendar();

    // Default view
    switchToHome();
}

function logout() {
    clearAuthData();
    showMessage('Logged out successfully', 'info');
    showLogin();
}


// ============== API Interactions ==============

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
            loginForm.reset();
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

// --- Dashboard Stats & Charts ---

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();

            // Update Stats Wrapper
            if (statStudentsPresent) statStudentsPresent.textContent = data.students_present;
            if (statEmployeesPresent) statEmployeesPresent.textContent = data.employees_present;
            if (statFeesCollected) statFeesCollected.textContent = `₹${data.fees_collected.toLocaleString('en-IN')}`;
            if (statStaffAlerts) statStaffAlerts.textContent = data.staff_alerts;

            // Render Chart
            renderAttendanceChart(data.students_present, data.total_students);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

let attendanceChart = null;

function renderAttendanceChart(present, total) {
    if (!chartContainer) return;

    // Clear placeholder text
    chartContainer.innerHTML = '<canvas id="attendanceChart"></canvas>';
    chartContainer.style.background = 'white';

    const ctx = document.getElementById('attendanceChart').getContext('2d');

    // Destroy existing chart if any to avoid stacking
    if (attendanceChart) {
        attendanceChart.destroy();
    }

    const absent = total - present;

    attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [{
                data: [present, absent > 0 ? absent : 0],
                backgroundColor: ['#05CD99', '#EE5D50'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        font: { family: "'Outfit', sans-serif" }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderCalendar() {
    const calendarWidget = document.querySelector('.calendar-widget');
    if (!calendarWidget) return;

    const date = new Date();
    const currentDay = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sunday

    // Adjust logic for Mon start if needed, but let's stick to standard Sun-Sat or just list days
    // The current HTML has Mo Tu We Th Fr Sa Su, so 1 = Mon

    // Simplify: Just render days 1 to daysInMonth, highlighting today

    let html = `
        <div class="cal-days">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
        </div>
        <div class="cal-grid">
    `;

    // Basic day filling (not perfectly aligned with DoW for brevity, but functional)
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === currentDay ? 'active-day' : '';
        // Mock some events
        const hasEvent = [5, 12, 18, 25].includes(i) ? 'event-dot' : '';
        html += `<span class="${isToday} ${hasEvent}">${i}</span>`;
    }

    html += '</div>';
    calendarWidget.innerHTML = html;

    // Update Header Date
    const cardHeader = document.querySelector('.grid-right .section-card:nth-child(1) .card-header h3');
    if (cardHeader) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        cardHeader.textContent = date.toLocaleDateString('en-US', options);
    }
}


// --- Students ---

async function loadStudents() {
    loading.style.display = 'block';
    noData.style.display = 'none';
    studentsTableBody.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/students`);
        const students = await response.json();

        if (response.ok) {
            if (students.length === 0) noData.style.display = 'block';
            else displayStudents(students);
        } else {
            showMessage('Error loading students', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to fetch students.', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function displayStudents(students) {
    studentsTableBody.innerHTML = '';
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${escapeHtml(student.full_name)}</td>
            <td>${escapeHtml(student.roll_number)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.phone_number)}</td>
            <td>${escapeHtml(student.department)}</td>
            <td>${escapeHtml(student.year_of_study)}</td>
            <td>
                ${user && (user.role === 'admin' || user.role === 'faculty') ?
                `<button class="action-btn delete-btn" onclick="deleteStudent(${student.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        studentsTableBody.appendChild(row);
    });
}

async function createStudent(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showMessage('Student added successfully!', 'success');
            addStudentForm.style.display = 'none';
            studentForm.reset();
            loadStudents();
        } else {
            const err = await response.json();
            showMessage(err.detail || 'Failed to add student', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}

async function deleteStudent(id) {
    if (!confirm('Delete this student?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showMessage('Student deleted.', 'success');
            loadStudents();
        } else {
            showMessage('Failed to delete.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}
window.deleteStudent = deleteStudent; // Make global for onclick

// --- Courses ---

async function loadCourses() {
    courseLoading.style.display = 'block';
    courseNoData.style.display = 'none';
    coursesTableBody.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/courses`, { headers: getAuthHeaders() });
        const courses = await response.json();

        if (response.ok) {
            if (courses.length === 0) courseNoData.style.display = 'block';
            else displayCourses(courses);
        } else {
            showMessage('Error loading courses', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to fetch courses.', 'error');
    } finally {
        courseLoading.style.display = 'none';
    }
}

function displayCourses(courses) {
    coursesTableBody.innerHTML = '';
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    courses.forEach(course => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${course.id}</td>
            <td>${escapeHtml(course.course_code)}</td>
            <td>${escapeHtml(course.course_name)}</td>
            <td>${course.credits}</td>
            <td>${escapeHtml(course.department)}</td>
             <td>
                ${user && (user.role === 'admin' || (user.role === 'faculty' && course.instructor_id === user.id)) ?
                `<button class="action-btn delete-btn" onclick="deleteCourse(${course.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        coursesTableBody.appendChild(row);
    });
}

async function createCourse(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        const data = await response.json();

        if (response.ok) {
            showMessage('Course added!', 'success');
            addCourseForm.style.display = 'none';
            courseForm.reset();
            loadCourses();
        } else {
            showMessage(data.detail || 'Error creating course', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}

async function deleteCourse(id) {
    if (!confirm('Delete this course?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showMessage('Course deleted.', 'success');
            loadCourses();
        } else {
            showMessage('Failed to delete.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}
window.deleteCourse = deleteCourse; // Make global

// --- Employees (Uses /users endpoint) ---

async function loadEmployees() {
    employeeLoading.style.display = 'block';
    employeeNoData.style.display = 'none';
    employeesTableBody.innerHTML = '';

    try {
        // Fetch Admin and Faculty
        const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
        const users = await response.json();

        if (response.ok) {
            // Filter out current user if needed, or just show list
            const employees = users.filter(u => u.role !== 'student');
            if (employees.length === 0) employeeNoData.style.display = 'block';
            else displayEmployees(employees);
        } else {
            // If 403 (not admin), show message
            if (response.status === 403) {
                employeeNoData.textContent = "Access denied. Admin only.";
                employeeNoData.style.display = 'block';
            } else {
                showMessage('Error loading employees', 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        employeeLoading.style.display = 'none';
    }
}

function displayEmployees(users) {
    employeesTableBody.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem('user'));

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${escapeHtml(user.full_name)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${user.role}</span></td>
            <td>
                ${currentUser && currentUser.role === 'admin' && currentUser.id !== user.id ?
                `<button class="action-btn delete-btn" onclick="deleteUser(${user.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        employeesTableBody.appendChild(row);
    });
}

async function createEmployee(data) {
    // Reuse register endpoint
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessage('Employee added successfully!', 'success');
            addEmployeeForm.style.display = 'none';
            employeeForm.reset();
            loadEmployees();
        } else {
            const err = await response.json();
            showMessage(err.detail || 'Failed to add employee', 'error');
        }
    } catch (error) {
        console.error(error);
        showMessage('Network error', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showMessage('User deleted', 'success');
            loadEmployees();
        } else {
            showMessage('Failed to delete', 'error');
        }
    } catch (e) {
        showMessage('Network error', 'error');
    }
}
window.deleteUser = deleteUser;

window.deleteUser = deleteUser;

// --- Attendance Logic ---
async function loadAttendance() {
    if (!attendanceTableBody) return;
    attendanceLoading.style.display = 'block';
    attendanceTableBody.innerHTML = '';

    const date = attendanceDateInput.value || new Date().toISOString().split('T')[0];

    try {
        // Parallel fetch: Students + Attendance for date
        const [studentsRes, attendanceRes] = await Promise.all([
            fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/attendance?date=${date}`, { headers: getAuthHeaders() })
        ]);

        if (studentsRes.ok) {
            const students = await studentsRes.json();
            const attendanceParams = attendanceRes.ok ? await attendanceRes.json() : [];

            displayAttendanceTable(students, attendanceParams);
        } else {
            showMessage('Failed to load student list for attendance', 'error');
        }

    } catch (e) {
        console.error(e);
        showMessage('Network error loading attendance', 'error');
    } finally {
        attendanceLoading.style.display = 'none';
    }
}
window.loadAttendance = loadAttendance;

function displayAttendanceTable(students, attendanceRecords) {
    attendanceTableBody.innerHTML = '';

    // Create map for easy lookup: student_id -> status
    const statusMap = {};
    attendanceRecords.forEach(r => statusMap[r.student_id] = r.status);

    students.forEach(student => {
        const currentStatus = statusMap[student.id]; // undefined if not marked
        const isPresent = currentStatus === 'Present';
        const isAbsent = currentStatus === 'Absent';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.roll_number}</td>
            <td>${student.full_name}</td>
            <td>
                <span class="badge ${isPresent ? 'badge-success' : (isAbsent ? 'badge-danger' : 'badge-warning')}">
                    ${currentStatus || 'Not Marked'}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="markStudent(${student.id}, 'Present')" title="Mark Present" style="color: var(--success-color);">
                    <i class="fa-solid fa-check"></i>
                </button>
                <button class="action-btn" onclick="markStudent(${student.id}, 'Absent')" title="Mark Absent" style="color: var(--danger-color);">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        `;
        attendanceTableBody.appendChild(row);
    });
}

async function markStudent(studentId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                student_id: studentId,
                status: status,
                remarks: "Manual Entry"
            })
        });

        if (response.ok) {
            // refresh table to show new status
            showMessage('Attendance marked!', 'success');
            loadAttendance(); // Simple full reload, or optimization: update DOM row
        } else {
            showMessage('Failed to mark attendance', 'error');
        }
    } catch (e) {
        console.error(e);
    }
}
window.markStudent = markStudent;


// --- Fees (Mock Logic) ---
function loadFees() {
    const tableContainer = document.querySelector('#viewFees .table-container');
    const records = [
        { id: 101, student: "Alice Smith", amount: 5000, date: "2023-10-01", status: "Paid" },
        { id: 102, student: "Bob Jones", amount: 5000, date: "2023-10-05", status: "Pending" },
        { id: 103, student: "Charlie Day", amount: 2500, date: "2023-10-10", status: "Paid" }
    ];

    let html = `
        <div class="table-wrapper">
        <table>
            <thead>
                <tr><th>ID</th><th>Student</th><th>Amount</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
    `;
    records.forEach(r => {
        html += `
            <tr>
                <td>${r.id}</td>
                <td>${r.student}</td>
                <td>₹${r.amount}</td>
                <td>${r.date}</td>
                <td><span class="badge ${r.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${r.status}</span></td>
            </tr>
        `;
    });
    html += `</tbody></table></div>`;
    tableContainer.innerHTML = html;
}

// ============== Event Listeners ==============

// Auth
showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    await login(fd.get('email'), fd.get('password'));
});

registerForm.addEventListener('submit', async (e) => {
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

// Sidebar & Header interactions
navHome.addEventListener('click', switchToHome);
navStudents.addEventListener('click', switchToStudents);
navAssignments.addEventListener('click', switchToCourses);
if (navEmployees) navEmployees.addEventListener('click', switchToEmployees);
if (navAttendance) navAttendance.addEventListener('click', switchToAttendance); // Direct link
if (navFees) navFees.addEventListener('click', switchToFees);
if (navReports) navReports.addEventListener('click', switchToReports);
if (navSettings) navSettings.addEventListener('click', switchToSettings);
if (navHelp) navHelp.addEventListener('click', switchToHelp);

// Placeholder/Coming Soon links
// Employees removed from here
// Placeholder/Coming Soon links
// Employees and Attendance removed from here
if (navMore) navMore.addEventListener('click', () => switchToComingSoon('More Modules', navMore));

// Profile Dropdown
if (userProfileDropdownTrigger) {
    userProfileDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.style.display = userDropdown.style.display === 'flex' ? 'none' : 'flex';
    });
}
document.addEventListener('click', () => {
    if (userDropdown) userDropdown.style.display = 'none';
});

if (dropdownLogout) dropdownLogout.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

const dropdownProfile = document.getElementById('dropdownProfile');
if (dropdownProfile) dropdownProfile.addEventListener('click', (e) => {
    e.preventDefault();
    switchToProfile();
});

// Forms
addStudentModalBtn.addEventListener('click', () => { addStudentForm.style.display = 'block'; });
if (quickAddStudent) quickAddStudent.addEventListener('click', () => {
    switchToStudents();
    addStudentForm.style.display = 'block';
});

cancelStudentBtn.addEventListener('click', () => {
    addStudentForm.style.display = 'none';
    studentForm.reset();
});

studentForm.addEventListener('submit', async (e) => {
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
    await createStudent(data);
});

addCourseModalBtn.addEventListener('click', () => { addCourseForm.style.display = 'block'; });
cancelCourseBtn.addEventListener('click', () => {
    addCourseForm.style.display = 'none';
    courseForm.reset();
});

courseForm.addEventListener('submit', async (e) => {
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
    await createCourse(data);
});



// Employee Form Listeners
if (addEmployeeModalBtn) addEmployeeModalBtn.addEventListener('click', () => { addEmployeeForm.style.display = 'block'; });
if (cancelEmployeeBtn) cancelEmployeeBtn.addEventListener('click', () => {
    addEmployeeForm.style.display = 'none';
    employeeForm.reset();
});

if (employeeForm) employeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    await createEmployee(data);
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) showDashboard();
    else showLogin();
});
