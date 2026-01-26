
import { API_BASE_URL } from '../config.js';
import { getAuthHeaders, handleAuthError } from '../auth.js';
import { showMessage, escapeHtml } from '../utils.js';

// DOM Elements
const studentsTableBody = document.getElementById('studentsTableBody');
const loading = document.getElementById('loading');
const noData = document.getElementById('noData');
const addStudentForm = document.getElementById('addStudentForm');
const studentForm = document.getElementById('studentForm');

export async function loadStudents(showLoginCallback) {
    if (!studentsTableBody) return;

    loading.style.display = 'block';
    noData.style.display = 'none';
    studentsTableBody.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() });
        const students = await response.json();

        if (response.ok) {
            if (students.length === 0) noData.style.display = 'block';
            else displayStudents(students);
        } else {
            if (!(await handleAuthError(response, showLoginCallback))) {
                showMessage('Error loading students', 'error');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to fetch students.', 'error');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

export function displayStudents(students) {
    if (!studentsTableBody) return;
    studentsTableBody.innerHTML = '';
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(student.full_name)}</td>
            <td>${escapeHtml(student.roll_number)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.phone_number)}</td>
            <td>${escapeHtml(student.department)}</td>
            <td>${escapeHtml(student.year_of_study)}</td>
            <td>
                ${user && (user.role === 'admin' || user.role === 'faculty') ?
                `<button class="action-btn delete-btn" onclick="window.deleteStudent(${student.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        studentsTableBody.appendChild(row);
    });
}

export async function createStudent(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showMessage('Student added successfully!', 'success');
            if (addStudentForm) addStudentForm.style.display = 'none';
            if (studentForm) studentForm.reset();
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

export async function deleteStudent(id) {
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
