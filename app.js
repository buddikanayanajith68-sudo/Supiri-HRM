// Initialize Dexie
const db = new Dexie('SupiriHRMApp');
db.version(4).stores({
    employees: '++id, name, email, phone, designation, department, status, createdAt',
    attendance: '++id, empId, date, monthStr, yearStr'
});
db.version(5).stores({
    employees: '++id, name, email, phone, designation, department, status, createdAt',
    attendance: '++id, empId, date, monthStr, yearStr',
    leaves: '++id, empId, date, status'
});

// View Navigation Logic
function navigate(viewName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    // Show target view
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('text-slate-300');
    });
    
    const activeBtn = document.getElementById(`nav-${viewName}`);
    activeBtn.classList.remove('text-slate-300');
    activeBtn.classList.add('bg-indigo-600', 'text-white');

    // Update Header Title
    document.getElementById('page-title').innerText = viewName.charAt(0).toUpperCase() + viewName.slice(1);

    // Refresh Data
    if(viewName === 'dashboard') loadDashboard();
    if(viewName === 'employees') loadEmployees();
    if(viewName === 'attendance') { populateEmployeeSelects(); loadAttendance(); document.getElementById('att-date').valueAsDate = new Date(); }
    if(viewName === 'leaves') { populateEmployeeSelects(); loadLeaves(); document.getElementById('leave-date').valueAsDate = new Date(); }
    if(viewName === 'reports') { populateEmployeeSelects(); document.getElementById('report-month').value = new Date().toISOString().substring(0,7); }
}

// Modal Logic
const modal = document.getElementById('employee-modal');
const modalContent = document.getElementById('modal-content');

function openModal(id = null) {
    document.getElementById('employee-form').reset();
    document.getElementById('emp-id').value = '';
    document.getElementById('emp-photo-preview').src = 'https://ui-avatars.com/api/?name=New&background=random&color=fff&rounded=true&size=128';
    document.getElementById('emp-photo-base64').value = '';
    document.getElementById('emp-birthday').value = '';
    document.getElementById('emp-join-date').value = '';
    document.getElementById('modal-title').innerHTML = '<i class="ph ph-plus-circle text-indigo-600"></i> Add New Employee';

    if (id) {
        document.getElementById('modal-title').innerHTML = '<i class="ph ph-pencil-simple text-indigo-600"></i> Edit Employee';
        db.employees.get(id).then(emp => {
            document.getElementById('emp-id').value = emp.id;
            document.getElementById('emp-name').value = emp.name;
            document.getElementById('emp-email').value = emp.email;
            document.getElementById('emp-phone').value = emp.phone;
            document.getElementById('emp-designation').value = emp.designation;
            document.getElementById('emp-department').value = emp.department;
            if (emp.birthday) document.getElementById('emp-birthday').value = emp.birthday;
            if (emp.joinDate) document.getElementById('emp-join-date').value = emp.joinDate;
            document.querySelector(`input[name="emp-status"][value="${emp.status}"]`).checked = true;
            if (emp.photo) {
                document.getElementById('emp-photo-preview').src = emp.photo;
                document.getElementById('emp-photo-base64').value = emp.photo;
            } else {
                document.getElementById('emp-photo-preview').src = getAvatar(emp.name);
                document.getElementById('emp-photo-base64').value = '';
            }
        });
    }

    modal.classList.remove('opacity-0', 'pointer-events-none');
    modalContent.classList.remove('scale-95');
}

function closeModal() {
    modal.classList.add('opacity-0', 'pointer-events-none');
    modalContent.classList.add('scale-95');
}

// Search Logic
document.getElementById('search-input')?.addEventListener('input', (e) => {
    loadEmployees(e.target.value);
});

// Image Upload Preview Logic
document.getElementById('emp-photo')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('emp-photo-preview').src = event.target.result;
            document.getElementById('emp-photo-base64').value = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Form Submission
document.getElementById('employee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('emp-id').value;
    const empData = {
        name: document.getElementById('emp-name').value,
        email: document.getElementById('emp-email').value,
        phone: document.getElementById('emp-phone').value,
        designation: document.getElementById('emp-designation').value,
        department: document.getElementById('emp-department').value,
        birthday: document.getElementById('emp-birthday').value,
        joinDate: document.getElementById('emp-join-date').value,
        status: document.querySelector('input[name="emp-status"]:checked').value,
        photo: document.getElementById('emp-photo-base64').value
    };

    try {
        if (id) {
            await db.employees.update(parseInt(id), empData);
            Swal.fire({ icon: 'success', title: 'Updated!', text: 'Employee details updated.', showConfirmButton: false, timer: 1500 });
        } else {
            empData.createdAt = new Date().toISOString();
            await db.employees.add(empData);
            Swal.fire({ icon: 'success', title: 'Added!', text: 'New employee created.', showConfirmButton: false, timer: 1500 });
        }
        closeModal();
        loadEmployees(); // Refresh employees grid
        if (!document.getElementById('view-dashboard').classList.contains('hidden')) {
             loadDashboard();
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
});

// Delete Employee
async function deleteEmployee(id) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        await db.employees.delete(id);
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Employee has been deleted.', showConfirmButton: false, timer: 1500 });
        loadEmployees();
        loadDashboard();
    }
}

// Generate Avatar SVG
function getAvatar(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&rounded=true&size=128`;
}

// Load Employees Table
async function loadEmployees(searchQuery = '') {
    let employees = await db.employees.toArray();
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        employees = employees.filter(e => 
            e.name.toLowerCase().includes(q) || 
            e.email.toLowerCase().includes(q) ||
            e.department.toLowerCase().includes(q) ||
            e.designation.toLowerCase().includes(q)
        );
    }
    
    // Sort by latest first
    employees.sort((a,b) => b.id - a.id);

    const tbody = document.getElementById('employees-table');
    const emptyState = document.getElementById('empty-state');

    if(!tbody) return;

    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        emptyState.classList.remove('hidden');
        tbody.parentElement.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        tbody.parentElement.classList.remove('hidden');
        
        employees.forEach(emp => {
            const statusColor = emp.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200';
            
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition group';
            tr.innerHTML = `
                <td class="py-4 px-6 border-b border-slate-100">
                    <span class="text-sm font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-md">${String(emp.id).padStart(4, '0')}</span>
                </td>
                <td class="py-4 px-6 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <img src="${emp.photo || getAvatar(emp.name)}" class="w-10 h-10 rounded-full object-cover shadow-sm">
                        <div class="font-medium text-slate-800">${emp.name}</div>
                    </div>
                </td>
                <td class="py-4 px-6 border-b border-slate-100">
                    <div class="text-sm text-slate-800">${emp.email}</div>
                    <div class="text-xs text-slate-500">${emp.phone}</div>
                </td>
                <td class="py-4 px-6 border-b border-slate-100">
                    <div class="text-sm font-medium text-slate-800">${emp.designation}</div>
                    <div class="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded-full mt-1">${emp.department}</div>
                </td>
                <td class="py-4 px-6 border-b border-slate-100">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}">
                        ${emp.status}
                    </span>
                </td>
                <td class="py-4 px-6 border-b border-slate-100 text-right">
                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openModal(${emp.id})" class="h-8 w-8 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                            <i class="ph ph-pencil-simple text-lg"></i>
                        </button>
                        <button onclick="deleteEmployee(${emp.id})" class="h-8 w-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <i class="ph ph-trash text-lg"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Notifications Logic
async function loadNotifications() {
    const employees = await db.employees.where('status').equals('Active').toArray();
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    
    let notifications = [];

    employees.forEach(emp => {
        if (emp.birthday) {
            const bdate = new Date(emp.birthday);
            if (bdate.getMonth() + 1 === todayMonth && bdate.getDate() === todayDate) {
                notifications.push({
                    type: 'birthday',
                    message: `🎉 Today is ${emp.name}'s Birthday!`,
                    icon: 'ph-cake',
                    color: 'text-pink-600',
                    bg: 'bg-pink-100'
                });
            }
        }
        if (emp.joinDate) {
            const jdate = new Date(emp.joinDate);
            if (jdate.getMonth() + 1 === todayMonth && jdate.getDate() === todayDate && jdate.getFullYear() !== today.getFullYear()) {
                const years = today.getFullYear() - jdate.getFullYear();
                notifications.push({
                    type: 'anniversary',
                    message: `🎊 ${emp.name} completes ${years} year(s) today!`,
                    icon: 'ph-confetti',
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-100'
                });
            }
        }
    });

    const badge = document.getElementById('notif-badge');
    const list = document.getElementById('notif-list');
    
    if (notifications.length > 0) {
        if (badge) badge.classList.remove('hidden');
        if (list) {
            list.innerHTML = notifications.map(n => `
                <div class="px-4 py-3 flex gap-3 hover:bg-slate-50 transition cursor-default border-b border-slate-50">
                    <div class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${n.bg} ${n.color}">
                        <i class="ph ${n.icon} text-xl"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-slate-800">${n.message}</p>
                        <p class="text-xs text-slate-400 mt-0.5">Today</p>
                    </div>
                </div>
            `).join('');
        }
    } else {
        if (badge) badge.classList.add('hidden');
        if (list) {
            list.innerHTML = `
                <div class="px-4 py-6 text-center text-slate-500">
                    <i class="ph ph-bell-slash text-3xl text-slate-300 mb-2"></i>
                    <p class="text-sm font-medium">No new notifications</p>
                </div>
            `;
        }
    }
}

// Load Dashboard Data
async function loadDashboard() {
    await loadNotifications();
    
    const employees = await db.employees.toArray();
    
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Active').length;
    
    // Unique departments
    const depts = new Set(employees.map(e => e.department));
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-active').innerText = active;
    document.getElementById('stat-depts').innerText = depts.size;

    // Load recent (last 5)
    employees.sort((a,b) => b.id - a.id);
    const recent = employees.slice(0, 5);
    const tbody = document.getElementById('recent-employees-table');
    if(!tbody) return;

    tbody.innerHTML = '';
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-500 text-sm">No recent employees</td></tr>';
    } else {
        recent.forEach(emp => {
            const statusColor = emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-3 px-4 border-b border-slate-100">
                    <span class="text-sm font-mono text-indigo-600 font-semibold">${String(emp.id).padStart(4, '0')}</span>
                </td>
                <td class="py-3 px-4 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <img src="${emp.photo || getAvatar(emp.name)}" class="w-8 h-8 rounded-full object-cover">
                        <span class="font-medium text-sm text-slate-800">${emp.name}</span>
                    </div>
                </td>
                <td class="py-3 px-4 border-b border-slate-100 text-sm text-slate-600">${emp.designation}</td>
                <td class="py-3 px-4 border-b border-slate-100 text-sm text-slate-600">${emp.department}</td>
                <td class="py-3 px-4 border-b border-slate-100">
                    <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                        ${emp.status}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    loadEmployees(); // Pre-load to initialize UI easily.
    renderCalendar();

    // Toggle Notifications
    document.getElementById('notif-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notif-dropdown')?.classList.toggle('hidden');
    });
    document.getElementById('notif-dropdown')?.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => {
        document.getElementById('notif-dropdown')?.classList.add('hidden');
    });
    
    // Add some initial mock data if empty
    db.employees.count().then(count => {
        if (count === 0) {
            db.employees.bulkAdd([
                { name: 'Kamal Perera', email: 'kamal@example.com', phone: '0712345678', designation: 'Software Engineer', department: 'IT', inTime: '08:30', outTime: '17:30', status: 'Active', createdAt: new Date().toISOString() },
                { name: 'Nimal Silva', email: 'nimal@example.com', phone: '0777654321', designation: 'HR Executive', department: 'HR', inTime: '09:00', outTime: '18:00', status: 'Active', createdAt: new Date().toISOString() },
                { name: 'Sunil Shantha', email: 'sunil@example.com', phone: '0701122334', designation: 'Marketing Manager', department: 'Marketing', inTime: '08:00', outTime: '17:00', status: 'Inactive', createdAt: new Date().toISOString() }
            ]).then(() => {
                loadDashboard();
                loadEmployees();
            });
        }
    });
});

// Populate Employee Dropdowns
async function populateEmployeeSelects() {
    const employees = await db.employees.toArray();
    const attSelect = document.getElementById('att-emp-id');
    const repSelect = document.getElementById('report-emp-id');
    const leaveSelect = document.getElementById('leave-emp-id');
    let attHtml = '<option value="">Select Employee</option>';
    let repHtml = '<option value="ALL">All Employees</option>';
    let leaveHtml = '<option value="">Select Employee</option>';
    employees.forEach(emp => {
        const option = `<option value="${emp.id}">${emp.name} (${emp.designation})</option>`;
        attHtml += option;
        repHtml += option;
        leaveHtml += option;
    });
    if(attSelect) attSelect.innerHTML = attHtml;
    if(repSelect) repSelect.innerHTML = repHtml;
    if(leaveSelect) leaveSelect.innerHTML = leaveHtml;
}

function toggleAttType() {
    const type = document.getElementById('att-type').value;
    const timeGroup = document.getElementById('att-time-group');
    const leaveGroup = document.getElementById('att-leave-group');
    
    if (type === 'Leave') {
        timeGroup.classList.add('hidden');
        leaveGroup.classList.remove('hidden');
        document.getElementById('att-in').required = false;
        document.getElementById('att-out').required = false;
        document.getElementById('att-reason').required = true;
    } else {
        timeGroup.classList.remove('hidden');
        leaveGroup.classList.add('hidden');
        document.getElementById('att-in').required = true;
        document.getElementById('att-out').required = true;
        document.getElementById('att-reason').required = false;
    }
}

document.getElementById('attendance-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formId = document.getElementById('att-id')?.value;
    const type = document.getElementById('att-type')?.value || 'Present';
    const empId = parseInt(document.getElementById('att-emp-id').value);
    const date = document.getElementById('att-date').value;
    
    try {
        const existing = await db.attendance.where({ empId }).toArray();
        const conflict = existing.find(r => r.date === date && (!formId || r.id !== parseInt(formId)));
        
        if(conflict) {
            Swal.fire({ icon: 'warning', title: 'Already Logged!', text: 'Attendance/Leave for this employee has already been logged for this date.', showConfirmButton: true });
            return;
        }

        const monthStr = date.substring(0, 7);
        const yearStr = date.substring(0, 4);

        if (type === 'Leave') {
            const reason = document.getElementById('att-reason').value;
            if(!empId || !date || !reason) return;
            
            if(formId) {
                await db.attendance.update(parseInt(formId), { empId, date, inTime: 'LEAVE', outTime: reason, hours: 0, monthStr, yearStr });
                Swal.fire({ icon: 'success', title: 'Updated!', text: 'Manual Leave updated successfully.', showConfirmButton: false, timer: 1500 });
            } else {
                await db.attendance.add({ empId, date, inTime: 'LEAVE', outTime: reason, hours: 0, monthStr, yearStr });
                Swal.fire({ icon: 'success', title: 'Logged!', text: 'Manual Leave logged successfully.', showConfirmButton: false, timer: 1500 });
            }
        } else {
            const inTime = document.getElementById('att-in').value;
            const outTime = document.getElementById('att-out').value;
            if(!empId || !date || !inTime || !outTime) return;
            
            const inDate = new Date(`1970-01-01T${inTime}:00`);
            const outDate = new Date(`1970-01-01T${outTime}:00`);
            let diff = (outDate - inDate) / 1000 / 60 / 60;
            if (diff < 0) diff += 24;
            const hours = Math.round(diff * 100) / 100;
        
            if(formId) {
                await db.attendance.update(parseInt(formId), { empId, date, inTime, outTime, hours, monthStr, yearStr });
                Swal.fire({ icon: 'success', title: 'Updated!', text: 'Attendance updated successfully.', showConfirmButton: false, timer: 1500 });
            } else {
                await db.attendance.add({ empId, date, inTime, outTime, hours, monthStr, yearStr });
                Swal.fire({ icon: 'success', title: 'Logged!', text: 'Attendance logged successfully.', showConfirmButton: false, timer: 1500 });
            }
        }
        
        document.getElementById('attendance-form').reset();
        document.getElementById('att-id').value = '';
        document.getElementById('att-type').value = 'Present';
        toggleAttType();
        document.getElementById('att-form-title').innerText = 'Log Attendance';
        loadAttendance();
    } catch(err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
});

async function editAttendance(id) {
    const rec = await db.attendance.get(id);
    if(rec) {
        document.getElementById('att-id').value = rec.id;
        document.getElementById('att-emp-id').value = rec.empId;
        document.getElementById('att-date').value = rec.date;
        
        if (rec.inTime === 'LEAVE') {
            document.getElementById('att-type').value = 'Leave';
            toggleAttType();
            document.getElementById('att-reason').value = rec.outTime;
        } else {
            document.getElementById('att-type').value = 'Present';
            toggleAttType();
            document.getElementById('att-in').value = rec.inTime || '';
            document.getElementById('att-out').value = rec.outTime || '';
        }
        
        document.getElementById('att-form-title').innerText = 'Edit Record';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function loadAttendance() {
    const records = await db.attendance.toArray();
    const employees = await db.employees.toArray();
    const empMap = {};
    employees.forEach(e => empMap[e.id] = e);
    records.sort((a,b) => new Date(b.date) - new Date(a.date));
    const recent = records.slice(0, 10);
    const tbody = document.getElementById('attendance-table');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-500 text-sm">No records added yet.</td></tr>';
        return;
    }
    recent.forEach(rec => {
        const emp = empMap[rec.empId];
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = `
            <td class="py-3 px-6 text-sm">${rec.date}</td>
            <td class="py-3 px-6 text-sm font-mono text-indigo-600 font-semibold">${emp ? `${String(emp.id).padStart(4, '0')}` : '-'}</td>
            <td class="py-3 px-6 text-sm font-medium text-slate-800">${emp ? emp.name : 'Deleted'}</td>
            <td class="py-3 px-6 text-sm text-slate-500">
                ${rec.inTime === 'LEAVE' ? `<span class="text-orange-500 font-bold mb-1">Leave:</span> ${rec.outTime}` : `${rec.inTime || '-'} to ${rec.outTime || '-'}`}
            </td>
            <td class="py-3 px-6 text-sm"><span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-semibold">${rec.hours} hrs</span></td>
            <td class="py-3 px-6 text-right">
                <button onclick="editAttendance(${rec.id})" class="text-indigo-500 hover:text-indigo-700 transition mr-3" title="Edit"><i class="ph ph-pencil-simple text-lg"></i></button>
                <button onclick="deleteAttendance(${rec.id})" class="text-red-500 hover:text-red-700 transition" title="Delete"><i class="ph ph-trash text-lg"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteAttendance(id) {
    const result = await Swal.fire({ title: 'Are you sure?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete!' });
    if(result.isConfirmed) {
        await db.attendance.delete(id);
        loadAttendance();
    }
}

function toggleReportFilters() {
    const type = document.getElementById('report-type').value;
    if(type === 'monthly') {
        document.getElementById('report-month-filter').classList.remove('hidden');
        document.getElementById('report-year-filter').classList.add('hidden');
    } else {
        document.getElementById('report-month-filter').classList.add('hidden');
        document.getElementById('report-year-filter').classList.remove('hidden');
        document.getElementById('report-year').value = new Date().getFullYear();
    }
}

async function generateReport() {
    const empIdVal = document.getElementById('report-emp-id').value;
    const type = document.getElementById('report-type').value;
    let filterVal = '';
    let periodText = '';
    let standardDays = 0;
    
    if(type === 'monthly') {
        filterVal = document.getElementById('report-month').value;
        if(!filterVal) return Swal.fire('Oops', 'Please select a month', 'error');
        periodText = 'Month of ' + filterVal;
        
        const [year, month] = filterVal.split('-');
        const holidays = await getSLHolidays(year);
        
        const daysInMonth = new Date(year, month, 0).getDate();
        for(let d=1; d<=daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const date = new Date(year, parseInt(month) - 1, d);
            const isHoliday = holidays.includes(dateStr);
            
            if(!isHoliday) {
                if(date.getDay() >= 1 && date.getDay() <= 5) standardDays += 1;
                else if(date.getDay() === 6) standardDays += 0.5;
            }
        }
    } else {
        filterVal = document.getElementById('report-year').value;
        if(!filterVal) return Swal.fire('Oops', 'Please enter a year', 'error');
        periodText = 'Year of ' + filterVal;
        
        const holidays = await getSLHolidays(filterVal);
        
        for(let m=0; m<12; m++) {
            const daysInMonth = new Date(filterVal, m + 1, 0).getDate();
            for(let d=1; d<=daysInMonth; d++) {
                const dateStr = `${filterVal}-${String(m+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const date = new Date(filterVal, m, d);
                const isHoliday = holidays.includes(dateStr);
                
                if(!isHoliday) {
                    if(date.getDay() >= 1 && date.getDay() <= 5) standardDays += 1;
                    else if(date.getDay() === 6) standardDays += 0.5;
                }
            }
        }
    }
    
    let query = db.attendance;
    if(type === 'monthly') query = query.where('monthStr').equals(filterVal);
    else query = query.where('yearStr').equals(filterVal);
    let records = await query.toArray();
    const employees = await db.employees.toArray();
    
    if(empIdVal !== 'ALL') {
        records = records.filter(r => r.empId === parseInt(empIdVal));
    }
    
    // Filter out Manual Leaves from Working Days
    let actualWorkLogs = records.filter(r => r.inTime !== 'LEAVE');
    let manualLeavesCount = records.length - actualWorkLogs.length;

    // Fetch Approved requests from db.leaves
    let allLeaveRequests = await db.leaves.where({ status: 'Approved' }).toArray();
    let approvedRequests = allLeaveRequests.filter(r => r.date.startsWith(filterVal));
    if (empIdVal !== 'ALL') {
        approvedRequests = approvedRequests.filter(r => r.empId === parseInt(empIdVal));
    }
    let requestedLeavesCount = approvedRequests.length;

    const totalHours = actualWorkLogs.reduce((sum, rec) => sum + rec.hours, 0);
    let totalWorkingDays = actualWorkLogs.length;
    let totalLeaves = manualLeavesCount + requestedLeavesCount;
    
    document.getElementById('report-total-hours').innerText = totalHours.toFixed(2) + ' hrs';
    document.getElementById('report-total-days').innerText = totalWorkingDays;
    document.getElementById('report-total-leaves').innerText = totalLeaves;
    document.getElementById('report-period-text').innerText = periodText;
    const tbody = document.getElementById('report-details-table');
    const emptyState = document.getElementById('report-empty-state');
    const empMap = {};
    employees.forEach(e => empMap[e.id] = e);
    tbody.innerHTML = '';
    records.sort((a,b) => new Date(a.date) - new Date(b.date));
    if(records.length === 0) emptyState.classList.remove('hidden');
    else {
        emptyState.classList.add('hidden');
        records.forEach(rec => {
            const emp = empMap[rec.empId];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-2 px-6 text-sm text-slate-600">${rec.date}</td>
                <td class="py-2 px-6 text-sm font-mono text-indigo-600 font-semibold">${emp ? `${String(emp.id).padStart(4, '0')}` : '-'}</td>
                <td class="py-2 px-6 text-sm font-medium text-slate-800">${emp ? emp.name : 'Unknown'}</td>
                <td class="py-2 px-6 text-sm font-semibold">${rec.hours} hrs</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// --- Leaves Logic ---
document.getElementById('leave-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = parseInt(document.getElementById('leave-emp-id').value);
    const date = document.getElementById('leave-date').value;
    const reason = document.getElementById('leave-reason').value;
    if(!empId || !date || !reason) return;
    
    try {
        await db.leaves.add({ empId, date, reason, status: 'Pending' });
        Swal.fire({ icon: 'success', title: 'Submitted', text: 'Leave request submitted.', timer: 1500, showConfirmButton: false });
        document.getElementById('leave-form').reset();
        document.getElementById('leave-date').valueAsDate = new Date();
        loadLeaves();
    } catch(err) {
        console.error(err);
    }
});

async function loadLeaves() {
    const records = await db.leaves.toArray();
    const employees = await db.employees.toArray();
    const empMap = {};
    employees.forEach(e => empMap[e.id] = e);
    
    const tbody = document.getElementById('leaves-table');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    records.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    records.forEach(rec => {
        const emp = empMap[rec.empId];
        const tr = document.createElement('tr');
        
        let statusClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
        if(rec.status === 'Approved') statusClass = 'bg-green-50 text-green-700 border-green-200';
        if(rec.status === 'Rejected') statusClass = 'bg-red-50 text-red-700 border-red-200';

        tr.innerHTML = `
            <td class="py-3 px-6 text-sm font-mono text-indigo-600 font-semibold">${emp ? `${String(emp.id).padStart(4, '0')}` : '-'}</td>
            <td class="py-3 px-6 text-sm font-medium text-slate-800">${emp ? emp.name : 'Unknown'}</td>
            <td class="py-3 px-6 text-sm text-slate-600">${rec.date}</td>
            <td class="py-3 px-6 text-sm text-slate-600">${rec.reason}</td>
            <td class="py-3 px-6"><span class="px-3 py-1 rounded-full text-xs font-bold border ${statusClass}">${rec.status}</span></td>
            <td class="py-3 px-6 text-right space-x-2">
                ${rec.status === 'Pending' ? `
                <button onclick="updateLeaveStatus(${rec.id}, 'Approved')" class="text-green-600 hover:bg-green-50 p-1.5 rounded transition" title="Approve"><i class="ph ph-check-circle"></i></button>
                <button onclick="updateLeaveStatus(${rec.id}, 'Rejected')" class="text-red-600 hover:bg-red-50 p-1.5 rounded transition" title="Reject"><i class="ph ph-x-circle"></i></button>
                ` : ''}
                <button onclick="deleteLeave(${rec.id})" class="text-slate-400 hover:bg-slate-50 hover:text-red-500 p-1.5 rounded transition" title="Delete"><i class="ph ph-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateLeaveStatus(id, status) {
    await db.leaves.update(id, { status });
    loadLeaves();
}

async function deleteLeave(id) {
    const result = await Swal.fire({ title: 'Delete Request?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete!' });
    if(result.isConfirmed) {
        await db.leaves.delete(id);
        loadLeaves();
    }
}

// --- Calendar & Holidays Logic ---
const slHolidaysCache = {};

async function getSLHolidays(year) {
    if(slHolidaysCache[year]) return slHolidaysCache[year];
    try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/LK`);
        if(res.ok) {
            const data = await res.json();
            const holidayDates = data.map(h => h.date); 
            slHolidaysCache[year] = holidayDates;
            return holidayDates;
        }
    } catch(err) {
        console.error("Failed to fetch holidays", err);
    }
    // Fallback static dates if API fails or is blocked
    const fallback = [
        `${year}-01-14`, `${year}-02-04`, `${year}-04-13`, `${year}-04-14`,
        `${year}-05-01`, `${year}-12-25`
    ];
    slHolidaysCache[year] = fallback;
    return fallback;
}

let currentCalDate = new Date();

async function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('cal-month-year').innerText = `${monthNames[month]} ${year}`;
    
    const holidays = await getSLHolidays(year);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    grid.innerHTML = '';
    
    for(let i=0; i<firstDay; i++) {
        grid.innerHTML += `<div class="p-2"></div>`;
    }
    
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isHoliday = holidays.includes(dateStr);
        const dayOfWeek = new Date(year, month, d).getDay();
        const isSunday = dayOfWeek === 0;
        
        let bgClass = "text-slate-700 hover:bg-slate-50 rounded-lg";
        let title = "";
        
        if (isHoliday || isSunday) {
            bgClass = "bg-red-50 text-red-600 font-medium rounded-lg";
            title = isHoliday ? "Public/Mercantile Holiday" : "Sunday";
        } else if (dayOfWeek === 6) {
            bgClass = "bg-orange-50 text-orange-600 font-medium rounded-lg"; 
            title = "Half Day (9:00 AM - 1:00 PM)";
        }
        
        if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) {
            bgClass = "bg-indigo-600 text-white font-bold rounded-lg shadow-sm";
        }
        
        grid.innerHTML += `<div class="p-1.5 flex items-center justify-center h-8 transition cursor-default ${bgClass}" title="${title}">${d}</div>`;
    }
}

function changeMonth(offset) {
    currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    renderCalendar();
}
