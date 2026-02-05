
import { API_BASE_URL } from '../config.js';
import { getAuthHeaders, getCurrentUser, saveUser } from '../auth.js';
import { showMessage, escapeHtml } from '../utils.js';

// Elements
const statStudentsPresent = document.querySelector('.stat-card:nth-child(1) .stat-value');
const statEmployeesPresent = document.querySelector('.stat-card:nth-child(2) .stat-value');
const statFeesCollected = document.querySelector('.stat-card:nth-child(3) .stat-value');
const statStaffAlerts = document.querySelector('.stat-card:nth-child(4) .stat-value');
const chartContainer = document.querySelector('.section-card:nth-child(3) div');

export async function loadDashboardStats() {
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

export function renderCalendar() {
    const calendarWidget = document.querySelector('.calendar-widget');
    if (!calendarWidget) return;

    const date = new Date();
    const currentDay = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    let html = `
        <div class="cal-days">
            <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
        </div>
        <div class="cal-grid">
    `;

    // Basic day filling
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

// fees (Mock)
export function loadFees() {
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
    if (tableContainer) tableContainer.innerHTML = html;
}

// Profile Logic
export function loadProfileData() {
    const user = getCurrentUser();
    if (!user) return;

    // Profile card
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileUsername = document.getElementById('profileUsername');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileRoleBadge = document.getElementById('profileRoleBadge');

    if (profileName) profileName.textContent = user.full_name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileUsername) profileUsername.textContent = user.username;
    if (profileAvatar) profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=4318FF&color=fff&size=120`;
    if (profileRoleBadge) {
        profileRoleBadge.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        profileRoleBadge.className = `badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'faculty' ? 'badge-secondary' : 'badge-success'}`;
    }

    // Edit form
    const editProfileName = document.getElementById('editProfileName');
    const editProfileEmail = document.getElementById('editProfileEmail');
    if (editProfileName) editProfileName.value = user.full_name;
    if (editProfileEmail) editProfileEmail.value = user.email;
}

export async function updateProfile(fullName) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me?full_name=${encodeURIComponent(fullName)}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const updatedUser = await response.json();
            saveUser(updatedUser);
            showMessage('Profile updated successfully!', 'success');

            // Update UI
            const userNameDisplay = document.getElementById('userNameDisplay');
            const headerProfileImg = document.getElementById('headerProfileImg');

            if (userNameDisplay) userNameDisplay.textContent = updatedUser.full_name;
            if (headerProfileImg) headerProfileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedUser.full_name)}&background=random`;
            loadProfileData();
        } else {
            showMessage('Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Network error', 'error');
    }
}
