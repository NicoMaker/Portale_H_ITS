// Rendering della tabella utenti e delle card statistiche
import { state } from "./state.js";

// Design tokens (in JS così l'HTML generato è coerente con il CSS)
const T = {
  pill: "display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;",
  btn: "display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;transition:all .15s;",
};

export function renderUsersList() {
  const tableBody = document.getElementById("users-table-body");
  const search = document.getElementById("search-user").value.toLowerCase();
  const courseId = document.getElementById("filter-course").value;
  const filterRole = document.getElementById("filter-role").value;
  const dateFilter = document.getElementById("filter-user-date").value;
  const adminCount = state.users.filter((u) => u.role === "admin").length;

  const filteredUsers = state.users
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
      const sorted = [...state.courses].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
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

export function updateUserStats() {
  const users = state.users;
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
  let f = [...state.users];
  const role = document.getElementById("filter-role")?.value;
  if (role) f = f.filter((u) => u.role === role);
  const course = document.getElementById("filter-course")?.value;
  if (course) {
    if (course === "_no_course_")
      f = f.filter(
        (u) => u.role === "user" && (!u.courses || u.courses.length === 0),
      );
    else f = f.filter((u) => u.courses && u.courses.some((c) => c.id == course));
  }
  const search = document.getElementById("search-user").value.toLowerCase();
  if (search) f = f.filter((u) => u.username.toLowerCase().includes(search));
  const date = document.getElementById("filter-user-date")?.value;
  if (date) f = f.filter((u) => u.registration_date === date);
  return f;
}
