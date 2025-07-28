let courses = [];
let users = [];
let editingUserId = null;
let searchUserInput, filterCourseSelect;

const fetchCourses = () =>
  fetch("/api/courses")
    .then((r) => r.json())
    .then((data) => {
      courses = data;
      updateNewCourseSelect();
      updateFilterCourseSelect();
    });

function updateNewCourseSelect() {
  const select = document.getElementById("new-course");
  const role = document.getElementById("new-role").value;
  if (role === "user") {
    select.style.display = "";
    select.innerHTML =
      '<option value="">Nessun corso</option>' +
      courses.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  } else {
    select.style.display = "none";
    select.innerHTML = "";
  }
}

document
  .getElementById("new-role")
  .addEventListener("change", updateNewCourseSelect);

function updateFilterCourseSelect() {
  filterCourseSelect.innerHTML =
    '<option value="">Tutti i corsi</option>' +
    courses.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

function toggleFilterCourseVisibility() {
  const filterRole = document.getElementById("filter-role").value;
  const filterCourseGroup = document
    .getElementById("filter-course")
    .closest(".filter-group");

  if (filterRole === "admin") {
    // Nascondi solo se si seleziona "Solo admin"
    filterCourseGroup.style.display = "none";
    document.getElementById("filter-course").value = "";
  } else {
    // Mostra se ruolo è "Tutti gli utenti" o "Solo utenti"
    filterCourseGroup.style.display = "";
  }
}

function fetchUsers() {
  fetch("/api/users")
    .then((r) => r.json())
    .then((data) => {
      users = data;
      renderUsersList();
    });
}

function renderUsersList() {
  const search = searchUserInput.value.toLowerCase();
  const courseId = filterCourseSelect.value;
  const filterRole = document.getElementById("filter-role").value;
  const dateFilter = document.getElementById("filter-user-date").value;
  const adminCount = users.filter((u) => u.role === "admin").length;
  let html =
    "<table><tr><th>Username</th><th>Ruolo</th><th>Corso</th><th>Azioni</th></tr>";

  users
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .filter((u) => {
      const matchName = u.username.toLowerCase().includes(search);
      const matchCourse =
        u.role === "admin"
          ? !courseId || courseId === ""
          : !courseId ||
            (u.courses && u.courses[0] && u.courses[0].id == courseId);
      const matchRole = !filterRole || u.role === filterRole;
      const matchDate =
        !dateFilter || (u.created_at && u.created_at.startsWith(dateFilter));
      return matchName && matchCourse && matchRole && matchDate;
    })
    .forEach((u) => {
      html += `<tr><td>${u.username}</td><td>`;
      html += `<span class='badge ${u.role}'>${
        u.role === "admin" ? "Admin" : "Utente"
      }</span>`;
      html += `</td><td>`;

      if (filterRole === "admin") {
        html += '<span style="color:#888">-</span>';
      } else if (u.role === "user") {
        html += `<select onchange='assignCourse(${u.id}, this.value)' style="min-width:120px;">`;
        html += `<option value="">Nessun corso</option>`;
        courses.forEach((c) => {
          const selected =
            u.courses && u.courses[0] && u.courses[0].id == c.id
              ? "selected"
              : "";
          html += `<option value="${c.id}" ${selected}>${c.name}</option>`;
        });
        html += `</select>`;
      } else {
        html += '<span style="color:#888">-</span>';
      }

      html += `</td><td>`;
      html += `<button onclick='openEditUser(${u.id})'>Modifica</button> `;

      if (u.role !== "admin")
        html += `<button onclick='promote(${u.id})'>Rendi Admin</button>`;
      if (u.role === "admin" && adminCount > 1)
        html += `<button onclick='demote(${u.id})'>Rendi Utente</button>`;
      if (adminCount > 1 || u.role !== "admin")
        html += `<button onclick='deleteUser(${u.id})'>Elimina</button>`;

      html += `</td></tr>`;
    });

  html += "</table>";
  document.getElementById("users-list").innerHTML = html;
}

function promote(id) {
  fetch(`/api/users/${id}/promote`, { method: "POST" }).then(fetchUsers);
}

function demote(id) {
  fetch(`/api/users/${id}/demote`, { method: "POST" }).then(fetchUsers);
}

function deleteUser(id) {
  if (confirm("Sei sicuro di voler eliminare questo utente?"))
    fetch(`/api/users/${id}`, { method: "DELETE" }).then(fetchUsers);
}

function assignCourse(id, courseId) {
  fetch(`/api/users/${id}/assign_course`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course_id: courseId }),
  })
    .then((r) => r.text())
    .then((msg) => {
      fetchUsers();
      const el = document.getElementById("assign-msg");
      el.textContent = msg === "OK" ? "Corso assegnato con successo!" : msg;
      el.className = msg === "OK" ? "success" : "hint";
      setTimeout(() => {
        el.textContent = "";
      }, 2500);
    });
}

function openEditUser(id) {
  editingUserId = id;
  const user = users.find((u) => u.id === id);
  document.getElementById("edit_username").value = user.username;
  document.getElementById("edit_password").value = "";
  document.getElementById("edit-user-password-hint").textContent = "";
  document.getElementById("edit-user-msg").textContent = "";
  document.getElementById("edit-user-modal").style.display = "flex";
}

document.getElementById("close-edit-modal").onclick = () => {
  document.getElementById("edit-user-modal").style.display = "none";
};

window.onclick = (e) => {
  if (e.target === document.getElementById("edit-user-modal"))
    document.getElementById("edit-user-modal").style.display = "none";
  if (e.target === document.getElementById("user-schedules-modal"))
    document.getElementById("user-schedules-modal").style.display = "none";
};

// Validazione password live
const newPassword = document.getElementById("new-password");
const addHint = document.getElementById("add-password-hint");

newPassword.addEventListener("input", () => {
  const val = newPassword.value;
  let msg = "";
  if (val.length < 8) msg += "Min 8 caratteri. ";
  if (!/[A-Z]/.test(val)) msg += "Almeno una maiuscola. ";
  if (!/[a-z]/.test(val)) msg += "Almeno una minuscola. ";
  if (!/[0-9]/.test(val)) msg += "Almeno un numero. ";
  addHint.textContent = msg;
  addHint.style.color = msg ? "var(--accent)" : "green";
});

document.getElementById("add-user-form").onsubmit = function (e) {
  if (addHint.textContent) {
    e.preventDefault();
    addHint.style.color = "red";
    return false;
  }
  e.preventDefault();
  fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("new-username").value,
      password: newPassword.value,
      role: document.getElementById("new-role").value,
      course_id: document.getElementById("new-course").value,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      document.getElementById("add-user-msg").textContent = msg;
      if (msg === "OK") {
        this.reset();
        updateNewCourseSelect();
        fetchUsers();
      }
    });
};

document.addEventListener("DOMContentLoaded", () => {
  searchUserInput = document.getElementById("search-user");
  filterCourseSelect = document.getElementById("filter-course");
  const filterRoleSelect = document.getElementById("filter-role");
  const filterUserDate = document.getElementById("filter-user-date");

  if (searchUserInput && filterCourseSelect) {
    searchUserInput.addEventListener("input", renderUsersList);
    filterCourseSelect.addEventListener("change", renderUsersList);
    if (filterRoleSelect)
      filterRoleSelect.addEventListener("change", () => {
        toggleFilterCourseVisibility();
        renderUsersList();
      });
    if (filterUserDate)
      filterUserDate.addEventListener("input", renderUsersList);
  }

  toggleFilterCourseVisibility();
  fetchCourses().then(fetchUsers);
});

// Importa la funzione formatDate se non esiste
if (typeof window.formatDate !== "function") {
  const script = document.createElement("script");
  script.src = "js/utils.js";
  document.head.appendChild(script);
}
