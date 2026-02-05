
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

    myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Loading attendance...</td></tr>';

    try {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        console.log('Current user:', user);
        
        if (!user || !user.id) {
            myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Please log in to view attendance</td></tr>';
            showMessage('Please log in first', 'error');
            return;
        }

        // Get current student's attendance by user_id - backend will convert to student_id
        console.log(`Fetching attendance for user_id: ${user.id}`);
        const response = await fetch(`${API_BASE_URL}/attendance?user_id=${user.id}`, { 
            headers: getAuthHeaders() 
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            showMessage(`Error loading attendance: ${response.status}`, 'error');
            myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Failed to load attendance records</td></tr>';
            return;
        }

        const records = await response.json();
        console.log('Attendance records:', records);

        // Calculate stats
        let present = 0, absent = 0, late = 0, excused = 0;
        records.forEach(r => {
            if (r.status === 'Present') present++;
            else if (r.status === 'Absent') absent++;
            else if (r.status === 'Late') late++;
            else if (r.status === 'Excused') excused++;
        });

        const total = present + absent + late + excused;
        const percent = total > 0 ? Math.round((present / total) * 100) : 0;

        // Update statistics
        if (myPresentDays) myPresentDays.textContent = present;
        if (myAbsentDays) myAbsentDays.textContent = absent;
        if (myAttendancePercent) {
            myAttendancePercent.textContent = `${percent}%`;
            myAttendancePercent.className = `stat-value ${percent >= 75 ? 'text-success' : percent >= 50 ? '' : 'text-danger'}`;
        }

        console.log(`Stats - Present: ${present}, Absent: ${absent}, Percent: ${percent}%`);

        // Display records
        myAttendanceTableBody.innerHTML = '';
        if (!records || records.length === 0) {
            myAttendanceTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No attendance records found</td></tr>';
        } else {
            // Sort by date (newest first)
            const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedRecords.slice(0, 30).forEach(record => {
                const row = document.createElement('tr');
                const date = new Date(record.date);
                const dateStr = date.toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: '2-digit' 
                });
                
                const statusClass = record.status === 'Present' ? 'badge-success' : 
                                   record.status === 'Absent' ? 'badge-danger' :
                                   record.status === 'Late' ? 'badge-warning' : 'badge-info';
                
                row.innerHTML = `
                    <td>${dateStr}</td>
                    <td>
                        <span class="badge ${statusClass}">
                            ${record.status}
                        </span>
                    </td>
                    <td>${escapeHtml(record.remarks || '-')}</td>
                `;
                myAttendanceTableBody.appendChild(row);
            });
            
            console.log(`Displayed ${Math.min(sortedRecords.length, 30)} attendance records`);
        }
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        console.error('Error details:', error.message, error.stack);
        myAttendanceTableBody.innerHTML = '<tr><td colspan="3">Failed to load attendance. Please try again.</td></tr>';
        showMessage('Failed to load attendance records', 'error');
    }
}
