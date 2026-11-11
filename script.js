// ==========================================================
// LPU HOSTELCARE - JAVASCRIPT
// This file controls forms, login, complaints and dashboards.
// ==========================================================


// 1. STORAGE KEYS AND DEMO ADMIN ACCOUNT
const STUDENTS_KEY = "hostel_students";
const COMPLAINTS_KEY = "hostel_complaints";
const SESSION_KEY = "hostel_session";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "lpuadmin123";

let studentMenu = "Dashboard";
let adminMenu = "Dashboard";


// 2. SMALL HELPER FUNCTIONS

// Read an array or object saved in browser LocalStorage.
function readStorage(key, defaultValue) {
  const savedValue = localStorage.getItem(key);
  return savedValue ? JSON.parse(savedValue) : defaultValue;
}

// Save data in browser LocalStorage.
function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Show a short message at the bottom of the screen.
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";

  window.setTimeout(function () {
    toast.style.display = "none";
  }, 2500);
}

// Escape user-entered text before placing it inside HTML.
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    const safeCharacters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return safeCharacters[character];
  });
}

// Find the currently logged-in student.
function getCurrentStudent() {
  const session = readStorage(SESSION_KEY, null);
  if (!session || session.role !== "student") return null;

  const students = readStorage(STUDENTS_KEY, []);
  return students.find(function (student) {
    return student.id === session.studentId;
  }) || null;
}

// Find all complaints submitted by one student.
function getStudentComplaints(studentId) {
  const complaints = readStorage(COMPLAINTS_KEY, []);
  return complaints.filter(function (complaint) {
    return complaint.studentId === studentId;
  });
}


// 3. PAGE NAVIGATION

// Hide all pages and show only the page selected by the user.
function showPage(pageName) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(function (page) {
    page.classList.add("hidden");
  });

  const selectedPage = document.getElementById(pageName + "Page");
  if (selectedPage) {
    selectedPage.classList.remove("hidden");
  }

  window.scrollTo(0, 0);
}

// Open the home, login, register or dashboard page.
function navigateTo(pageName) {
  const session = readStorage(SESSION_KEY, null);

  if (pageName === "studentDashboard" && (!session || session.role !== "student")) {
    showPage("studentLogin");
    return;
  }

  if (pageName === "adminDashboard" && (!session || session.role !== "admin")) {
    showPage("adminLogin");
    return;
  }

  if (pageName === "studentDashboard") renderStudentDashboard();
  if (pageName === "adminDashboard") renderAdminDashboard();

  showPage(pageName);
}

// All buttons with data-page use the same navigation function.
document.addEventListener("click", function (event) {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    navigateTo(pageButton.dataset.page);
  }
});


// 4. STUDENT REGISTRATION

const registerForm = document.getElementById("studentRegisterForm");

registerForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const students = readStorage(STUDENTS_KEY, []);

  const name = document.getElementById("regName").value.trim();
  const uid = document.getElementById("regUid").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const phone = document.getElementById("regPhone").value.trim();
  const hostel = document.getElementById("regHostel").value.trim();
  const room = document.getElementById("regRoom").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirm").value;

  if (password.length < 6) {
    showToast("Password must contain at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match.");
    return;
  }

  const accountExists = students.some(function (student) {
    return student.uid.toLowerCase() === uid.toLowerCase() ||
           student.email.toLowerCase() === email;
  });

  if (accountExists) {
    showToast("This UID or email is already registered.");
    return;
  }

  const newStudent = {
    id: Date.now(),
    name: name,
    uid: uid,
    email: email,
    phone: phone,
    hostel: hostel,
    room: room,
    password: password
  };

  students.push(newStudent);
  saveStorage(STUDENTS_KEY, students);

  registerForm.reset();
  showToast("Account created. Please login.");
  navigateTo("studentLogin");
});


// 5. STUDENT LOGIN

const studentLoginForm = document.getElementById("studentLoginForm");

studentLoginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const loginId = document.getElementById("loginId").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const students = readStorage(STUDENTS_KEY, []);

  const matchedStudent = students.find(function (student) {
    return (student.email.toLowerCase() === loginId ||
            student.uid.toLowerCase() === loginId) &&
            student.password === password;
  });

  if (!matchedStudent) {
    showToast("Incorrect email/UID or password.");
    return;
  }

  saveStorage(SESSION_KEY, {
    role: "student",
    studentId: matchedStudent.id
  });

  studentMenu = "Dashboard";
  studentLoginForm.reset();
  navigateTo("studentDashboard");
  showToast("Welcome to your student dashboard.");
});


// 6. ADMIN LOGIN

const adminLoginForm = document.getElementById("adminLoginForm");

adminLoginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    showToast("Incorrect admin username or password.");
    return;
  }

  saveStorage(SESSION_KEY, { role: "admin" });
  adminMenu = "Dashboard";
  adminLoginForm.reset();
  navigateTo("adminDashboard");
  showToast("Welcome, administrator.");
});


// 7. LOGOUT BUTTONS

function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  showToast("You have logged out.");
  navigateTo("home");
}

document.getElementById("studentLogout").addEventListener("click", logoutUser);
document.getElementById("adminLogout").addEventListener("click", logoutUser);


// 8. STUDENT DASHBOARD MENU

document.querySelectorAll("[data-student-menu]").forEach(function (button) {
  button.addEventListener("click", function () {
    studentMenu = button.dataset.studentMenu;
    renderStudentDashboard();
  });
});

// Highlight the selected student menu item.
function updateStudentMenu() {
  document.querySelectorAll("[data-student-menu]").forEach(function (button) {
    button.classList.toggle("active", button.dataset.studentMenu === studentMenu);
  });
}

// Display the student dashboard content.
function renderStudentDashboard() {
  const student = getCurrentStudent();

  if (!student) {
    navigateTo("studentLogin");
    return;
  }

  document.getElementById("studentHeaderName").textContent = student.name;
  updateStudentMenu();

  const content = document.getElementById("studentDashboardContent");
  const complaints = getStudentComplaints(student.id);

  if (studentMenu === "Dashboard") {
    const pending = complaints.filter(item => item.status === "Pending").length;
    const progress = complaints.filter(item => item.status === "In Progress").length;
    const resolved = complaints.filter(item => item.status === "Resolved").length;

    content.innerHTML = `
      <h1>Welcome, ${escapeHTML(student.name)}</h1>
      <p class="muted">Here is your hostel maintenance summary.</p>

      <div class="stats">
        ${statCard("Total Complaints", complaints.length)}
        ${statCard("Pending", pending)}
        ${statCard("In Progress", progress)}
        ${statCard("Resolved", resolved)}
      </div>

      <div class="panel">
        <h2>Recent Complaints</h2>
        ${studentComplaintTable(complaints.slice().reverse().slice(0, 5))}
        <button class="btn primary" id="newComplaintButton">＋ New Complaint</button>
      </div>
    `;

    document.getElementById("newComplaintButton").addEventListener("click", function () {
      studentMenu = "Raise Complaint";
      renderStudentDashboard();
    });
  }

  if (studentMenu === "Raise Complaint") {
    content.innerHTML = complaintFormHTML(student);
    document.getElementById("complaintForm").addEventListener("submit", submitComplaint);
  }

  if (studentMenu === "My Complaints") {
    content.innerHTML = `
      <h1>My Complaints</h1>
      <p class="muted">All maintenance complaints submitted by you.</p>
      ${studentComplaintTable(complaints.slice().reverse())}
    `;
  }

  if (studentMenu === "Notifications") {
    const notificationHTML = complaints.length
      ? complaints.slice().reverse().map(function (item) {
          return `<p class="notice">Complaint <b>${escapeHTML(item.id)}</b> is currently <b>${escapeHTML(item.status)}</b>.
          ${item.remark ? "<br>Admin remark: " + escapeHTML(item.remark) : ""}</p>`;
        }).join("")
      : "<p class='notice'>No notifications yet.</p>";

    content.innerHTML = `<h1>Notifications</h1><div class="panel">${notificationHTML}</div>`;
  }

  if (studentMenu === "My Profile") {
    content.innerHTML = profileFormHTML(student);
    document.getElementById("profileForm").addEventListener("submit", updateStudentProfile);
  }
}


// 9. STUDENT COMPLAINT FORM

function complaintFormHTML(student) {
  return `
    <div class="panel">
      <h1>Raise a Complaint</h1>
      <p class="muted">Describe the hostel maintenance issue clearly.</p>

      <form id="complaintForm">
        <div class="form-grid">
          <div class="field"><label for="complaintTitle">Complaint Title</label><input id="complaintTitle" required></div>
          <div class="field">
            <label for="complaintCategory">Category</label>
            <select id="complaintCategory" required>
              <option value="">Select category</option>
              <option>Electrical</option><option>Plumbing</option>
              <option>Furniture</option><option>Wi-Fi / Internet</option>
              <option>Cleaning</option><option>Water Supply</option>
              <option>AC / Fan</option><option>Bathroom</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label for="complaintHostel">Hostel / Block</label><input id="complaintHostel" value="${escapeHTML(student.hostel)}" required></div>
          <div class="field"><label for="complaintRoom">Room Number</label><input id="complaintRoom" value="${escapeHTML(student.room)}" required></div>
          <div class="field"><label for="complaintPriority">Priority</label>
            <select id="complaintPriority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select>
          </div>
          <div class="field full"><label for="complaintDescription">Description</label><textarea id="complaintDescription" minlength="10" required></textarea></div>
        </div>
        <button class="btn primary" type="submit">Submit Complaint</button>
      </form>
    </div>
  `;
}

// Save a new complaint submitted by the logged-in student.
function submitComplaint(event) {
  event.preventDefault();

  const student = getCurrentStudent();
  if (!student) return;

  const complaints = readStorage(COMPLAINTS_KEY, []);

  const newComplaint = {
    id: "LPU-" + Date.now(),
    studentId: student.id,
    studentName: student.name,
    uid: student.uid,
    email: student.email,
    title: document.getElementById("complaintTitle").value.trim(),
    category: document.getElementById("complaintCategory").value,
    hostel: document.getElementById("complaintHostel").value.trim(),
    room: document.getElementById("complaintRoom").value.trim(),
    priority: document.getElementById("complaintPriority").value,
    description: document.getElementById("complaintDescription").value.trim(),
    status: "Pending",
    remark: "",
    date: new Date().toLocaleString()
  };

  complaints.push(newComplaint);
  saveStorage(COMPLAINTS_KEY, complaints);

  studentMenu = "My Complaints";
  renderStudentDashboard();
  showToast("Complaint submitted successfully.");
}


// 10. STUDENT COMPLAINT TABLE

function studentComplaintTable(items) {
  if (items.length === 0) {
    return "<p class='notice'>You have not submitted any complaints yet.</p>";
  }

  const rows = items.map(function (item) {
    return `
      <tr>
        <td>${escapeHTML(item.id)}</td>
        <td>${escapeHTML(item.title)}</td>
        <td>${escapeHTML(item.category)}</td>
        <td>${escapeHTML(item.date)}</td>
        <td>${statusBadge(item.status)}</td>
        <td>${escapeHTML(item.remark || "No remark yet")}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Complaint ID</th><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Admin Remark</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


// 11. STUDENT PROFILE

function profileFormHTML(student) {
  return `
    <div class="panel">
      <h1>My Profile</h1>
      <form id="profileForm">
        <div class="field"><label for="profileName">Full Name</label><input id="profileName" value="${escapeHTML(student.name)}" required></div>
        <div class="field"><label>Registration Number</label><input value="${escapeHTML(student.uid)}" disabled></div>
        <div class="field"><label for="profileEmail">Email</label><input id="profileEmail" type="email" value="${escapeHTML(student.email)}" required></div>
        <div class="field"><label for="profilePhone">Contact Number</label><input id="profilePhone" value="${escapeHTML(student.phone)}" required></div>
        <div class="field"><label for="profileHostel">Hostel</label><input id="profileHostel" value="${escapeHTML(student.hostel)}" required></div>
        <div class="field"><label for="profileRoom">Room Number</label><input id="profileRoom" value="${escapeHTML(student.room)}" required></div>
        <button class="btn primary" type="submit">Save Profile</button>
      </form>
    </div>
  `;
}

// Update the saved student details.
function updateStudentProfile(event) {
  event.preventDefault();

  const currentStudent = getCurrentStudent();
  const students = readStorage(STUDENTS_KEY, []);

  currentStudent.name = document.getElementById("profileName").value.trim();
  currentStudent.email = document.getElementById("profileEmail").value.trim().toLowerCase();
  currentStudent.phone = document.getElementById("profilePhone").value.trim();
  currentStudent.hostel = document.getElementById("profileHostel").value.trim();
  currentStudent.room = document.getElementById("profileRoom").value.trim();

  const studentIndex = students.findIndex(item => item.id === currentStudent.id);
  students[studentIndex] = currentStudent;

  saveStorage(STUDENTS_KEY, students);
  renderStudentDashboard();
  showToast("Profile updated successfully.");
}


// 12. ADMIN DASHBOARD MENU

document.querySelectorAll("[data-admin-menu]").forEach(function (button) {
  button.addEventListener("click", function () {
    adminMenu = button.dataset.adminMenu;
    renderAdminDashboard();
  });
});

// Highlight the selected admin menu item.
function updateAdminMenu() {
  document.querySelectorAll("[data-admin-menu]").forEach(function (button) {
    button.classList.toggle("active", button.dataset.adminMenu === adminMenu);
  });
}

// Show the selected admin dashboard section.
function renderAdminDashboard() {
  const session = readStorage(SESSION_KEY, null);
  if (!session || session.role !== "admin") {
    navigateTo("adminLogin");
    return;
  }

  updateAdminMenu();

  const content = document.getElementById("adminDashboardContent");
  const students = readStorage(STUDENTS_KEY, []);
  const complaints = readStorage(COMPLAINTS_KEY, []);

  const pending = complaints.filter(item => item.status === "Pending").length;
  const progress = complaints.filter(item => item.status === "In Progress").length;
  const resolved = complaints.filter(item => item.status === "Resolved").length;
  const rejected = complaints.filter(item => item.status === "Rejected").length;

  if (adminMenu === "Dashboard") {
    content.innerHTML = `
      <h1>Administration Overview</h1>
      <p class="muted">Manage hostel maintenance requests and registered students.</p>
      <div class="stats">
        ${statCard("Registered Students", students.length)}
        ${statCard("Total Complaints", complaints.length)}
        ${statCard("Pending", pending)}
        ${statCard("In Progress", progress)}
        ${statCard("Resolved", resolved)}
        ${statCard("Rejected", rejected)}
      </div>
      <div class="panel"><h2>Recent Complaints</h2>${adminComplaintTable(complaints.slice().reverse().slice(0, 8))}</div>
    `;
  }

  if (adminMenu === "All Complaints") {
    content.innerHTML = `<h1>All Complaints</h1><p class="muted">View and update student maintenance requests.</p><div class="panel">${adminComplaintTable(complaints.slice().reverse())}</div>`;
  }

  if (adminMenu === "Student Management") {
    content.innerHTML = `<h1>Student Management</h1><p class="muted">Registered hostel residents.</p><div class="panel">${studentTable(students)}</div>`;
  }

  if (adminMenu === "Reports & Analytics") {
    content.innerHTML = `
      <h1>Reports & Analytics</h1>
      <div class="stats">
        ${statCard("Total Complaints", complaints.length)}
        ${statCard("Pending", pending)}
        ${statCard("Resolved", resolved)}
        ${statCard("Rejected", rejected)}
      </div>
      <div class="panel">
        <h2>Complaint Status Summary</h2>
        <p class="muted">Pending: ${pending} · In Progress: ${progress} · Resolved: ${resolved} · Rejected: ${rejected}</p>
        <br><button class="btn primary" id="exportCSVButton">Download CSV Report</button>
      </div>
    `;

    document.getElementById("exportCSVButton").addEventListener("click", exportComplaintsCSV);
  }

  if (adminMenu === "Notifications") {
    const activity = complaints.length
      ? complaints.slice().reverse().map(item =>
          `<p class="notice">${escapeHTML(item.studentName)} submitted <b>${escapeHTML(item.title)}</b>. Current status: <b>${escapeHTML(item.status)}</b>.</p>`
        ).join("")
      : "<p class='notice'>No activity yet.</p>";

    content.innerHTML = `<h1>Recent Activity</h1><div class="panel">${activity}</div>`;
  }
}


// 13. ADMIN COMPLAINT TABLE AND STATUS UPDATES

function statusBadge(status) {
  return `<span class="status ${status.replace(" ", "-")}">${escapeHTML(status)}</span>`;
}

function adminComplaintTable(items) {
  if (items.length === 0) return "<p class='notice'>No complaints have been submitted.</p>";

  const rows = items.map(function (item) {
    return `
      <tr>
        <td>${escapeHTML(item.id)}</td>
        <td>${escapeHTML(item.studentName)}<br>${escapeHTML(item.uid)}</td>
        <td>${escapeHTML(item.title)}<br>${escapeHTML(item.category)}</td>
        <td>${escapeHTML(item.hostel)} / ${escapeHTML(item.room)}</td>
        <td>${escapeHTML(item.priority)}</td>
        <td>${statusBadge(item.status)}</td>
        <td>
          <select class="status-select" data-complaint-id="${escapeHTML(item.id)}">
            ${["Pending", "In Progress", "Resolved", "Rejected"].map(function (status) {
              return `<option value="${status}" ${item.status === status ? "selected" : ""}>${status}</option>`;
            }).join("")}
          </select>
          <button class="btn secondary remark-button" data-remark-id="${escapeHTML(item.id)}">Remark</button>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Ticket ID</th><th>Student</th><th>Issue</th><th>Location</th><th>Priority</th><th>Status</th><th>Update</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// Listen for status changes and admin remarks.
document.getElementById("adminDashboardContent").addEventListener("change", function (event) {
  if (event.target.classList.contains("status-select")) {
    updateComplaintStatus(event.target.dataset.complaintId, event.target.value);
  }
});

document.getElementById("adminDashboardContent").addEventListener("click", function (event) {
  if (event.target.classList.contains("remark-button")) {
    addComplaintRemark(event.target.dataset.remarkId);
  }
});

// Update the complaint status selected by the admin.
function updateComplaintStatus(complaintId, newStatus) {
  const complaints = readStorage(COMPLAINTS_KEY, []);
  const complaint = complaints.find(item => item.id === complaintId);
  if (!complaint) return;

  complaint.status = newStatus;
  saveStorage(COMPLAINTS_KEY, complaints);
  renderAdminDashboard();
  showToast("Complaint status updated.");
}

// Add a note from the administrator.
function addComplaintRemark(complaintId) {
  const complaints = readStorage(COMPLAINTS_KEY, []);
  const complaint = complaints.find(item => item.id === complaintId);
  if (!complaint) return;

  const remark = window.prompt("Enter an admin remark:", complaint.remark || "");
  if (remark === null) return;

  complaint.remark = remark.trim();
  saveStorage(COMPLAINTS_KEY, complaints);
  renderAdminDashboard();
  showToast("Admin remark saved.");
}


// 14. STUDENT LIST FOR ADMIN

function studentTable(students) {
  if (students.length === 0) return "<p class='notice'>No students have registered yet.</p>";

  const rows = students.map(function (student) {
    return `
      <tr>
        <td>${escapeHTML(student.name)}</td>
        <td>${escapeHTML(student.uid)}</td>
        <td>${escapeHTML(student.email)}</td>
        <td>${escapeHTML(student.phone)}</td>
        <td>${escapeHTML(student.hostel)}</td>
        <td>${escapeHTML(student.room)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>UID</th><th>Email</th><th>Contact</th><th>Hostel</th><th>Room</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}


// 15. SMALL DASHBOARD STAT CARD

function statCard(title, number) {
  return `<div class="stat"><p>${escapeHTML(title)}</p><h2>${number}</h2></div>`;
}


// 16. EXPORT COMPLAINTS AS A CSV FILE

function exportComplaintsCSV() {
  const complaints = readStorage(COMPLAINTS_KEY, []);

  const headings = [
    "Complaint ID", "Student Name", "UID", "Category",
    "Title", "Priority", "Hostel", "Room", "Status", "Date", "Admin Remark"
  ];

  const rows = complaints.map(function (item) {
    return [
      item.id, item.studentName, item.uid, item.category, item.title,
      item.priority, item.hostel, item.room, item.status, item.date, item.remark
    ];
  });

  const csvText = [headings, ...rows].map(function (row) {
    return row.map(function (value) {
      return '"' + String(value ?? "").replace(/"/g, '""') + '"';
    }).join(",");
  }).join("\n");

  const file = new Blob([csvText], { type: "text/csv" });
  const downloadLink = document.createElement("a");
  const fileURL = URL.createObjectURL(file);

  downloadLink.href = fileURL;
  downloadLink.download = "hostelcare-complaints.csv";
  downloadLink.click();

  URL.revokeObjectURL(fileURL);
}


// 17. CONTACT FORM DEMO

document.getElementById("contactForm").addEventListener("submit", function (event) {
  event.preventDefault();
  showToast("Thank you! Your demo message form was submitted.");
  event.target.reset();
});


// 18. OPEN THE CORRECT PAGE WHEN WEBSITE STARTS

function startWebsite() {
  const session = readStorage(SESSION_KEY, null);

  if (session && session.role === "student") {
    navigateTo("studentDashboard");
  } else if (session && session.role === "admin") {
    navigateTo("adminDashboard");
  } else {
    showPage("home");
  }
}

startWebsite();
