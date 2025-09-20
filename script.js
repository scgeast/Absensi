// Data matrik untuk shift
const shiftMatrix = {
    "Dispatcher": {
        "1": { name: "Pagi", checkIn: "07:00", checkOut: "15:00", hours: "07:00" },
        "2": { name: "Siang", checkIn: "15:00", checkOut: "23:00", hours: "07:00" },
        "3": { name: "Malam", checkIn: "23:00", checkOut: "07:00", hours: "08:00" },
        "11": { name: "Pjk pagi", checkIn: "07:00", checkOut: "12:00", hours: "05:00" },
        "22": { name: "Pjk Siang", checkIn: "15:00", checkOut: "20:00", hours: "05:00" },
        "C": { name: "Cuti", checkIn: "", checkOut: "", hours: "" },
        "O": { name: "Off", checkIn: "", checkOut: "", hours: "" }
    },
    "Booking": {
        "1": { name: "Pagi", checkIn: "08:00", checkOut: "16:00", hours: "07:00" },
        "2": { name: "Siang", checkIn: "16:00", checkOut: "24:00", hours: "08:00" },
        "3": { name: "Malam", checkIn: "00:00", checkOut: "08:00", hours: "08:00" },
        "11": { name: "Pjk pagi", checkIn: "08:00", checkOut: "13:00", hours: "05:00" },
        "22": { name: "Pjk Siang", checkIn: "16:00", checkOut: "21:00", hours: "05:00" },
        "C": { name: "Cuti", checkIn: "", checkOut: "", hours: "" },
        "O": { name: "Off", checkIn: "", checkOut: "", hours: "" }
    }
};

// Data awal karyawan
const initialEmployees = [
    { area: "CDC East", name: "Fahmi Ardiansyal", position: "Dispatcher" },
    { area: "CDC East", name: "Agung Setyawan", position: "Dispatcher" },
    { area: "CDC East", name: "Drajat Triono", position: "Dispatcher" },
    { area: "CDC East", name: "Wiyanto", position: "Dispatcher" },
    { area: "CDC East", name: "Nur Fauziah", position: "Booking" }
];

// Variabel global untuk menyimpan data
let absensiData = [];
let absenTabelData = [];
let dateRange = [];
let remarksData = {};
let overtimeData = {};
let currentTab = "entry";

// Fungsi untuk memformat tanggal
function formatDate(date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateForShift(date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateForHeader(date) {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[date.getDay()];
    return `${dayName} ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

// Fungsi untuk mengupdate warna sel berdasarkan nilai shift
function updateShiftColor(input) {
    const value = input.value.toUpperCase();
    const td = input.parentElement;

    td.classList.remove("shift-1", "shift-2", "shift-3", "shift-11", "shift-22", "shift-C", "shift-O");

    if (value === "1") td.classList.add("shift-1");
    else if (value === "2") td.classList.add("shift-2");
    else if (value === "3") td.classList.add("shift-3");
    else if (value === "11") td.classList.add("shift-11");
    else if (value === "22") td.classList.add("shift-22");
    else if (value === "C") td.classList.add("shift-C");
    else if (value === "O") td.classList.add("shift-O");

    saveDataToLocalStorage();
    generateOutputTable();
    generateOvertimeTable();
}

// Fungsi untuk membuat input field dapat diedit
function makeEditable(input) {
    input.readOnly = false;
    input.focus();
    input.select();
    
    input.addEventListener('blur', function() {
        this.readOnly = true;
        saveDataToLocalStorage();
        updateEmployeeDropdown();
    }, { once: true });
}

// Fungsi untuk menghapus baris (hanya di tab entry)
function deleteRow(button) {
    if (currentTab === "absen-tabel") return; // Tidak boleh hapus di tab absen-tabel
    
    const row = button.closest('tr');
    const name = row.querySelector('.name-input').value;
    const position = row.querySelector('.position-input').value;
    
    absensiData = absensiData.filter(emp => !(emp.name === name && emp.position === position));
    
    for (const key in remarksData) {
        if (key.includes(`${name}-${position}`)) {
            delete remarksData[key];
        }
    }
    
    for (const key in overtimeData) {
        if (key.includes(`${name}-${position}`)) {
            delete overtimeData[key];
        }
    }
    
    row.remove();
    saveDataToLocalStorage();
    generateOutputTable();
    generateOvertimeTable();
    updateEmployeeDropdown();
}

// Fungsi untuk mengedit remarks
function editRemarks(key) {
    const currentValue = remarksData[key] || '';
    const newValue = prompt('Edit Remarks:', currentValue);
    
    if (newValue !== null) {
        remarksData[key] = newValue;
        saveDataToLocalStorage();
        generateOutputTable();
    }
}

// Fungsi untuk menyimpan data overtime
function saveOvertimeData(key, input) {
    if (!overtimeData[key]) {
        overtimeData[key] = {};
    }
    
    const field = input.classList[0].replace(/-/g, '');
    overtimeData[key][field] = input.value;
    
    localStorage.setItem('overtimeData', JSON.stringify(overtimeData));
}

// Fungsi untuk menghitung overtime
function calculateOvertime(input, key) {
    const row = input.closest('tr');
    const shiftCheckOut = row.querySelector('td:nth-child(8)').textContent;
    const actualCheckOut = row.querySelector('.actual-check-out').value;
    const overTimeInput = row.querySelector('.over-time');
    
    if (shiftCheckOut && actualCheckOut) {
        const [shiftHours, shiftMinutes] = shiftCheckOut.split(':').map(Number);
        const [actualHours, actualMinutes] = actualCheckOut.split(':').map(Number);
        
        const shiftTotalMinutes = shiftHours * 60 + shiftMinutes;
        const actualTotalMinutes = actualHours * 60 + actualMinutes;
        
        let diffMinutes = actualTotalMinutes - shiftTotalMinutes;
        
        if (diffMinutes < 0) {
            diffMinutes += 24 * 60;
        }
        
        if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            overTimeInput.value = `${hours}:${mins.toString().padStart(2, '0')}`;
        } else {
            overTimeInput.value = "00:00";
        }
    }
    
    saveOvertimeData(key, overTimeInput);
}

// Fungsi untuk menghitung Rmc - Shift Check Out
function calculateRmcShiftOut(input, key) {
    const row = input.closest('tr');
    const shiftCheckOut = row.querySelector('td:nth-child(8)').textContent;
    const cekRmc = row.querySelector('.cek-rmc').value;
    const rmcShiftOutInput = row.querySelector('.rmc-shift-out');
    
    if (shiftCheckOut && cekRmc) {
        const [shiftHours, shiftMinutes] = shiftCheckOut.split(':').map(Number);
        const [rmcHours, rmcMinutes] = cekRmc.split(':').map(Number);
        
        const shiftTotalMinutes = shiftHours * 60 + shiftMinutes;
        const rmcTotalMinutes = rmcHours * 60 + rmcMinutes;
        
        let diffMinutes = rmcTotalMinutes - shiftTotalMinutes;
        
        if (diffMinutes < 0) {
            diffMinutes += 24 * 60;
        }
        
        if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60);
            const mins = diffMinutes % 60;
            rmcShiftOutInput.value = `${hours}:${mins.toString().padStart(2, '0')}`;
        } else {
            rmcShiftOutInput.value = "00:00";
        }
    }
    
    saveOvertimeData(key, rmcShiftOutInput);
}

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('startDate').valueAsDate = firstDayOfMonth;
    document.getElementById('endDate').valueAsDate = today;
    
    initCollapsible();
    loadDataFromLocalStorage();
    applyDateFilter();
    updateEmployeeDropdown();
    initSidebar();
    
    // Event listeners
    document.getElementById('applyHeaderSize').addEventListener('click', applyHeaderSize);
    document.getElementById('applyFilter').addEventListener('click', applyFilterHandler);
    document.getElementById('saveData').addEventListener('click', function() {
        saveDataToLocalStorage();
        // Simpan data ke absenTabelData juga
        absenTabelData = [...absenTabelData, ...absensiData];
        localStorage.setItem('absenTabelData', JSON.stringify(absenTabelData));
        alert('Data berhasil disimpan!');
    });
    
    document.getElementById('exportExcel').addEventListener('click', function() {
        let table, filename;
        
        if (currentTab === 'entry') {
            table = document.getElementById('entryTable');
            filename = "Data_Entry_Absensi.xlsx";
        } else if (currentTab === 'output') {
            table = document.getElementById('outputTable');
            filename = "Data_Output_Absensi.xlsx";
        } else if (currentTab === 'overtime') {
            // Untuk export overtime, kita perlu membuat tabel khusus
            exportOvertimeToExcel();
            return;
        } else if (currentTab === 'absen-tabel') {
            table = document.getElementById('absenTabelTable');
            filename = "Data_Absen_Tabel.xlsx";
        }
        
        if (table) {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.table_to_sheet(table);
            XLSX.utils.book_append_sheet(wb, ws, "Data Absensi");
            XLSX.writeFile(wb, filename);
        }
    });
    
    document.getElementById('addRow').addEventListener('click', function() {
        const tbody = document.querySelector('#entryTable tbody');
        const newRow = document.createElement('tr');
        
        let rowHTML = `
            <td><input type="text" class="area-input read-only-input" readonly ondblclick="makeEditable(this)"></td>
            <td><input type="text" class="name-input read-only-input" readonly ondblclick="makeEditable(this)"></td>
            <td><input type="text" class="position-input read-only-input" readonly ondblclick="makeEditable(this)"></td>
        `;
        
        dateRange.forEach(() => {
            rowHTML += '<td><input type="text" class="shift-input" onchange="updateShiftColor(this)"></td>';
        });
        
        rowHTML += '<td><button class="btn-delete" onclick="deleteRow(this)"><i class="fas fa-trash"></i></button></td>';
        
        newRow.innerHTML = rowHTML;
        tbody.appendChild(newRow);
        
        initializeShiftColors();
        addArrowNavigation();
    });
});

// Fungsi khusus untuk export data overtime ke Excel
function exportOvertimeToExcel() {
    const wb = XLSX.utils.book_new();
    
    // Data untuk overtime
    const overtimeDataToExport = [];
    
    // Header
    const header = [
        "No", "Area", "Name", "Position", "Date", "Shift", 
        "Shift Check In", "Shift Check Out", "WT/Normal", 
        "Actual Check In", "Actual Check Out", "Over Time", 
        "Cek RMC", "RKP PIC", "Rmc - Shift Check Out", "Remarks"
    ];
    overtimeDataToExport.push(header);
    
    // Ambil data dari tabel overtime
    const rows = document.querySelectorAll('#overtimeTableBody tr');
    rows.forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach((cell, index) => {
            if (index === 0) { // No
                rowData.push(cell.textContent);
            } else if (index === 1 || index === 2 || index === 3) { // Area, Name, Position
                rowData.push(cell.textContent);
            } else if (index === 4) { // Date
                rowData.push(cell.textContent);
            } else if (index === 5) { // Shift
                rowData.push(cell.textContent);
            } else if (index === 6 || index === 7) { // Shift Check In, Shift Check Out
                rowData.push(cell.textContent);
            } else if (index === 8) { // WT/Normal
                rowData.push(cell.querySelector('input').value);
            } else if (index === 9 || index === 10) { // Actual Check In, Actual Check Out
                rowData.push(cell.querySelector('input').value);
            } else if (index === 11) { // Over Time
                rowData.push(cell.querySelector('input').value);
            } else if (index === 12) { // Cek RMC
                rowData.push(cell.querySelector('input').value);
            } else if (index === 13) { // RKP PIC
                rowData.push(cell.querySelector('input').value);
            } else if (index === 14) { // Rmc - Shift Check Out
                rowData.push(cell.querySelector('input').value);
            } else if (index === 15) { // Remarks
                rowData.push(cell.querySelector('input').value);
            }
        });
        overtimeDataToExport.push(rowData);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(overtimeDataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "Data Overtime");
    XLSX.writeFile(wb, "Data_Overtime.xlsx");
}

// Fungsi untuk inisialisasi collapsible sections
function initCollapsible() {
    const coll = document.getElementsByClassName("collapsible");
    
    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

// Fungsi untuk inisialisasi sidebar
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const header = document.querySelector('.futuristic-header');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('expanded');
        mainContent.classList.toggle('expanded');
        header.classList.toggle('header-expanded');
    });
    
    // Tab navigation
    const tabLinks = document.querySelectorAll('.sidebar-menu a');
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            tabLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show the corresponding tab
            const tabId = this.getAttribute('data-tab');
            currentTab = tabId;
            
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            document.getElementById(tabId).classList.add('show', 'active');
            
            // Regenerate tables if needed
            if (tabId === 'output') {
                generateOutputTable();
            } else if (tabId === 'overtime') {
                generateOvertimeTable();
            } else if (tabId === 'absen-tabel') {
                generateAbsenTabelTable();
            }
        });
    });
}

// Fungsi untuk memuat data dari localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('absensiData');
    const savedRemarks = localStorage.getItem('remarksData');
    const savedOvertime = localStorage.getItem('overtimeData');
    const savedAbsenTabel = localStorage.getItem('absenTabelData');
    
    if (savedData) {
        absensiData = JSON.parse(savedData);
    } else {
        // Inisialisasi dengan data default jika tidak ada data tersimpan
        absensiData = [...initialEmployees];
    }
    
    if (savedRemarks) {
        remarksData = JSON.parse(savedRemarks);
    }
    
    if (savedOvertime) {
        overtimeData = JSON.parse(savedOvertime);
    }
    
    if (savedAbsenTabel) {
        absenTabelData = JSON.parse(savedAbsenTabel);
    }
}

// Fungsi untuk menyimpan data ke localStorage
function saveDataToLocalStorage() {
    // Simpan data absensi
    const table = document.getElementById('entryTable');
    const rows = table.querySelectorAll('tbody tr');
    
    absensiData = [];
    
    rows.forEach(row => {
        const area = row.querySelector('.area-input').value;
        const name = row.querySelector('.name-input').value;
        const position = row.querySelector('.position-input').value;
        
        if (area && name && position) {
            const employee = { area, name, position };
            const shifts = {};
            
            dateRange.forEach((date, index) => {
                const shiftInput = row.querySelectorAll('.shift-input')[index];
                if (shiftInput) {
                    const shiftValue = shiftInput.value.toUpperCase();
                    if (shiftValue) {
                        shifts[formatDateForShift(date)] = shiftValue;
                    }
                }
            });
            
            employee.shifts = shifts;
            absensiData.push(employee);
        }
    });
    
    localStorage.setItem('absensiData', JSON.stringify(absensiData));
    localStorage.setItem('remarksData', JSON.stringify(remarksData));
    localStorage.setItem('overtimeData', JSON.stringify(overtimeData));
}

// Fungsi untuk mengaplikasikan filter tanggal
function applyDateFilter() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    dateRange = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        dateRange.push(new Date(date));
    }
    
    generateEntryTable();
    generateOutputTable();
    generateOvertimeTable();
    generateAbsenTabelTable();
}

// Fungsi untuk menangani event apply filter
function applyFilterHandler() {
    applyDateFilter();
    updateEmployeeDropdown();
}

// Fungsi untuk mengupdate dropdown karyawan
function updateEmployeeDropdown() {
    const dropdown = document.getElementById('employeeName');
    const currentValue = dropdown.value;
    
    // Hapus semua opsi kecuali "Select All"
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    // Tambahkan semua nama karyawan yang unik dari absensiData
    const uniqueNames = [...new Set(absensiData.map(emp => emp.name))];
    
    uniqueNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        dropdown.appendChild(option);
    });
    
    // Kembalikan nilai yang dipilih sebelumnya jika masih ada
    if (Array.from(dropdown.options).some(opt => opt.value === currentValue)) {
        dropdown.value = currentValue;
    }
}

// Fungsi untuk mengaplikasikan ukuran header
function applyHeaderSize() {
    const headerWidth = document.getElementById('headerWidth').value;
    const headerHeight = document.getElementById('headerHeight').value;
    
    const headers = document.querySelectorAll('#entryTable th, #absenTabelTable th');
    headers.forEach(header => {
        header.style.width = `${headerWidth}px`;
        header.style.height = `${headerHeight}px`;
    });
    
    const cells = document.querySelectorAll('#entryTable td, #absenTabelTable td');
    cells.forEach(cell => {
        cell.style.height = `${headerHeight}px`;
    });
}

// Fungsi untuk menghasilkan tabel entry
function generateEntryTable() {
    const table = document.getElementById('entryTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    // Hapus kolom tanggal yang ada
    while (thead.children.length > 3) {
        thead.removeChild(thead.lastChild);
    }
    
    // Tambahkan kolom tanggal baru
    dateRange.forEach(date => {
        const th = document.createElement('th');
        th.textContent = formatDateForHeader(date);
        thead.insertBefore(th, thead.lastChild);
    });
    
    // Hapus semua baris
    tbody.innerHTML = '';
    
    // Tambahkan baris untuk setiap karyawan
    absensiData.forEach(employee => {
        const row = document.createElement('tr');
        
        let rowHTML = `
            <td><input type="text" class="area-input read-only-input" value="${employee.area}" readonly ondblclick="makeEditable(this)"></td>
            <td><input type="text" class="name-input read-only-input" value="${employee.name}" readonly ondblclick="makeEditable(this)"></td>
            <td><input type="text" class="position-input read-only-input" value="${employee.position}" readonly ondblclick="makeEditable(this)"></td>
        `;
        
        dateRange.forEach(date => {
            const dateStr = formatDateForShift(date);
            const shiftValue = employee.shifts && employee.shifts[dateStr] ? employee.shifts[dateStr] : '';
            rowHTML += `<td><input type="text" class="shift-input" value="${shiftValue}" onchange="updateShiftColor(this)"></td>`;
        });
        
        rowHTML += '<td><button class="btn-delete" onclick="deleteRow(this)"><i class="fas fa-trash"></i></button></td>';
        
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
    
    initializeShiftColors();
    addArrowNavigation();
}

// Fungsi untuk menghasilkan tabel output
function generateOutputTable() {
    const table = document.getElementById('outputTable');
    const tbody = table.querySelector('tbody');
    const employeeFilter = document.getElementById('employeeName').value;
    
    tbody.innerHTML = '';
    
    absensiData.forEach(employee => {
        if (employeeFilter !== 'all' && employee.name !== employeeFilter) return;
        
        dateRange.forEach(date => {
            const dateStr = formatDateForShift(date);
            const shiftValue = employee.shifts && employee.shifts[dateStr] ? employee.shifts[dateStr] : '';
            
            if (shiftValue) {
                const shiftInfo = shiftMatrix[employee.position] && shiftMatrix[employee.position][shiftValue] 
                    ? shiftMatrix[employee.position][shiftValue] 
                    : { name: shiftValue, checkIn: '', checkOut: '', hours: '' };
                
                const key = `${employee.name}-${employee.position}-${dateStr}`;
                const remarks = remarksData[key] || '';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.area}</td>
                    <td>${employee.name}</td>
                    <td>${employee.position}</td>
                    <td>${dateStr}</td>
                    <td>${shiftInfo.name}</td>
                    <td>${shiftInfo.checkIn}</td>
                    <td>${shiftInfo.checkOut}</td>
                    <td>
                        <span class="remarks-text" ondblclick="editRemarks('${key}')">${remarks}</span>
                    </td>
                `;
                
                tbody.appendChild(row);
            }
        });
    });
}

// Fungsi untuk menghasilkan tabel overtime
function generateOvertimeTable() {
    const table = document.getElementById('overtimeTable');
    const tbody = table.querySelector('tbody');
    const employeeFilter = document.getElementById('employeeName').value;
    
    tbody.innerHTML = '';
    let rowCount = 1;
    
    absensiData.forEach(employee => {
        if (employeeFilter !== 'all' && employee.name !== employeeFilter) return;
        
        dateRange.forEach(date => {
            const dateStr = formatDateForShift(date);
            const shiftValue = employee.shifts && employee.shifts[dateStr] ? employee.shifts[dateStr] : '';
            
            if (shiftValue && shiftValue !== 'C' && shiftValue !== 'O') {
                const shiftInfo = shiftMatrix[employee.position] && shiftMatrix[employee.position][shiftValue] 
                    ? shiftMatrix[employee.position][shiftValue] 
                    : { name: shiftValue, checkIn: '', checkOut: '', hours: '' };
                
                const key = `${employee.name}-${employee.position}-${dateStr}`;
                
                // Ambil data overtime yang sudah tersimpan
                const savedOvertime = overtimeData[key] || {};
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rowCount++}</td>
                    <td>${employee.area}</td>
                    <td>${employee.name}</td>
                    <td>${employee.position}</td>
                    <td>${dateStr}</td>
                    <td>${shiftInfo.name}</td>
                    <td>${shiftInfo.checkIn}</td>
                    <td>${shiftInfo.checkOut}</td>
                    <td><input type="text" class="wt-normal" value="${savedOvertime.wtnormal || ''}" onchange="saveOvertimeData('${key}', this)"></td>
                    <td><input type="time" class="actual-check-in" value="${savedOvertime.actualcheckin || ''}" onchange="saveOvertimeData('${key}', this)"></td>
                    <td><input type="time" class="actual-check-out" value="${savedOvertime.actualcheckout || ''}" onchange="calculateOvertime(this, '${key}'); saveOvertimeData('${key}', this)"></td>
                    <td><input type="text" class="over-time" value="${savedOvertime.overtime || ''}" readonly></td>
                    <td><input type="time" class="cek-rmc" value="${savedOvertime.cekrmc || ''}" onchange="calculateRmcShiftOut(this, '${key}'); saveOvertimeData('${key}', this)"></td>
                    <td><input type="text" class="rkp-pic" value="${savedOvertime.rkppic || ''}" onchange="saveOvertimeData('${key}', this)"></td>
                    <td><input type="text" class="rmc-shift-out" value="${savedOvertime.rmcshiftout || ''}" readonly></td>
                    <td><input type="text" class="overtime-remarks" value="${savedOvertime.remarks || ''}" onchange="saveOvertimeData('${key}', this)"></td>
                `;
                
                tbody.appendChild(row);
            }
        });
    });
}

// Fungsi untuk menghasilkan tabel absen-tabel
function generateAbsenTabelTable() {
    const table = document.getElementById('absenTabelTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    
    // Hapus kolom tanggal yang ada
    while (thead.children.length > 3) {
        thead.removeChild(thead.lastChild);
    }
    
    // Tambahkan kolom tanggal baru
    dateRange.forEach(date => {
        const th = document.createElement('th');
        th.textContent = formatDateForHeader(date);
        thead.insertBefore(th, thead.lastChild);
    });
    
    // Hapus semua baris
    tbody.innerHTML = '';
    
    // Tambahkan baris untuk setiap karyawan
    absenTabelData.forEach(employee => {
        const row = document.createElement('tr');
        
        let rowHTML = `
            <td><input type="text" class="area-input read-only-input" value="${employee.area}" readonly></td>
            <td><input type="text" class="name-input read-only-input" value="${employee.name}" readonly></td>
            <td><input type="text" class="position-input read-only-input" value="${employee.position}" readonly></td>
        `;
        
        dateRange.forEach(date => {
            const dateStr = formatDateForShift(date);
            const shiftValue = employee.shifts && employee.shifts[dateStr] ? employee.shifts[dateStr] : '';
            
            // Buat input field yang hanya bisa diedit (tidak bisa dihapus)
            rowHTML += `
                <td>
                    <input type="text" class="shift-input" value="${shiftValue}" 
                           onchange="updateShiftColor(this)" 
                           ${currentTab === 'absen-tabel' ? 'readonly ondblclick="makeEditable(this)"' : ''}>
                </td>
            `;
        });
        
        // Tombol edit saja (tidak ada hapus)
        rowHTML += '<td><button class="btn-edit" onclick="editRow(this)"><i class="fas fa-edit"></i></button></td>';
        
        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
    
    initializeShiftColors();
}

// Fungsi untuk mengedit baris di tab absen-tabel
function editRow(button) {
    const row = button.closest('tr');
    const inputs = row.querySelectorAll('input');
    
    inputs.forEach(input => {
        if (input.classList.contains('read-only-input')) {
            // Field area, name, dan position tetap readonly
            return;
        }
        
        if (input.readOnly) {
            input.readOnly = false;
            button.innerHTML = '<i class="fas fa-save"></i>';
        } else {
            input.readOnly = true;
            button.innerHTML = '<i class="fas fa-edit"></i>';
            
            // Simpan perubahan ke absenTabelData
            const name = row.querySelector('.name-input').value;
            const position = row.querySelector('.position-input').value;
            
            const employeeIndex = absenTabelData.findIndex(emp => 
                emp.name === name && emp.position === position
            );
            
            if (employeeIndex !== -1) {
                const shifts = {};
                const shiftInputs = row.querySelectorAll('.shift-input');
                
                dateRange.forEach((date, index) => {
                    const dateStr = formatDateForShift(date);
                    shifts[dateStr] = shiftInputs[index].value.toUpperCase();
                });
                
                absenTabelData[employeeIndex].shifts = shifts;
                localStorage.setItem('absenTabelData', JSON.stringify(absenTabelData));
            }
        }
    });
}

// Fungsi untuk inisialisasi warna shift
function initializeShiftColors() {
    document.querySelectorAll('.shift-input').forEach(input => {
        updateShiftColor(input);
    });
}

// Fungsi untuk navigasi dengan panah
function addArrowNavigation() {
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextInput = this.parentElement.nextElementSibling?.querySelector('input');
                if (nextInput) nextInput.focus();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevInput = this.parentElement.previousElementSibling?.querySelector('input');
                if (prevInput) prevInput.focus();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const row = this.closest('tr');
                const nextRow = row.nextElementSibling;
                if (nextRow) {
                    const index = Array.from(row.children).indexOf(this.parentElement);
                    const nextInput = nextRow.children[index].querySelector('input');
                    if (nextInput) nextInput.focus();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const row = this.closest('tr');
                const prevRow = row.previousElementSibling;
                if (prevRow) {
                    const index = Array.from(row.children).indexOf(this.parentElement);
                    const prevInput = prevRow.children[index].querySelector('input');
                    if (prevInput) prevInput.focus();
                }
            }
        });
    });
}
