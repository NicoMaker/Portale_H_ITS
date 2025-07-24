let courses = [];
let users = [];
let editingUserId = null;
let searchUserInput, filterCourseSelect;
const fetchCourses = () =>
  fetch('/api/courses').then(r => r.json()).then(data => { courses = data; updateNewCourseSelect(); updateFilterCourseSelect(); });

function updateNewCourseSelect() {
  const select = document.getElementById('new-course');
  if (document.getElementById('new-role').value === 'user') {
    select.style.display = '';
    select.innerHTML = '<option value="">Nessun corso</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } else {
    select.style.display = 'none';
  }
}
document.getElementById('new-role').onchange = updateNewCourseSelect;
function updateFilterCourseSelect() {
  filterCourseSelect.innerHTML = '<option value="">Tutti i corsi</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
function fetchUsers() {
  fetch('/api/users').then(r => r.json()).then(data => {
    users = data;
    renderUsersList();
  });
}
function renderUsersList() {
  const search = searchUserInput.value.toLowerCase();
  const courseId = filterCourseSelect.value;
  const filterRoleSelect = document.getElementById('filter-role');
  const filterRole = filterRoleSelect ? filterRoleSelect.value : '';
  const dateFilter = document.getElementById('filter-user-date').value;
  const adminCount = users.filter(u => u.role === "admin").length;
  let html = '<table><tr><th>Username</th><th>Ruolo</th><th>Corso</th><th>Azioni</th></tr>';
  users
    .slice().sort((a, b) => a.username.localeCompare(b.username))
    .filter(u => {
      const matchName = u.username.toLowerCase().includes(search);
      const matchCourse = u.role === 'admin' ? (!courseId || courseId === '') : (!courseId || (u.courses && u.courses[0] && u.courses[0].id == courseId));
      const matchRole = !filterRole || u.role === filterRole;
      const matchDate = !dateFilter || (u.created_at && u.created_at.startsWith(dateFilter));
      return matchName && matchCourse && matchRole && matchDate;
    })
    .forEach(u => {
      html += `<tr><td>${u.username}</td><td>`;
      html += `<span class='badge ${u.role}'>${u.role === 'admin' ? 'Admin' : 'Utente'}</span>`;
      html += `</td><td>`;
      if (filterRole === 'admin') {
        html += '<span style="color:#888">-</span>';
      } else if (u.role === "user") {
        html += `<select onchange='assignCourse(${u.id}, this.value)' style="min-width:120px;">`;
        html += `<option value="">Nessun corso</option>`;
        courses.forEach(c => {
          const selected = (u.courses && u.courses[0] && u.courses[0].id == c.id) ? 'selected' : '';
          html += `<option value="${c.id}" ${selected}>${c.name}</option>`;
        });
        html += `</select>`;
      } else {
        html += '<span style="color:#888">-</span>';
      }
      html += `</td><td>`;
      if (filterRole === 'admin') {
        html += `<button onclick='openEditUser(${u.id})'>Modifica</button> `;
        if (adminCount > 1) html += `<button onclick='demote(${u.id})'>Rendi Utente</button>`;
        if (adminCount > 1) html += `<button onclick='deleteUser(${u.id})'>Elimina</button>`;
      } else {
        html += `<button onclick='openEditUser(${u.id})'>Modifica</button> `;
        if (u.role !== "admin") html += `<button onclick='promote(${u.id})'>Rendi Admin</button>`;
        if (u.role === "admin" && adminCount > 1) html += `<button onclick='demote(${u.id})'>Rendi Utente</button>`;
        if (adminCount > 1 || u.role !== "admin") html += `<button onclick='deleteUser(${u.id})'>Elimina</button>`;
      }
      html += `</td></tr>`;
    });
  html += '</table>';
  document.getElementById('users-list').innerHTML = html;
}
function promote(id) {
  fetch(`/api/users/${id}/promote`, { method: 'POST' }).then(() => fetchUsers());
}
function demote(id) {
  fetch(`/api/users/${id}/demote`, { method: 'POST' }).then(() => fetchUsers());
}
function deleteUser(id) {
  if (confirm('Sei sicuro di voler eliminare questo utente?'))
    fetch(`/api/users/${id}`, { method: 'DELETE' }).then(() => fetchUsers());
}
function assignCourse(id, courseId) {
  fetch(`/api/users/${id}/assign_course`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId }) })
    .then(r => r.text())
    .then(msg => {
      fetchUsers();
      const el = document.getElementById('assign-msg');
      if (msg === 'OK') {
        el.textContent = 'Corso assegnato con successo!';
        el.className = 'success';
      } else {
        el.textContent = msg;
        el.className = 'hint';
      }
      setTimeout(() => { el.textContent = ''; }, 2500);
    });
}
// Modifica utente
function openEditUser(id) {
  editingUserId = id;
  const user = users.find(u => u.id === id);
  document.getElementById('edit_username').value = user.username;
  document.getElementById('edit_password').value = '';
  document.getElementById('edit-user-password-hint').textContent = '';
  document.getElementById('edit-user-msg').textContent = '';
  document.getElementById('edit-user-modal').style.display = 'flex';
}
document.getElementById('close-edit-modal').onclick = () => {
  document.getElementById('edit-user-modal').style.display = 'none';
};
window.onclick = e => {
  if (e.target === document.getElementById('edit-user-modal'))
    document.getElementById('edit-user-modal').style.display = 'none';
  if (e.target === document.getElementById('user-schedules-modal'))
    document.getElementById('user-schedules-modal').style.display = 'none';
};
// Validazione password
const editPassword = document.getElementById('edit_password');
const editHint = document.getElementById('edit-user-password-hint');
editPassword.addEventListener('input', () => {
  const val = editPassword.value;
  let msg = '';
  if (val.length < 8) msg += 'Min 8 caratteri. ';
  if (!/[A-Z]/.test(val)) msg += 'Almeno una maiuscola. ';
  if (!/[a-z]/.test(val)) msg += 'Almeno una minuscola. ';
  if (!/[0-9]/.test(val)) msg += 'Almeno un numero. ';
  editHint.textContent = msg;
  editHint.style.color = msg ? 'var(--accent)' : 'green';
});
document.getElementById('edit-user-form').onsubmit = function (e) {
  if (editHint.textContent) {
    e.preventDefault();
    editHint.style.color = 'red';
    return false;
  }
  e.preventDefault();
  fetch(`/api/users/${editingUserId}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: document.getElementById('edit_username').value, password: editPassword.value })
  }).then(r => r.text()).then(msg => {
    document.getElementById('edit-user-msg').textContent = msg;
    if (msg === 'OK') setTimeout(() => { document.getElementById('edit-user-modal').style.display = 'none'; fetchUsers(); }, 1000);
  });
};
// Orari utente
function showUserSchedules(userId, courseId) {
  fetch('/api/schedules').then(r => r.json()).then(schedules => {
    const scheds = schedules.filter(s => s.course_id == courseId);
    let html = '';
    if (!scheds.length) {
      html = '<div class="hint">Nessun orario trovato per il corso assegnato a questo utente.</div>';
    } else {
      html = '<div style="overflow-x:auto"><table class="schedule-table"><tr><th>Docente</th><th>Aula</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th></tr>' +
        scheds.map(s => `<tr><td>${s.teacher}</td><td>${s.room}</td><td>${s.day}</td><td>${typeof formatDate === 'function' ? formatDate(s.date) : s.date}</td><td>${s.start_time}</td><td>${s.end_time}</td></tr>`).join('') + '</table></div>';
    }
    document.getElementById('user-schedules-content').innerHTML = html;
    document.getElementById('user-schedules-modal').style.display = 'flex';
  });
}
document.getElementById('close-schedules-modal').onclick = () => {
  document.getElementById('user-schedules-modal').style.display = 'none';
};
// Validazione password live
const newPassword = document.getElementById('new-password');
const addHint = document.getElementById('add-password-hint');
newPassword.addEventListener('input', () => {
  const val = newPassword.value;
  let msg = '';
  if (val.length < 8) msg += 'Min 8 caratteri. ';
  if (!/[A-Z]/.test(val)) msg += 'Almeno una maiuscola. ';
  if (!/[a-z]/.test(val)) msg += 'Almeno una minuscola. ';
  if (!/[0-9]/.test(val)) msg += 'Almeno un numero. ';
  addHint.textContent = msg;
  addHint.style.color = msg ? 'var(--accent)' : 'green';
});
document.getElementById('add-user-form').onsubmit = function (e) {
  if (addHint.textContent) {
    e.preventDefault();
    addHint.style.color = 'red';
    return false;
  }
  e.preventDefault();
  fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: document.getElementById('new-username').value, password: newPassword.value, role: document.getElementById('new-role').value, course_id: document.getElementById('new-course').value })
  }).then(r => r.text()).then(msg => {
    document.getElementById('add-user-msg').textContent = msg;
    if (msg === 'OK') {
      this.reset();
      fetchUsers();
    }
  });
};
document.addEventListener('DOMContentLoaded', () => {
  searchUserInput = document.getElementById('search-user');
  filterCourseSelect = document.getElementById('filter-course');
  const filterRoleSelect = document.getElementById('filter-role');
  const filterUserDate = document.getElementById('filter-user-date');
  if (searchUserInput && filterCourseSelect) {
    searchUserInput.addEventListener('input', renderUsersList);
    filterCourseSelect.addEventListener('change', renderUsersList);
    if (filterRoleSelect) filterRoleSelect.addEventListener('change', renderUsersList);
    if (filterUserDate) filterUserDate.addEventListener('input', renderUsersList);
  }
});
fetchCourses().then(fetchUsers);
// Importa la funzione formatDate
if (typeof window.formatDate !== 'function') {
  const script = document.createElement('script');
  script.src = 'js/utils.js';
  document.head.appendChild(script);
} 