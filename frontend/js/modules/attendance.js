
import { API_BASE_URL } from '../config.js';
import { getAuthHeaders } from '../auth.js';
import { showMessage, escapeHtml } from '../utils.js';

// DOM Elements - Admin/Faculty
const attendanceTableBody = document.getElementById('attendanceTableBody');
const attendanceLoading = document.getElementById('attendanceLoading');
const attendanceDateInput = document.getElementById('attendanceDate');

// DOM Elements - Student
const myAttendanceTableBody = document.getElementById('myAttendanceTableBody');
const myPresentDays = document.getElementById('myPresentDays');
const myAbsentDays = document.getElementById('myAbsentDays');
const myAttendancePercent = document.getElementById('myAttendancePercent');

// --- Admin/Faculty Attendance ---

export async function loadAttendance() {
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
        if (attendanceLoading) attendanceLoading.style.display = 'none';
    }
}

function displayAttendanceTable(students, attendanceRecords) {
    if (!attendanceTableBody) return;
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
                <button class="action-btn" onclick="window.markStudent(${student.id}, 'Present')" title="Mark Present" style="color: var(--success-color);">
                    <i class="fa-solid fa-check"></i>
                </button>
                <button class="action-btn" onclick="window.markStudent(${student.id}, 'Absent')" title="Mark Absent" style="color: var(--danger-color);">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        `;
        attendanceTableBody.appendChild(row);
    });
}

export async function markStudent(studentId, status) {
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

// --- Student Self-Service Attendance ---

export async function loadMyAttendance() {
    if (!myAttendanceTableBody) return;

    myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

    try {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user || !user.id) {
            myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Please log in to view attendance</td></tr>';
            return;
        }

        // Get current student's attendance only
        const response = await fetch(`${API_BASE_URL}/attendance?student_id=${user.id}`, { headers: getAuthHeaders() });
        const records = await response.json();

        if (response.ok) {
            // Calculate stats
            let present = 0, absent = 0;
            records.forEach(r => {
                if (r.status === 'Present') present++;
                else if (r.status === 'Absent') absent++;
            });

            const total = present + absent;
            const percent = total > 0 ? Math.round((present / total) * 100) : 0;

            if (myPresentDays) myPresentDays.textContent = present;
            if (myAbsentDays) myAbsentDays.textContent = absent;
            if (myAttendancePercent) {
                myAttendancePercent.textContent = `${percent}%`;
                myAttendancePercent.className = `stat-value ${percent >= 75 ? 'text-success' : percent >= 50 ? '' : 'text-danger'}`;
            }

            // Display records
            myAttendanceTableBody.innerHTML = '';
            if (records.length === 0) {
                myAttendanceTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No attendance records found</td></tr>';
            } else {
                records.slice(0, 30).forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${new Date(record.date).toLocaleDateString()}</td>
                        <td>
                            <span class="badge ${record.status === 'Present' ? 'badge-success' : 'badge-danger'}">
                                ${record.status}
                            </span>
                        </td>
                        <td>${escapeHtml(record.remarks || '-')}</td>
                    `;
                    myAttendanceTableBody.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Failed to load attendance</td></tr>';
    }
}
