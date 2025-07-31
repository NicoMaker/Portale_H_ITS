let courses = [];
let users = [];
let editingUserId = null;
let searchUserInput, filterCourseSelect;
let userToDeleteId = null; // NEW: Variabile per tenere traccia dell'ID dell'utente da eliminare

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
  const label = document.getElementById("new-course-label");
  const role = document.getElementById("new-role").value;
  if (role === "user") {
    select.style.display = "";
    label.style.display = "";
    select.innerHTML =
      '<option value="">Nessun corso</option>' +
      courses.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  } else {
    select.style.display = "none";
    label.style.display = "none"; // o 'none' se vuoi nascondere anche la label
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
    filterCourseGroup.style.display = "none";
    document.getElementById("filter-course").value = "";
  } else {
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

  let html = "";

  const filteredUsers = users
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
    });

  if (!filteredUsers.length) {
    html = `
          <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
            <div class="relative mb-8">
              <div class="text-8xl mb-4 float-animation">👥</div>
              <div class="absolute -top-2 -right-2 text-3xl animate-bounce">✨</div>
            </div>
            <h3 class="text-2xl font-bold text-gray-700 mb-3">Nessun utente trovato</h3>
            <p class="text-lg text-gray-500 mb-6 text-center max-w-md">
              Modifica i filtri per visualizzare altri utenti o crea il primo utente
            </p>
          </div>
        `;
  } else {
    filteredUsers.forEach((u) => {
      const gradients = [
        "from-green-500 to-emerald-500",
        "from-blue-500 to-cyan-500",
        "from-purple-500 to-pink-500",
        "from-orange-500 to-red-500",
        "from-indigo-500 to-purple-500",
        "from-teal-500 to-green-500",
      ];
      const gradient = gradients[u.id % gradients.length];

      html += `
            <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100 pulse-on-hover user-card-hover">
              <div class="bg-gradient-to-r ${gradient} p-6 relative overflow-hidden">
                <div class="shimmer absolute inset-0"></div>
                <div class="relative z-10">
                  <div class="flex items-center justify-between mb-4">
                    <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                      <span class="text-3xl">${u.role === "admin" ? "👑" : "👤"}</span>
                    </div>
                    <div class="flex space-x-2">
                      <button class="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" 
                              title="Modifica utente" onclick="openEditUser(${u.id})">
                        <span class="text-lg">✏️</span>
                      </button>
                      ${
                        adminCount > 1 || u.role !== "admin"
                          ? `
                      <button class="bg-white/20 hover:bg-red-500/30 backdrop-blur-sm text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105" 
                              title="Elimina utente" onclick="deleteUser(${u.id})">
                        <span class="text-lg">🗑️</span>
                      </button>
                      `
                          : ""
                      }
                    </div>
                  </div>
                  <h3 class="text-2xl font-bold text-white mb-2 truncate">${u.username}</h3>
                  <div class="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 inline-block">
                    <span class="text-white/90 text-sm font-medium">
                      ${u.role === "admin" ? "👑 Amministratore" : "👤 Utente"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="p-8">
                <div class="mb-6">
                  <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                    <span class="mr-2">📚</span>
                    Corso Assegnato
                  </h4>
                  ${
                    u.role === "user"
                      ? `
                    <select onchange='assignCourse(${u.id}, this.value)' 
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200 shadow-sm">
                      <option value="">Nessun corso</option>
                      ${courses
                        .map((c) => {
                          const selected =
                            u.courses && u.courses[0] && u.courses[0].id == c.id
                              ? "selected"
                              : "";
                          return `<option value="${c.id}" ${selected}>${c.name}</option>`;
                        })
                        .join("")}
                    </select>
                  `
                      : `
                    <p class="text-gray-500 italic">Gli amministratori non hanno corsi assegnati</p>
                  `
                  }
                </div>
                
                <div class="flex flex-wrap gap-3">
                  <button onclick="openEditUser(${u.id})" 
                    class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
                    <span>✏️</span>
                    <span>Modifica</span>
                  </button>
                  
                  ${
                    u.role !== "admin"
                      ? `
                  <button onclick="promote(${u.id})" 
                    class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
                    <span>👑</span>
                    <span>Rendi Admin</span>
                  </button>
                  `
                      : ""
                  }
                  
                  ${
                    u.role === "admin" && adminCount > 1
                      ? `
                  <button onclick="demote(${u.id})" 
                    class="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
                    <span>👤</span>
                    <span>Rendi Utente</span>
                  </button>
                  `
                      : ""
                  }
                  
                  ${
                    adminCount > 1 || u.role !== "admin"
                      ? `
                  <button onclick="deleteUser(${u.id})" 
                    class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center">
                    <span>🗑️</span>
                  </button>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          `;
    });
  }

  document.getElementById("users-list").innerHTML = html;
}

function promote(id) {
  fetch(`/api/users/${id}/promote`, { method: "POST" }).then(fetchUsers);
}

function demote(id) {
  fetch(`/api/users/${id}/demote`, { method: "POST" }).then(fetchUsers);
}

// NEW: Functions for Delete User Confirmation Modal
function openDeleteUserConfirmModal(id) {
  userToDeleteId = id;
  const user = users.find((u) => u.id == id);
  if (user) {
    document.getElementById("delete-user-name-display").textContent =
      user.username;
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (user.role === "admin" && adminCount <= 1) {
      document.getElementById("delete-admin-warning").style.display = "block";
      document.getElementById("confirm-delete-user").disabled = true; // NEW: Disable confirm button if last admin
      document
        .getElementById("confirm-delete-user")
        .classList.add("opacity-50", "cursor-not-allowed"); // NEW: Add styling for disabled button
    } else {
      document.getElementById("delete-admin-warning").style.display = "none";
      document.getElementById("confirm-delete-user").disabled = false; // NEW: Enable confirm button
      document
        .getElementById("confirm-delete-user")
        .classList.remove("opacity-50", "cursor-not-allowed"); // NEW: Remove styling for disabled button
    }
  }
  document.getElementById("delete-user-confirm-modal").style.display = "flex";
}

document.getElementById("close-delete-user-confirm-modal").onclick = () => {
  document.getElementById("delete-user-confirm-modal").style.display = "none";
};

document.getElementById("cancel-delete-user-modal").onclick = () => {
  document.getElementById("delete-user-confirm-modal").style.display = "none";
};

document.getElementById("confirm-delete-user").onclick = () => {
  if (userToDeleteId) {
    fetch(`/api/users/${userToDeleteId}`, { method: "DELETE" })
      .then(() => {
        fetchUsers();
        document.getElementById("delete-user-confirm-modal").style.display =
          "none";
      })
      .catch((err) => {
        console.error("Errore durante l'eliminazione:", err);
        // Potresti aggiungere qui un messaggio di errore all'utente
        document.getElementById("delete-user-confirm-modal").style.display =
          "none";
      });
  }
};

// Modified deleteUser to open the custom modal
function deleteUser(id) {
  openDeleteUserConfirmModal(id);
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
      el.className = `mt-4 p-4 rounded-2xl text-sm font-medium ${msg === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
      el.classList.remove("hidden");
      setTimeout(() => {
        el.classList.add("hidden");
      }, 3000);
    });
}

function openEditUser(id) {
  editingUserId = id;
  const user = users.find((u) => u.id === id);
  document.getElementById("edit_username").value = user.username;
  document.getElementById("edit_password").value = "";
  document.getElementById("edit-user-password-hint").textContent = "";
  document.getElementById("edit-user-msg").classList.add("hidden");
  document.getElementById("edit-user-modal").style.display = "flex";
}

function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.className = `mt-4 p-4 rounded-2xl text-sm font-medium ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    el.classList.remove("hidden");

    setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }
}

// Modal functions
document.getElementById("add-user-btn").onclick = () => {
  document.getElementById("add-user-modal").style.display = "flex";
  document.getElementById("add-user-msg").classList.add("hidden");
  updateNewCourseSelect();
};

document.getElementById("close-add-user-modal").onclick = () => {
  document.getElementById("add-user-modal").style.display = "none";
};

document.getElementById("cancel-add-user").onclick = function () {
  document.getElementById("add-user-modal").style.display = "none";
};

document.getElementById("close-edit-modal").onclick = () => {
  document.getElementById("edit-user-modal").style.display = "none";
};

document.getElementById("cancel-edit-user").onclick = function () {
  document.getElementById("edit-user-modal").style.display = "none";
};

document.getElementById("close-schedules-modal").onclick = () => {
  document.getElementById("user-schedules-modal").style.display = "none";
};

window.onclick = (e) => {
  if (e.target === document.getElementById("edit-user-modal"))
    document.getElementById("edit-user-modal").style.display = "none";
  if (e.target === document.getElementById("user-schedules-modal"))
    document.getElementById("user-schedules-modal").style.display = "none";
  if (e.target === document.getElementById("add-user-modal"))
    document.getElementById("add-user-modal").style.display = "none";
  if (e.target === document.getElementById("delete-user-confirm-modal"))
    // NEW: Close delete user modal on outside click
    document.getElementById("delete-user-confirm-modal").style.display = "none";
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
  addHint.style.color = msg ? "#ef4444" : "#22c55e";
});

// Validazione password edit
const editPassword = document.getElementById("edit_password");
const editHint = document.getElementById("edit-user-password-hint");

editPassword.addEventListener("input", () => {
  const val = editPassword.value;
  let msg = "";
  if (val.length < 8) msg += "Min 8 caratteri. ";
  if (!/[A-Z]/.test(val)) msg += "Almeno una maiuscola. ";
  if (!/[a-z]/.test(val)) msg += "Almeno una minuscola. ";
  if (!/[0-9]/.test(val)) msg += "Almeno un numero. ";
  editHint.textContent = msg;
  editHint.style.color = msg ? "#ef4444" : "#22c55e";
});

document.getElementById("add-user-form").onsubmit = function (e) {
  e.preventDefault();

  if (addHint.textContent) {
    addHint.style.color = "#ef4444";
    showMessage("add-user-msg", "Correggi gli errori nella password", "error");
    return false;
  }

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
      if (msg === "OK") {
        showMessage("add-user-msg", "Utente creato con successo!", "success");
        this.reset();
        updateNewCourseSelect();
        fetchUsers();
        setTimeout(() => {
          document.getElementById("add-user-modal").style.display = "none";
        }, 1500);
      } else {
        showMessage("add-user-msg", msg, "error");
      }
    });
};

document.getElementById("edit-user-form").onsubmit = function (e) {
  e.preventDefault();

  if (editHint.textContent) {
    editHint.style.color = "#ef4444";
    showMessage("edit-user-msg", "Correggi gli errori nella password", "error");
    return false;
  }

  fetch(`/api/users/${editingUserId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("edit_username").value,
      password: document.getElementById("edit_password").value,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        showMessage(
          "edit-user-msg",
          "Utente aggiornato con successo!",
          "success",
        );
        fetchUsers();
        setTimeout(() => {
          document.getElementById("edit-user-modal").style.display = "none";
        }, 1500);
      } else {
        showMessage("edit-user-msg", msg, "error");
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

// Initialize
fetchCourses().then(fetchUsers);
