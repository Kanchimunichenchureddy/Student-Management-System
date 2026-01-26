
import { API_BASE_URL } from '../config.js';
import { getAuthHeaders, getCurrentUser } from '../auth.js';
import { showMessage, escapeHtml } from '../utils.js';

// DOM Elements
const employeesTableBody = document.getElementById('employeesTableBody');
const employeeLoading = document.getElementById('employeeLoading');
const employeeNoData = document.getElementById('employeeNoData');
const addEmployeeForm = document.getElementById('addEmployeeForm');
const employeeForm = document.getElementById('employeeForm');

export async function loadEmployees() {
    if (!employeesTableBody) return;

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
        if (employeeLoading) employeeLoading.style.display = 'none';
    }
}

function displayEmployees(users) {
    if (!employeesTableBody) return;
    employeesTableBody.innerHTML = '';
    const currentUser = getCurrentUser();

    users.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(user.full_name)}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${user.role}</span></td>
            <td>
                ${currentUser && currentUser.role === 'admin' && currentUser.id !== user.id ?
                `<button class="action-btn delete-btn" onclick="window.deleteUser(${user.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
            </td>
        `;
        employeesTableBody.appendChild(row);
    });
}

export async function createEmployee(data) {
    // Reuse register endpoint
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showMessage('Employee added successfully!', 'success');
            if (addEmployeeForm) addEmployeeForm.style.display = 'none';
            if (employeeForm) employeeForm.reset();
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

export async function deleteUser(id) {
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
