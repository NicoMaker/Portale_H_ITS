let allCourses = [];
let users = [];
let courseToDeleteId = null;
let editingCourseId = null;

// ── Fetch ──
function fetchCourses() {
  fetch('/api/courses')
    .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
    .then(courses => { allCourses = courses; return fetch('/api/users'); })
    .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
    .then(u => { users = u; renderCoursesList(); })
    .catch(err => {
      const tb = document.getElementById('courses-table-body');
      if (tb) tb.innerHTML = `
        <tr><td colspan="3" style="padding:3rem;text-align:center;color:#ef4444;font-weight:500;">
          ⚠️ Errore nel caricamento: ${err.message}
        </td></tr>`;
    });
}

// ── Message ──
function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.cssText = `padding:.75rem 1rem;border-radius:10px;font-size:.875rem;font-weight:500;margin-top:.75rem;
    background:${type === 'success' ? '#f0fdf4' : '#fff5f5'};
    color:${type === 'success' ? '#15803d' : '#dc2626'};`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── Add course modal ──
document.getElementById('add-course-btn').onclick = () => {
  document.getElementById('add-course-modal').style.display = 'flex';
  document.getElementById('course-msg').classList.add('hidden');
};
document.getElementById('close-add-course-modal').onclick = () => document.getElementById('add-course-modal').style.display = 'none';
document.getElementById('cancel-add-course').onclick      = () => document.getElementById('add-course-modal').style.display = 'none';

document.getElementById('add-course-form').onsubmit = function(e) {
  e.preventDefault();
  fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('course-name').value,
      description: document.getElementById('course-desc').value,
    }),
  }).then(r => r.text()).then(msg => {
    if (msg === 'OK') {
      fetchCourses();
      showMessage('course-msg', 'Corso aggiunto!', 'success');
      this.reset();
      setTimeout(() => document.getElementById('add-course-modal').style.display = 'none', 1400);
    } else {
      showMessage('course-msg', msg, 'error');
    }
  });
};

// ── Edit course ──
function openEditCourse(id) {
  editingCourseId = id;
  const course = allCourses.find(c => c.id == id);
  if (course) {
    document.getElementById('edit-course-name').value = course.name;
    document.getElementById('edit-course-desc').value = course.description || '';
  }
  document.getElementById('edit-course-msg').classList.add('hidden');
  document.getElementById('edit-course-modal').style.display = 'flex';
}

document.getElementById('close-edit-course-modal').onclick = () => document.getElementById('edit-course-modal').style.display = 'none';
document.getElementById('cancel-edit-course').onclick      = () => document.getElementById('edit-course-modal').style.display = 'none';

window.onclick = e => {
  ['edit-course-modal','add-course-modal','delete-confirm-modal'].forEach(id => {
    if (e.target?.id === id) document.getElementById(id).style.display = 'none';
  });
};

document.getElementById('edit-course-form').onsubmit = function(e) {
  e.preventDefault();
  fetch(`/api/courses/${editingCourseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: document.getElementById('edit-course-name').value,
      description: document.getElementById('edit-course-desc').value,
    }),
  }).then(r => r.text()).then(msg => {
    if (msg === 'OK') {
      fetchCourses();
      showMessage('edit-course-msg', 'Corso aggiornato!', 'success');
      setTimeout(() => document.getElementById('edit-course-modal').style.display = 'none', 1400);
    } else {
      showMessage('edit-course-msg', msg, 'error');
    }
  });
};

// ── Delete course ──
function deleteCourse(id) {
  courseToDeleteId = id;
  const course = allCourses.find(c => c.id == id);
  if (course) document.getElementById('delete-course-name-display').textContent = course.name;
  document.getElementById('delete-confirm-modal').style.display = 'flex';
}

document.getElementById('close-delete-confirm-modal').onclick = () => document.getElementById('delete-confirm-modal').style.display = 'none';
document.getElementById('cancel-delete-course').onclick       = () => document.getElementById('delete-confirm-modal').style.display = 'none';
document.getElementById('confirm-delete-course').onclick = () => {
  if (courseToDeleteId) {
    fetch(`/api/courses/${courseToDeleteId}`, { method: 'DELETE' })
      .then(() => { fetchCourses(); document.getElementById('delete-confirm-modal').style.display = 'none'; })
      .catch(err => { console.error(err); document.getElementById('delete-confirm-modal').style.display = 'none'; });
  }
};

// ── Render ──
function renderCoursesList() {
  const tableBody  = document.getElementById('courses-table-body');
  const searchQ    = document.getElementById('search-course')?.value?.toLowerCase() || '';
  const userFilter = document.getElementById('user-filter')?.value || 'all';

  const withUsersIds = new Set(users.flatMap(u => u.courses.map(c => c.id)));

  const filtered = allCourses
    .filter(c => userFilter === 'with_users' ? withUsersIds.has(c.id) : userFilter === 'without_users' ? !withUsersIds.has(c.id) : true)
    .filter(c => c.name.toLowerCase().includes(searchQ) || (c.description && c.description.toLowerCase().includes(searchQ)))
    .sort((a,b) => a.name.localeCompare(b.name));

  let html = '';
  if (!filtered.length) {
    html = `
      <tr>
        <td colspan="3" style="padding:3rem;text-align:center;">
          <div style="font-size:3rem;margin-bottom:.75rem;">📚</div>
          <p style="font-weight:700;font-size:1rem;color:#374151;margin:0 0 .25rem;">Nessun corso trovato</p>
          <p style="font-size:.875rem;color:#9ca3af;margin:0;">Modifica i filtri per vedere altri risultati.</p>
        </td>
      </tr>`;
  } else {
    filtered.forEach(course => {
      const enrolledUsers = users.filter(u => u.courses && u.courses.some(c => c.id === course.id));
      const hasUsers = enrolledUsers.length > 0;
      html += `
        <tr style="border-bottom:1px solid #f3f4f6;transition:background .15s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
          <td style="padding:.875rem 1.25rem;">
            <div style="display:flex;align-items:center;gap:.75rem;">
              <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">📚</div>
              <div>
                <div style="font-size:.875rem;font-weight:600;color:#111827;">${course.name}</div>
                ${hasUsers ? `<div style="font-size:.75rem;color:#6b7280;margin-top:2px;">${enrolledUsers.length} iscritto${enrolledUsers.length !== 1 ? 'i' : ''}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:.875rem 1.25rem;">
            <span style="font-size:.8rem;color:#6b7280;">${course.description || '<span style="font-style:italic;color:#9ca3af;">Nessuna descrizione</span>'}</span>
          </td>
          <td style="padding:.875rem 1.25rem;">
            <div style="display:flex;gap:.4rem;">
              <button onclick="openEditCourse(${course.id})" title="Modifica"
                style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;background:#eff6ff;color:#2563eb;transition:all .15s;"
                onmouseover="this.style.background='#2563eb';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#2563eb'">✏️</button>
              <button onclick="deleteCourse(${course.id})" title="Elimina"
                style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;background:#fff5f5;color:#ef4444;transition:all .15s;"
                onmouseover="this.style.background='#ef4444';this.style.color='#fff'" onmouseout="this.style.background='#fff5f5';this.style.color='#ef4444'">🗑️</button>
            </div>
          </td>
        </tr>`;
    });
  }

  if (tableBody) tableBody.innerHTML = html;
  updateCourseStats();
}

// ── Stats ──
function updateCourseStats() {
  const withUsersIds = new Set(users.flatMap(u => u.courses.map(c => c.id)));
  const withUsers    = allCourses.filter(c => withUsersIds.has(c.id)).length;
  const searchQ    = document.getElementById('search-course')?.value?.toLowerCase() || '';
  const userFilter = document.getElementById('user-filter')?.value || 'all';
  const filtered = allCourses
    .filter(c => userFilter === 'with_users' ? withUsersIds.has(c.id) : userFilter === 'without_users' ? !withUsersIds.has(c.id) : true)
    .filter(c => c.name.toLowerCase().includes(searchQ) || (c.description && c.description.toLowerCase().includes(searchQ)));

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('total-courses', allCourses.length);
  set('courses-with-users', withUsers);
  set('courses-without-users', allCourses.length - withUsers);
  set('filtered-courses', filtered.length);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  fetchCourses();
  document.getElementById('search-course')?.addEventListener('input', renderCoursesList);
  document.getElementById('user-filter')?.addEventListener('change', renderCoursesList);
});

// ── Real-time ──
document.addEventListener('DOMContentLoaded', () => {
  if (!window.AppSocket) return;
  AppSocket.on('courses_updated', fetchCourses);
  AppSocket.on('users_updated', fetchCourses);
});
