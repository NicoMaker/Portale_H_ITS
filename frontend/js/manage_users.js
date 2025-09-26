let courses = [];
let users = [];
let editingUserId = null;
let searchUserInput, filterCourseSelect, filterRoleSelect;
let userToDeleteId = null;
let userToChangeId = null;
let userToChangeRole = null;
let usersListEl, noUsersFoundEl;

const fetchCourses = () =>
  fetch("/api/courses")
    .then((r) => r.json())
    .then((data) => {
      courses = data;
      updateCourseSelects();
    });

const fetchUsers = () =>
  fetch("/api/users")
    .then((r) => r.json())
    .then((data) => {
      users = data;
      renderUsersList();
      updateUserStats();
    });

function updateCourseSelects() {
  const newCourseSelect = document.getElementById("new-course");
  const filterCourseSelect = document.getElementById("filter-course");

  const courseOptions = courses.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  
  if (newCourseSelect) {
    newCourseSelect.innerHTML = '<option value="">Nessun corso</option>' + courseOptions;
  }
  if (filterCourseSelect) {
    filterCourseSelect.innerHTML = '<option value="">Tutti i corsi</option><option value="_no_course_">Senza corso</option>' + courseOptions;
  }
}

function toggleNewCourseVisibility() {
  const role = document.getElementById("new-role").value;
  const courseGroup = document.getElementById("new-course-group");
  if (role === "user") {
    courseGroup.style.display = "";
  } else {
    courseGroup.style.display = "none";
  }
}

function renderUsersList() {
  const search = searchUserInput.value.toLowerCase();
  const courseId = filterCourseSelect.value;
  const roleFilter = filterRoleSelect.value;
  const adminCount = users.filter((u) => u.role === "admin").length;

  let html = "";
  
  const filteredUsers = users
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .filter((u) => {
      const matchName = u.username.toLowerCase().includes(search);
      const matchRole = !roleFilter || u.role === roleFilter;
      
      let matchCourse = true;
      if (courseId) {
        if (courseId === '_no_course_') {
          matchCourse = u.role === 'user' && (!u.courses || u.courses.length === 0);
        } else {
          matchCourse = u.courses && u.courses.some(c => c.id == courseId);
        }
      }
      
      return matchName && matchRole && matchCourse;
    });

  if (filteredUsers.length === 0) {
    noUsersFoundEl.style.display = 'block';
    usersListEl.innerHTML = '';
  } else {
    noUsersFoundEl.style.display = 'none';
    filteredUsers.forEach((u) => {
      const assignedCourse = u.courses && u.courses.length > 0 ? u.courses[0].name : 'Nessun corso';
      
      html += `
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl rounded-full bg-gray-200">${u.role === 'admin' ? '👑' : '👤'}</div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${u.username}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
              ${u.role === 'admin' ? 'Amministratore' : 'Utente'}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${u.role === 'user' ? `<select onchange='assignCourse(${u.id}, this.value)' class="block w-full text-sm border-gray-300 rounded-md">${courses.map(c => `<option value="${c.id}" ${u.courses && u.courses[0] && u.courses[0].id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}<option value="">Nessun corso</option></select>` : 'N/A'}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex justify-end space-x-2">
              <button onclick="openEditUser(${u.id})" class="text-indigo-600 hover:text-indigo-900 transition-colors" title="Modifica"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg></button>
              ${u.role !== 'admin' ? `<button onclick="showChangeRoleModal(${u.id}, 'admin')" class="text-yellow-600 hover:text-yellow-900 transition-colors" title="Rendi Admin"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fill-rule="evenodd" d="M.458 10C1.732 5.093 6.002 2 10 2s8.268 3.093 9.542 8c-1.274 4.907-5.544 8-9.542 8S1.732 14.907.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path></svg></button>` : ''}
              ${u.role === 'admin' && adminCount > 1 ? `<button onclick="showChangeRoleModal(${u.id}, 'user')" class="text-gray-600 hover:text-gray-900 transition-colors" title="Rendi Utente"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zm3.881 12.007a2 2 0 01-1.34-2.858C14.154 13.922 12.016 13 10 13c-2.015 0-4.154.922-5.54 2.149a2 2 0 01-1.34 2.858C2.502 18.91 4.549 20 7 20h6c2.451 0 4.498-1.09 5.881-2.993z"></path></svg></button>` : ''}
              ${adminCount > 1 || u.role !== 'admin' ? `<button onclick="deleteUser(${u.id})" class="text-red-600 hover:text-red-900 transition-colors" title="Elimina"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg></button>` : ''}
            </div>
          </td>
        </tr>
      `;
    });
    usersListEl.innerHTML = html;
  }
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
    } else {
      console.error("Failed to assign course:", msg);
    }
  })
  .catch((err) => {
    console.error("Error during course assignment:", err);
  });
}

function openEditUser(id) {
  editingUserId = id;
  const user = users.find((u) => u.id === id);
  if (user) {
    document.getElementById("edit_username").value = user.username;
    document.getElementById("edit_password").value = "";
    document.getElementById("edit-user-password-hint").textContent = "Lascia vuoto per mantenere la password attuale. Se la modifichi, deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero.";
    document.getElementById("edit-user-msg").classList.add("hidden");
    document.getElementById("edit-user-modal").style.display = "flex";
  }
}

function showChangeRoleModal(userId, newRole) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  
  userToChangeId = user.id;
  userToChangeRole = newRole;

  const modal = document.getElementById("change-role-modal");
  const title = document.getElementById("change-role-modal-title");
  const text = document.getElementById("change-role-modal-text");
  const confirmBtn = document.getElementById("confirm-change-role-btn");
  
  title.textContent = `Cambia ruolo per ${user.username}?`;
  text.textContent = `Sei sicuro di voler cambiare il ruolo di ${user.username} da "${user.role}" a "${newRole}"?`;
  confirmBtn.textContent = `Sì, Rendi ${newRole}`;
  confirmBtn.className = `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
    newRole === 'admin' ? 'text-white bg-green-600 hover:bg-green-700' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
  }`;
  
  modal.style.display = "flex";
}

function hideChangeRoleModal() {
  document.getElementById("change-role-modal").style.display = "none";
  userToChangeId = null;
  userToChangeRole = null;
}

function changeUserRole() {
  if (!userToChangeId || !userToChangeRole) return;

  const apiEndpoint = userToChangeRole === "admin" ? `/api/users/${userToChangeId}/promote` : `/api/users/${userToChangeId}/demote`;

  fetch(apiEndpoint, { method: "POST" })
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

function deleteUser(id) {
  userToDeleteId = id;
  const user = users.find((u) => u.id == id);
  const adminCount = users.filter((u) => u.role === "admin").length;

  if (user) {
    document.getElementById("delete-user-name-display").textContent = user.username;
    if (user.role === 'admin' && adminCount <= 1) {
      document.getElementById("delete-admin-warning").style.display = "block";
      document.getElementById("confirm-delete-user").disabled = true;
      document.getElementById("confirm-delete-user").classList.add("opacity-50", "cursor-not-allowed");
    } else {
      document.getElementById("delete-admin-warning").style.display = "none";
      document.getElementById("confirm-delete-user").disabled = false;
      document.getElementById("confirm-delete-user").classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
  document.getElementById("delete-user-confirm-modal").style.display = "flex";
}

function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.className = `mt-4 p-3 rounded-md text-sm ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    el.classList.remove("hidden");
    setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }
}

function validatePassword(password) {
  let msg = [];
  if (password.length < 8) msg.push("Min 8 caratteri.");
  if (!/[A-Z]/.test(password)) msg.push("Almeno una maiuscola.");
  if (!/[a-z]/.test(password)) msg.push("Almeno una minuscola.");
  if (!/[0-9]/.test(password)) msg.push("Almeno un numero.");
  return msg.join(' ');
}

function updateUserStats() {
  const totalUsers = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const regularUsers = users.filter((u) => u.role === "user").length;
  const usersWithCourse = users.filter(u => u.courses && u.courses.length > 0).length;

  document.getElementById("total-users").textContent = totalUsers;
  document.getElementById("admin-count").textContent = admins;
  document.getElementById("user-count").textContent = regularUsers;
  document.getElementById("users-with-course").textContent = usersWithCourse;
}

function clearAllFilters() {
  searchUserInput.value = "";
  filterCourseSelect.value = "";
  filterRoleSelect.value = "";
  renderUsersList();
}

document.addEventListener("DOMContentLoaded", () => {
  searchUserInput = document.getElementById("search-user");
  filterCourseSelect = document.getElementById("filter-course");
  filterRoleSelect = document.getElementById("filter-role");
  usersListEl = document.getElementById("users-list");
  noUsersFoundEl = document.getElementById("no-users-found");

  // Event Listeners for Filters
  searchUserInput?.addEventListener("input", renderUsersList);
  filterCourseSelect?.addEventListener("change", renderUsersList);
  filterRoleSelect?.addEventListener("change", renderUsersList);
  document.getElementById("clear-filters-btn")?.addEventListener("click", clearAllFilters);
  document.getElementById('refresh-data')?.addEventListener('click', fetchUsers);

  // Add User Modal
  document.getElementById("add-user-btn")?.addEventListener("click", () => {
    document.getElementById("add-user-modal").style.display = "flex";
    document.getElementById("add-user-form").reset();
    document.getElementById("add-user-msg").classList.add("hidden");
    document.getElementById("add-password-hint").textContent = '';
    toggleNewCourseVisibility();
  });
  document.getElementById("close-add-user-modal")?.addEventListener("click", () => document.getElementById("add-user-modal").style.display = "none");
  document.getElementById("cancel-add-user")?.addEventListener("click", () => document.getElementById("add-user-modal").style.display = "none");
  document.getElementById("new-role")?.addEventListener("change", toggleNewCourseVisibility);

  // Edit User Modal
  document.getElementById("close-edit-modal")?.addEventListener("click", () => document.getElementById("edit-user-modal").style.display = "none");
  document.getElementById("cancel-edit-user")?.addEventListener("click", () => document.getElementById("edit-user-modal").style.display = "none");

  // Delete User Modal
  document.getElementById("close-delete-user-confirm-modal")?.addEventListener("click", () => document.getElementById("delete-user-confirm-modal").style.display = "none");
  document.getElementById("cancel-delete-user-modal")?.addEventListener("click", () => document.getElementById("delete-user-confirm-modal").style.display = "none");
  document.getElementById("confirm-delete-user")?.addEventListener("click", () => {
    if (userToDeleteId) {
      fetch(`/api/users/${userToDeleteId}`, { method: "DELETE" })
        .then(() => {
          fetchUsers();
          document.getElementById("delete-user-confirm-modal").style.display = "none";
        })
        .catch((err) => console.error("Errore durante l'eliminazione:", err));
    }
  });

  // Change Role Modal
  document.getElementById("confirm-change-role-btn")?.addEventListener("click", changeUserRole);
  document.getElementById("cancel-change-role-btn")?.addEventListener("click", hideChangeRoleModal);
  document.getElementById("close-change-role-modal")?.addEventListener("click", hideChangeRoleModal);

  // Form Submissions
  document.getElementById("add-user-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("new-password").value;
    const passwordHint = validatePassword(password);
    if (passwordHint) {
      showMessage("add-user-msg", "Correggi gli errori nella password.", "error");
      document.getElementById("add-password-hint").textContent = passwordHint;
      return;
    }

    const data = {
      username: document.getElementById("new-username").value,
      password: password,
      role: document.getElementById("new-role").value,
      course_id: document.getElementById("new-course").value,
    };
    
    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        showMessage("add-user-msg", "Utente creato con successo!", "success");
        e.target.reset();
        fetchUsers();
        setTimeout(() => document.getElementById("add-user-modal").style.display = "none", 1500);
      } else {
        showMessage("add-user-msg", msg, "error");
      }
    });
  });

  document.getElementById("edit-user-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const password = document.getElementById("edit_password").value;
    if (password && validatePassword(password)) {
      showMessage("edit-user-msg", "Correggi gli errori nella password.", "error");
      return;
    }
    
    const data = {
      username: document.getElementById("edit_username").value,
      password: password || undefined,
    };

    fetch(`/api/users/${editingUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        showMessage("edit-user-msg", "Utente aggiornato con successo!", "success");
        fetchUsers();
        setTimeout(() => document.getElementById("edit-user-modal").style.display = "none", 1500);
      } else {
        showMessage("edit-user-msg", msg, "error");
      }
    });
  });

  // Initial Data Fetch
  fetchCourses().then(fetchUsers);
});