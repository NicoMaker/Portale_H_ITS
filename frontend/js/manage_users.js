let courses = [];
let users = [];
let editingUserId = null;
let searchUserInput, filterCourseSelect;
let userToDeleteId = null; 
let filterRoleSelect;
let filterUserDate;
let userToChangeId = null;
let userToChangeRole = null;

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
    label.style.display = "none";
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
      updateUserStats();
    });
}

function renderUsersList() {
  const search = searchUserInput.value.toLowerCase();
  const courseId = filterCourseSelect.value;
  const filterRole = document.getElementById("filter-role").value;
  const dateFilter = document.getElementById("filter-user-date").value;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const filteredUsers = users
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
    .sort((a, b) => a.username.localeCompare(b.username));

  let html = "";
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
      const assignedCourse = u.courses && u.courses[0] ? u.courses[0].name : 'Nessuno';
      const isLastAdmin = u.role === "admin" && adminCount <= 1;

      html += `
        <div class="user-card bg-white rounded-2xl shadow-lg p-6 flex flex-col relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${u.role === 'admin' ? 'from-green-400 to-green-600' : 'from-purple-400 to-indigo-600'}"></div>
            <div class="flex items-center mb-4">
                <span class="text-4xl mr-3">${u.role === 'admin' ? '👑' : '👨‍🎓'}</span>
                <div>
                    <h4 class="text-lg font-bold text-gray-900">${u.username}</h4>
                    <span class="text-sm font-medium ${u.role === 'admin' ? 'text-green-600' : 'text-purple-600'}">${u.role === 'admin' ? 'Amministratore' : 'Utente'}</span>
                </div>
            </div>
            <div class="flex-grow">
                <p class="text-sm text-gray-600">Corso Assegnato:</p>
                <p class="font-semibold text-gray-800">${assignedCourse}</p>
            </div>
            <div class="mt-4 flex flex-wrap justify-start items-center gap-2">
                <button onclick="openEditUser(${u.id})" class="px-3 py-1 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-full transition-colors">
                    Modifica
                </button>
                ${!isLastAdmin ? `<button onclick="deleteUser(${u.id})" class="px-3 py-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors">
                    Elimina
                </button>` : ''}
                ${u.role === 'user' ? `<button onclick="showChangeRoleModal(${u.id}, 'admin')" class="px-3 py-1 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-full transition-colors">
                    Rendi Admin
                </button>` : ''}
                ${u.role === 'admin' && !isLastAdmin ? `<button onclick="showChangeRoleModal(${u.id}, 'user')" class="px-3 py-1 text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-full transition-colors">
                    Rendi Utente
                </button>` : ''}
            </div>
        </div>
      `;
    });
  }

  document.getElementById("users-list").innerHTML = html;
  updateUserStats();
}

const promote = (id) =>
  fetch(`/api/users/${id}/promote`, { method: "POST" }).then(fetchUsers);

const demote = (id) =>
  fetch(`/api/users/${id}/demote`, { method: "POST" }).then(fetchUsers);

// Funzioni per il modal di conferma del cambio ruolo
function showChangeRoleModal(userId, newRole) {
  const user = users.find((u) => u.id === userId);
  if (!user) {
    console.error("Utente non trovato per ID:", userId);
    return;
  }

  userToChangeId = user.id;
  userToChangeRole = newRole;

  const modal = document.getElementById("change-role-modal");
  const title = document.getElementById("change-role-modal-title");
  const text = document.getElementById("change-role-modal-text");
  const confirmBtn = document.getElementById("confirm-change-role-btn");
  const cancelBtn = document.getElementById("cancel-change-role-btn");

  title.textContent = `Cambia ruolo per ${user.username}?`;
  text.textContent = `Sei sicuro di voler cambiare il ruolo di ${user.username} da ${user.role} a ${userToChangeRole}?`;
  confirmBtn.textContent = `Sì, rendi ${userToChangeRole}`;
  cancelBtn.textContent = "Annulla";

  if (userToChangeRole === "admin") {
    confirmBtn.className =
      "px-6 py-2 bg-green-500 text-gray-900 rounded-lg hover:bg-green-600 transition-colors";
  } else {
    confirmBtn.className =
      "px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors";
  }

  modal.style.display = "flex";
}

function hideChangeRoleModal() {
  const modal = document.getElementById("change-role-modal");
  modal.style.display = "none";
  userToChangeId = null;
  userToChangeRole = null;
}

// Funzione modificata per il cambio di ruolo
function changeUserRole() {
  if (!userToChangeId || !userToChangeRole) {
    console.error("ID utente o ruolo non definiti.");
    return;
  }

  const apiEndpoint =
    userToChangeRole === "admin"
      ? `/api/users/${userToChangeId}/promote`
      : `/api/users/${userToChangeId}/demote`;

  fetch(apiEndpoint, {
    method: "POST",
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text || "Errore durante il cambio di ruolo");
        });
      }
      return response.text();
    })
    .then(() => {
      hideChangeRoleModal();
      fetchUsers();
    })
    .catch((error) => {
      console.error("Errore:", error);
      alert(error.message); 
      hideChangeRoleModal();
    });
}

function openDeleteUserConfirmModal(id) {
  userToDeleteId = id;
  const user = users.find((u) => u.id == id);
  if (user) {
    document.getElementById("delete-user-name-display").textContent =
      user.username;
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (user.role === "admin" && adminCount <= 1) {
      document.getElementById("delete-admin-warning").style.display = "block";
      document.getElementById("confirm-delete-user").disabled = true;
      document
        .getElementById("confirm-delete-user")
        .classList.add("opacity-50", "cursor-not-allowed");
    } else {
      document.getElementById("delete-admin-warning").style.display = "none";
      document.getElementById("confirm-delete-user").disabled = false;
      document
        .getElementById("confirm-delete-user")
        .classList.remove("opacity-50", "cursor-not-allowed");
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
        document.getElementById("delete-user-confirm-modal").style.display =
          "none";
      });
  }
};

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
      if (msg === "OK") {
        fetchUsers();
        const el = document.getElementById("assign-msg");
        el.textContent = "Corso assegnato con successo!";
        el.className = `mt-4 p-4 rounded-2xl text-sm font-medium bg-green-100 text-green-800`;
        el.classList.remove("hidden");
        setTimeout(() => {
          el.classList.add("hidden");
        }, 3000);
      } else {
        const el = document.getElementById("assign-msg");
        el.textContent = msg;
        el.className = `mt-4 p-4 rounded-2xl text-sm font-medium bg-red-100 text-red-800`;
        el.classList.remove("hidden");
        setTimeout(() => {
          el.classList.add("hidden");
        }, 3000);
      }
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
    document.getElementById("delete-user-confirm-modal").style.display = "none";
  if (e.target === document.getElementById("change-role-modal"))
    hideChangeRoleModal();
};

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

function clearAllFilters() {
  searchUserInput.value = "";
  filterCourseSelect.value = "";
  filterRoleSelect.value = "";
  filterUserDate.value = "";
  toggleFilterCourseVisibility(); 
  renderUsersList();
}

document.addEventListener("DOMContentLoaded", () => {
  searchUserInput = document.getElementById("search-user");
  filterCourseSelect = document.getElementById("filter-course");
  filterRoleSelect = document.getElementById("filter-role");
  filterUserDate = document.getElementById("filter-user-date");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const confirmChangeRoleBtn = document.getElementById(
    "confirm-change-role-btn",
  );
  const cancelChangeRoleBtn = document.getElementById("cancel-change-role-btn");
  const closeChangeRoleBtn = document.getElementById("close-change-role-modal");

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

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearAllFilters);
  }

  confirmChangeRoleBtn.addEventListener("click", changeUserRole);
  cancelChangeRoleBtn.addEventListener("click", hideChangeRoleModal);
  closeChangeRoleBtn.addEventListener("click", hideChangeRoleModal);

  toggleFilterCourseVisibility();
  fetchCourses().then(fetchUsers);
  
  const refreshBtn = document.getElementById('refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchCourses().then(fetchUsers);
    });
  }
});

function updateUserStats() {
  const totalUsers = users.length;
  const totalUsersEl = document.getElementById("total-users");
  if (totalUsersEl) {
    totalUsersEl.textContent = totalUsers;
  }

  const admins = users.filter((u) => u.role === "admin").length;
  const adminCountEl = document.getElementById("admin-count");
  if (adminCountEl) {
    adminCountEl.textContent = admins;
  }

  const userCount = users.filter((u) => u.role === "user").length;
  const userCountEl = document.getElementById("user-count");
  if (userCountEl) {
    userCountEl.textContent = userCount;
  }

  const usersWithCourse = users.filter(u => u.courses && u.courses.length > 0).length;
  const usersWithCourseEl = document.getElementById('users-with-course');
  if (usersWithCourseEl) {
    usersWithCourseEl.textContent = usersWithCourse;
  }

  const usersWithoutCourse = users.filter(u => u.role === 'user' && (!u.courses || u.courses.length === 0)).length;
  const usersWithoutCourseEl = document.getElementById('users-without-course');
  if (usersWithoutCourseEl) {
    usersWithoutCourseEl.textContent = usersWithoutCourse;
  }
  
  const filteredUsers = getFilteredUsers();
  const filteredUsersEl = document.getElementById("filtered-users");
  if (filteredUsersEl) {
    filteredUsersEl.textContent = filteredUsers.length;
  }
}

function getFilteredUsers() {
  let filtered = [...users];

  const roleFilter = document.getElementById("filter-role")?.value;
  if (roleFilter) {
    filtered = filtered.filter((u) => u.role === roleFilter);
  }

  const courseFilter = document.getElementById("filter-course")?.value;
  if (courseFilter) {
    if (courseFilter === "_no_course_") {
      filtered = filtered.filter(
        (u) => u.role === "user" && (!u.courses || u.courses.length === 0)
      );
    } else {
      filtered = filtered.filter(
        (u) => u.courses && u.courses.some((c) => c.id == courseFilter)
      );
    }
  }

  const searchTerm = document.getElementById("search-user").value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(searchTerm) ||
        (u.courses &&
          u.courses.some((c) => c.name.toLowerCase().includes(searchTerm))) ||
        u.role.toLowerCase().includes(searchTerm)
    );
  }

  const dateFilter = document.getElementById("filter-user-date")?.value;
  if (dateFilter) {
    filtered = filtered.filter((u) => u.created_at && u.created_at.startsWith(dateFilter));
  }

  return filtered;
}