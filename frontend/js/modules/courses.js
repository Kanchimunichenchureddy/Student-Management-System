
import { API_BASE_URL } from '../config.js';
import { getAuthHeaders, getCurrentUser } from '../auth.js';
import { showMessage, escapeHtml } from '../utils.js';

// DOM Elements
const coursesTableBody = document.getElementById('coursesTableBody');
const courseLoading = document.getElementById('courseLoading');
const courseNoData = document.getElementById('courseNoData');
const addCourseForm = document.getElementById('addCourseForm');
const courseForm = document.getElementById('courseForm');

export async function loadCourses() {
    if (!coursesTableBody) return;

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
        if (courseLoading) courseLoading.style.display = 'none';
    }
}

function displayCourses(courses) {
    if (!coursesTableBody) return;
    coursesTableBody.innerHTML = '';
    const user = getCurrentUser();

    courses.forEach((course, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(course.course_code)}</td>
            <td>${escapeHtml(course.course_name)}</td>
            <td>${course.credits}</td>
            <td>${escapeHtml(course.department)}</td>
             <td>
                ${user && (user.role === 'admin' || (user.role === 'faculty' && course.instructor_id === user.id)) ?
                `<button class="action-btn delete-btn" onclick="window.deleteCourse(${course.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        coursesTableBody.appendChild(row);
    });
}

export async function createCourse(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        const data = await response.json();

        if (response.ok) {
            showMessage('Course added!', 'success');
            if (addCourseForm) addCourseForm.style.display = 'none';
            if (courseForm) courseForm.reset();
            loadCourses();
        } else {
            showMessage(data.detail || 'Error creating course', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}

export async function deleteCourse(id) {
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
