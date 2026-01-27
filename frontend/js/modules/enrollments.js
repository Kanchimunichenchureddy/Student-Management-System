
import { API_BASE_URL } from '../config.js';
import { getAuthHeaders, getCurrentUser } from '../auth.js';
import { showMessage, escapeHtml } from '../utils.js';

// DOM Elements
const enrollmentsTableBody = document.getElementById('enrollmentsTableBody');
const enrollmentsLoading = document.getElementById('enrollmentsLoading');
const enrollmentsNoData = document.getElementById('enrollmentsNoData');
const addEnrollmentForm = document.getElementById('addEnrollmentForm');
const enrollmentForm = document.getElementById('enrollmentForm');

export async function loadEnrollments() {
    if (!enrollmentsTableBody) return;

    enrollmentsLoading.style.display = 'block';
    enrollmentsNoData.style.display = 'none';
    enrollmentsTableBody.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments`, { headers: getAuthHeaders() });
        const enrollments = await response.json();

        if (response.ok) {
            if (enrollments.length === 0) {
                enrollmentsNoData.style.display = 'block';
            } else {
                displayEnrollments(enrollments);
            }
        }
    } catch (error) {
        console.error('Error loading enrollments:', error);
        showMessage('Failed to load enrollments', 'error');
    } finally {
        if (enrollmentsLoading) enrollmentsLoading.style.display = 'none';
    }
}

function displayEnrollments(enrollments) {
    if (!enrollmentsTableBody) return;

    enrollmentsTableBody.innerHTML = '';
    const user = getCurrentUser();

    enrollments.forEach(enrollment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(enrollment.student_name || 'Unknown')}</td>
            <td>${escapeHtml(enrollment.course_name || 'Unknown')}</td>
            <td>${new Date(enrollment.enrolled_at).toLocaleDateString()}</td>
            <td>
                <span class="badge ${enrollment.grade ? 'badge-success' : 'badge-secondary'}">
                    ${enrollment.grade || 'Not Graded'}
                </span>
            </td>
            <td>
                ${user && user.role === 'admin' ?
                `<button class="action-btn delete-btn" onclick="window.deleteEnrollment(${enrollment.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>` : ''}
            </td>
        `;
        enrollmentsTableBody.appendChild(row);
    });
}

export async function loadEnrollmentSelects() {
    try {
        const [studentsRes, coursesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/courses`, { headers: getAuthHeaders() })
        ]);

        if (studentsRes.ok) {
            const students = await studentsRes.json();
            const studentSelect = document.getElementById('enrollStudentSelect');
            if (studentSelect) {
                studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
                students.forEach(s => {
                    studentSelect.innerHTML += `<option value="${s.id}">${escapeHtml(s.full_name)} (${escapeHtml(s.roll_number)})</option>`;
                });
            }
        }

        if (coursesRes.ok) {
            const courses = await coursesRes.json();
            const courseSelect = document.getElementById('enrollCourseSelect');
            if (courseSelect) {
                courseSelect.innerHTML = '<option value="">-- Select Course --</option>';
                courses.forEach(c => {
                    courseSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.course_code)} - ${escapeHtml(c.course_name)}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error loading enrollment options:', error);
    }
}

export async function createEnrollment(studentId, courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ student_id: parseInt(studentId), course_id: parseInt(courseId) })
        });

        if (response.ok) {
            showMessage('Student enrolled successfully!', 'success');
            if (addEnrollmentForm) addEnrollmentForm.style.display = 'none';
            if (enrollmentForm) enrollmentForm.reset();
            loadEnrollments();
        } else {
            const err = await response.json();
            showMessage(err.detail || 'Failed to enroll student', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}

export async function deleteEnrollment(id) {
    if (!confirm('Remove this enrollment?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (response.ok) {
            showMessage('Enrollment removed', 'success');
            loadEnrollments();
        } else {
            showMessage('Failed to remove enrollment', 'error');
        }
    } catch (error) {
        showMessage('Network error', 'error');
    }
}

// Student View: My Courses
export async function loadMyCourses() {
    const myCoursesGrid = document.getElementById('myCoursesGrid');
    const myCoursesLoading = document.getElementById('myCoursesLoading');
    const myCoursesEmpty = document.getElementById('myCoursesEmpty');

    if (!myCoursesGrid) return;

    myCoursesLoading.style.display = 'block';
    myCoursesEmpty.style.display = 'none';
    myCoursesGrid.innerHTML = '';

    try {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || !user.id) {
            myCoursesLoading.style.display = 'none';
            myCoursesEmpty.style.display = 'block';
            myCoursesEmpty.textContent = 'Please log in to view your courses';
            return;
        }

        // Fetch only courses the student is enrolled in
        const response = await fetch(`${API_BASE_URL}/enrollments/student/${user.id}/courses`, { headers: getAuthHeaders() });
        const enrollments = await response.json();

        if (response.ok) {
            if (enrollments.length === 0) {
                myCoursesEmpty.style.display = 'block';
            } else {
                enrollments.forEach(enrollment => {
                    const card = document.createElement('div');
                    card.className = 'stat-card';
                    card.style.cursor = 'pointer';
                    card.innerHTML = `
                        <div class="stat-header">
                            <span>${escapeHtml(enrollment.course_name || 'Unknown Course')}</span>
                            <span class="badge ${enrollment.grade ? 'badge-success' : 'badge-secondary'}">
                                ${enrollment.grade || 'Not Graded'}
                            </span>
                        </div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0.5rem 0;">
                            Enrolled: ${new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </p>
                    `;
                    myCoursesGrid.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        showMessage('Failed to load courses', 'error');
    } finally {
        if (myCoursesLoading) myCoursesLoading.style.display = 'none';
    }
}
