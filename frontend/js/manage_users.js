let courses = [];
let users = [];
let editingUserId = null;
let searchUserInput, filterCourseSelect;
let userToDeleteId = null;
let filterRoleSelect;
let filterUserDate;
let userToChangeId = null;
let userToChangeRole = null;

// ── Design tokens (kept in JS so generated HTML matches CSS) ──
const T = {
  pill: "display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;",
  btn: "display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;transition:all .15s;",
};

// ── Fetch ──
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
    const sorted = [...courses].sort((a, b) => a.name.localeCompare(b.name));
    select.innerHTML =
      '<option value="">Nessun corso</option>' +
      sorted.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
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
  const select = document.getElementById("filter-course");
  const sorted = [...courses].sort((a, b) => a.name.localeCompare(b.name));
  select.innerHTML =
    '<option value="">Tutti i corsi</option>' +
    '<option value="_no_course_">Senza corso</option>' +
    sorted.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

function toggleFilterCourseVisibility() {
  const filterRole = document.getElementById("filter-role").value;
  const group = document
    .getElementById("filter-course")
    .closest(".filter-group");
  if (filterRole === "admin") {
    group.style.display = "none";
    document.getElementById("filter-course").value = "";
  } else {
    group.style.display = "";
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

// ── Render ──
function renderUsersList() {
  const tableBody = document.getElementById("users-table-body");
  const search = searchUserInput.value.toLowerCase();
  const courseId = filterCourseSelect.value;
  const filterRole = document.getElementById("filter-role").value;
  const dateFilter = document.getElementById("filter-user-date").value;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const filteredUsers = users
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .filter((u) => {
      const matchName = u.username.toLowerCase().includes(search);
      let matchCourse = true;
      if (courseId) {
        if (courseId === "_no_course_") {
          matchCourse =
            u.role === "user" && (!u.courses || u.courses.length === 0);
        } else {
          matchCourse = u.courses && u.courses.some((c) => c.id == courseId);
        }
      }
      const matchRole = !filterRole || u.role === filterRole;
      const matchDate =
        !dateFilter || (u.created_at && u.created_at.startsWith(dateFilter));
      return matchName && matchCourse && matchRole && matchDate;
    });

  let html = "";
  if (!filteredUsers.length) {
    html = `
      <tr>
        <td colspan="4" style="padding:3rem;text-align:center;">
          <div style="font-size:3rem;margin-bottom:.75rem;">👥</div>
          <p style="font-weight:700;font-size:1rem;color:#374151;margin:0 0 .25rem;">Nessun utente trovato</p>
          <p style="font-size:.875rem;color:#9ca3af;margin:0;">Modifica i filtri per vedere altri risultati.</p>
        </td>
      </tr>`;
  } else {
    filteredUsers.forEach((u) => {
      const isAdmin = u.role === "admin";
      const rolePill = isAdmin
        ? `<span style="${T.pill}background:#f3e8ff;color:#7c3aed;">👑 Admin</span>`
        : `<span style="${T.pill}background:#eff6ff;color:#2563eb;">👤 Utente</span>`;
      const sorted = [...courses].sort((a, b) => a.name.localeCompare(b.name));
      const courseCell =
        u.role === "user"
          ? `<select onchange='assignCourse(${u.id}, this.value)'
              style="width:100%;padding:.4rem .6rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:.8rem;background:#fff;color:#374151;cursor:pointer;outline:none;transition:border .15s;"
              onfocus="this.style.borderColor='#4f46e5'" onblur="this.style.borderColor='#e5e7eb'">
             <option value="">Nessun corso</option>
             ${sorted.map((c) => `<option value="${c.id}" ${u.courses && u.courses[0] && u.courses[0].id == c.id ? "selected" : ""}>${c.name}</option>`).join("")}
           </select>`
          : `<span style="font-style:italic;color:#9ca3af;font-size:.8rem;">N/A</span>`;

      const promoteBtn = !isAdmin
        ? `<button onclick="showChangeRoleModal(${u.id},'admin')" title="Rendi Admin"
              style="${T.btn}background:#f0fdf4;color:#16a34a;" onmouseover="this.style.background='#16a34a';this.style.color='#fff'" onmouseout="this.style.background='#f0fdf4';this.style.color='#16a34a'">👑</button>`
        : `<button onclick="showChangeRoleModal(${u.id},'user')" title="Rendi Utente" ${adminCount <= 1 ? 'disabled style="opacity:.4;cursor:not-allowed;"' : ""}
              style="${T.btn}background:#f9fafb;color:#6b7280;" onmouseover="this.style.background='#6b7280';this.style.color='#fff'" onmouseout="this.style.background='#f9fafb';this.style.color='#6b7280'">👤</button>`;

      const disableDel = isAdmin && adminCount <= 1;
      html += `
        <tr style="border-bottom:1px solid #f3f4f6;transition:background .15s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
          <td style="padding:.875rem 1.25rem;">
            <div style="display:flex;align-items:center;gap:.6rem;">
              <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.85rem;flex-shrink:0;">
                ${u.username[0].toUpperCase()}
              </div>
              <span style="font-size:.875rem;font-weight:600;color:#111827;">${u.username}</span>
            </div>
          </td>
          <td style="padding:.875rem 1.25rem;">${rolePill}</td>
          <td style="padding:.875rem 1.25rem;">${courseCell}</td>
          <td style="padding:.875rem 1.25rem;">
            <div style="display:flex;gap:.4rem;align-items:center;">
              <button onclick="openEditUser(${u.id})" title="Modifica"
                style="${T.btn}background:#eff6ff;color:#2563eb;" onmouseover="this.style.background='#2563eb';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#2563eb'">✏️</button>
              ${promoteBtn}
              <button onclick="deleteUser(${u.id})" title="Elimina" ${disableDel ? 'disabled style="opacity:.4;cursor:not-allowed;"' : ""}
                style="${T.btn}background:#fff5f5;color:#ef4444;" onmouseover="this.style.background='#ef4444';this.style.color='#fff'" onmouseout="this.style.background='#fff5f5';this.style.color='#ef4444'">🗑️</button>
            </div>
          </td>
        </tr>`;
    });
  }

  if (tableBody) tableBody.innerHTML = html;
  updateUserStats();
}

// ── Role change modal ──
function showChangeRoleModal(userId, newRole) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  userToChangeId = user.id;
  userToChangeRole = newRole;
  const modal = document.getElementById("change-role-modal");
  document.getElementById("change-role-modal-title").textContent =
    `Cambia ruolo — ${user.username}`;
  document.getElementById("change-role-modal-text").textContent =
    `Vuoi cambiare il ruolo di ${user.username} da ${user.role} a ${newRole}?`;
  const btn = document.getElementById("confirm-change-role-btn");
  btn.textContent = `Sì, rendi ${newRole}`;
  btn.style.background = newRole === "admin" ? "#16a34a" : "#6b7280";
  modal.style.display = "flex";
}

function hideChangeRoleModal() {
  document.getElementById("change-role-modal").style.display = "none";
  userToChangeId = userToChangeRole = null;
}

function changeUserRole() {
  if (!userToChangeId || !userToChangeRole) return;
  const endpoint =
    userToChangeRole === "admin"
      ? `/api/users/${userToChangeId}/promote`
      : `/api/users/${userToChangeId}/demote`;
  fetch(endpoint, { method: "POST" })
    .then((r) => {
      if (!r.ok)
        return r.text().then((t) => {
          throw new Error(t);
        });
    })
    .then(() => {
      hideChangeRoleModal();
      fetchUsers();
    })
    .catch((err) => {
      console.error(err);
      hideChangeRoleModal();
    });
}

// ── Delete modal ──
function openDeleteUserConfirmModal(id) {
  userToDeleteId = id;
  const user = users.find((u) => u.id == id);
  if (user) {
    document.getElementById("delete-user-name-display").textContent =
      user.username;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const warn = document.getElementById("delete-admin-warning");
    const btn = document.getElementById("confirm-delete-user");
    if (user.role === "admin" && adminCount <= 1) {
      warn.style.display = "block";
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      warn.style.display = "none";
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
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
        console.error(err);
        document.getElementById("delete-user-confirm-modal").style.display =
          "none";
      });
  }
};

function deleteUser(id) {
  openDeleteUserConfirmModal(id);
}

// ── Course assign ──
function assignCourse(id, courseId) {
  fetch(`/api/users/${id}/assign_course`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course_id: courseId }),
  })
    .then((r) => r.text())
    .then((msg) => {
      showMessage(
        "assign-msg",
        msg === "OK" ? "Corso assegnato!" : msg,
        msg === "OK" ? "success" : "error",
      );
      if (msg === "OK") fetchUsers();
    });
}

// ── Edit user ──
function openEditUser(id) {
  editingUserId = id;
  const user = users.find((u) => u.id === id);
  document.getElementById("edit_username").value = user.username;
  document.getElementById("edit_password").value = "";
  document.getElementById("edit-user-password-hint").textContent = "";
  document.getElementById("edit-user-msg").classList.add("hidden");
  document.getElementById("edit-user-modal").style.display = "flex";
}

// ── Message helper ──
function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.cssText = `padding:.75rem 1rem;border-radius:10px;font-size:.875rem;font-weight:500;margin-top:.75rem;
    background:${type === "success" ? "#f0fdf4" : "#fff5f5"};
    color:${type === "success" ? "#15803d" : "#dc2626"};`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// ── Modal open/close ──
document.getElementById("add-user-btn").onclick = () => {
  document.getElementById("add-user-modal").style.display = "flex";
  document.getElementById("add-user-msg").classList.add("hidden");
  updateNewCourseSelect();
};
document.getElementById("close-add-user-modal").onclick = () =>
  (document.getElementById("add-user-modal").style.display = "none");
document.getElementById("cancel-add-user").onclick = () =>
  (document.getElementById("add-user-modal").style.display = "none");
document.getElementById("close-edit-modal").onclick = () =>
  (document.getElementById("edit-user-modal").style.display = "none");
document.getElementById("cancel-edit-user").onclick = () =>
  (document.getElementById("edit-user-modal").style.display = "none");
document.getElementById("close-schedules-modal").onclick = () =>
  (document.getElementById("user-schedules-modal").style.display = "none");

window.onclick = (e) => {
  [
    "edit-user-modal",
    "user-schedules-modal",
    "add-user-modal",
    "delete-user-confirm-modal",
  ].forEach((id) => {
    if (e.target === document.getElementById(id))
      document.getElementById(id).style.display = "none";
  });
  if (e.target === document.getElementById("change-role-modal"))
    hideChangeRoleModal();
};

// ── Password validation ──
const newPassword = document.getElementById("new-password");
const addHint = document.getElementById("add-password-hint");
newPassword.addEventListener("input", () => {
  const v = newPassword.value;
  const missing = [];
  if (v.length < 8) missing.push("8+ caratteri");
  if (!/[A-Z]/.test(v)) missing.push("maiuscola");
  if (!/[a-z]/.test(v)) missing.push("minuscola");
  if (!/[0-9]/.test(v)) missing.push("numero");
  addHint.textContent = missing.length
    ? `Mancano: ${missing.join(", ")}`
    : "✓ Password valida";
  addHint.style.color = missing.length ? "#ef4444" : "#16a34a";
});

const editPassword = document.getElementById("edit_password");
const editHint = document.getElementById("edit-user-password-hint");
editPassword.addEventListener("input", () => {
  const v = editPassword.value;
  const missing = [];
  if (v.length < 8) missing.push("8+ caratteri");
  if (!/[A-Z]/.test(v)) missing.push("maiuscola");
  if (!/[a-z]/.test(v)) missing.push("minuscola");
  if (!/[0-9]/.test(v)) missing.push("numero");
  editHint.textContent = missing.length
    ? `Mancano: ${missing.join(", ")}`
    : "✓ Password valida";
  editHint.style.color = missing.length ? "#ef4444" : "#16a34a";
});

// ── Forms ──
document.getElementById("add-user-form").onsubmit = function (e) {
  e.preventDefault();
  if (addHint.textContent && !addHint.textContent.startsWith("✓")) {
    showMessage("add-user-msg", "Correggi gli errori nella password", "error");
    return;
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
        showMessage("add-user-msg", "Utente creato!", "success");
        this.reset();
        updateNewCourseSelect();
        fetchUsers();
        setTimeout(
          () =>
            (document.getElementById("add-user-modal").style.display = "none"),
          1400,
        );
      } else {
        showMessage("add-user-msg", msg, "error");
      }
    });
};

document.getElementById("edit-user-form").onsubmit = function (e) {
  e.preventDefault();
  if (editHint.textContent && !editHint.textContent.startsWith("✓")) {
    showMessage("edit-user-msg", "Correggi gli errori nella password", "error");
    return;
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
        showMessage("edit-user-msg", "Utente aggiornato!", "success");
        fetchUsers();
        setTimeout(
          () =>
            (document.getElementById("edit-user-modal").style.display = "none"),
          1400,
        );
      } else {
        showMessage("edit-user-msg", msg, "error");
      }
    });
};

// ── Filters ──
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

  searchUserInput.addEventListener("input", renderUsersList);
  filterCourseSelect.addEventListener("change", renderUsersList);
  filterRoleSelect?.addEventListener("change", () => {
    toggleFilterCourseVisibility();
    renderUsersList();
  });
  filterUserDate?.addEventListener("input", renderUsersList);

  document
    .getElementById("clear-filters-btn")
    ?.addEventListener("click", clearAllFilters);
  document
    .getElementById("confirm-change-role-btn")
    .addEventListener("click", changeUserRole);
  document
    .getElementById("cancel-change-role-btn")
    .addEventListener("click", hideChangeRoleModal);
  document
    .getElementById("close-change-role-modal")
    .addEventListener("click", hideChangeRoleModal);

  toggleFilterCourseVisibility();
  fetchCourses().then(fetchUsers);

  document
    .getElementById("refresh-data")
    ?.addEventListener("click", () => fetchCourses().then(fetchUsers));
});

// ── Stats ──
function updateUserStats() {
  const total = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const regular = users.filter((u) => u.role === "user").length;
  const withCourse = users.filter(
    (u) => u.courses && u.courses.length > 0,
  ).length;
  const withoutCourse = users.filter(
    (u) => u.role === "user" && (!u.courses || u.courses.length === 0),
  ).length;

  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("total-users", total);
  set("admin-count", admins);
  set("user-count", regular);
  set("users-with-course", withCourse);
  set("users-without-course", withoutCourse);
  set("filtered-users", getFilteredUsers().length);
}

function getFilteredUsers() {
  let f = [...users];
  const role = document.getElementById("filter-role")?.value;
  if (role) f = f.filter((u) => u.role === role);
  const course = document.getElementById("filter-course")?.value;
  if (course) {
    if (course === "_no_course_")
      f = f.filter(
        (u) => u.role === "user" && (!u.courses || u.courses.length === 0),
      );
    else
      f = f.filter((u) => u.courses && u.courses.some((c) => c.id == course));
  }
  const search = document.getElementById("search-user").value.toLowerCase();
  if (search) f = f.filter((u) => u.username.toLowerCase().includes(search));
  const date = document.getElementById("filter-user-date")?.value;
  if (date) f = f.filter((u) => u.registration_date === date);
  return f;
}

fetchCourses().then(fetchUsers);

// ── Real-time ──
document.addEventListener("DOMContentLoaded", () => {
  if (!window.AppSocket) return;
  AppSocket.on("users_updated", ({ action }) => {
    fetchCourses().then(fetchUsers);
    showToast(action);
  });
  AppSocket.on("courses_updated", () => fetchCourses().then(fetchUsers));
});

function showToast(action) {
  const labels = {
    created: "✅ Nuovo utente creato",
    deleted: "🗑️ Utente eliminato",
    edited: "✏️ Utente modificato",
    promoted: "👑 Promosso ad admin",
    demoted: "👤 Retrocesso a utente",
    course_assigned: "📚 Corso aggiornato",
    profile_updated: "👤 Profilo aggiornato",
  };
  _toast(labels[action] || "🔄 Dati aggiornati");
}

function _toast(msg) {
  const t = document.createElement("div");
  t.style.cssText =
    "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:#1e1b4b;color:#e0e7ff;padding:.7rem 1.1rem;border-radius:12px;font-size:.8rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none;animation:_toastIn .25s ease;";
  if (!document.getElementById("_toastStyle")) {
    const s = document.createElement("style");
    s.id = "_toastStyle";
    s.textContent =
      "@keyframes _toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(s);
  }
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = "opacity .35s";
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 350);
  }, 2800);
}
