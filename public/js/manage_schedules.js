let courses = [];
let schedules = [];
let editingScheduleId = null;
let searchScheduleCourseInput, filterScheduleCourseSelect, allSchedules = [], allCourses = [];
function fetchCoursesAndSchedules() {
  Promise.all([
    fetch('/api/courses').then(r => r.json()),
    fetch('/api/schedules').then(r => r.json())
  ]).then(([allCourses, allSchedules]) => {
    courses = allCourses;
    schedules = allSchedules;
    const select = document.getElementById('filter-course');
    select.innerHTML = '<option value="">Tutti i corsi</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    renderSchedules();
  });
}
document.getElementById('filter-course').onchange = renderSchedules;
function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function renderSchedules() {
  const courseId = document.getElementById('filter-course').value;
  const teacherFilter = document.getElementById('filter-teacher').value.toLowerCase();
  const roomFilter = document.getElementById('filter-room').value.toLowerCase();
  const subjectFilter = document.getElementById('filter-subject').value.toLowerCase();
  let filtered = schedules;
  if (courseId) filtered = filtered.filter(s => String(s.course_id) === String(courseId));
  if (teacherFilter) filtered = filtered.filter(s => s.teacher && s.teacher.toLowerCase().includes(teacherFilter));
  if (roomFilter) filtered = filtered.filter(s => s.room && s.room.toLowerCase().includes(roomFilter));
  if (subjectFilter) filtered = filtered.filter(s => s.subject && s.subject.toLowerCase().includes(subjectFilter));
  // Ordina per data e ora
  filtered = filtered.slice().sort((a, b) => {
    if (a.date === b.date) return a.start_time.localeCompare(b.start_time);
    return a.date.localeCompare(b.date);
  });
  let html = '';
  if (!filtered.length) {
    html = '<div class="hint">Nessun orario per questi filtri.</div>';
  } else {
    html = `<div class='table-responsive'><table class='modern-table'><thead><tr><th>Corso</th><th>Docente</th><th>Aula</th><th>Materia</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th><th>Azioni</th></tr></thead><tbody>`;
    filtered.forEach(s => {
      const course = courses.find(c => c.id == s.course_id);
      html += `<tr>`;
      html += `<td><span class='badge' style='background:#f1f5f9;color:var(--primary);'>${course ? course.name : ''}</span></td>`;
      html += `<td>${s.teacher}</td>`;
      html += `<td>${s.room}</td>`;
      html += `<td>${s.subject || ''}</td>`;
      html += `<td>${s.day}</td>`;
      html += `<td>${formatDate(s.date)}</td>`;
      html += `<td>${s.start_time}</td>`;
      html += `<td>${s.end_time}</td>`;
      html += `<td style='text-align:center;'><button class='icon-btn' title='Modifica' onclick='openEditSchedule(${s.id})'>✏️</button> <button class='icon-btn' title='Elimina' onclick='deleteSchedule(${s.id})'>🗑️</button></td></tr>`;
    });
    html += '</tbody></table></div>';
  }
  document.getElementById('schedules-list').innerHTML = html;
}
// Aggiorna i filtri per ricerca live
['filter-teacher', 'filter-room', 'filter-subject'].forEach(id => {
  document.getElementById(id).oninput = renderSchedules;
});
function openEditSchedule(id) {
  editingScheduleId = id;
  const s = schedules.find(x => x.id == id);
  document.getElementById('edit-course-select').innerHTML = courses.map(c => `<option value="${c.id}"${c.id == s.course_id ? ' selected' : ''}>${c.name}</option>`).join('');
  document.getElementById('edit-teacher').value = s.teacher;
  document.getElementById('edit-room').value = s.room;
  document.getElementById('edit-subject').value = s.subject || '';
  document.getElementById('edit-day').value = s.day;
  document.getElementById('edit-date').value = s.date;
  document.getElementById('edit-start').value = s.start_time;
  document.getElementById('edit-end').value = s.end_time;
  document.getElementById('edit-schedule-msg').textContent = '';
  document.getElementById('edit-schedule-modal').style.display = 'flex';
}
document.getElementById('close-edit-schedule-modal').onclick = () => {
  document.getElementById('edit-schedule-modal').style.display = 'none';
};
document.getElementById('cancel-edit-schedule').onclick = function () {
  document.getElementById('edit-schedule-modal').style.display = 'none';
};
window.onclick = e => {
  if (e.target === document.getElementById('edit-schedule-modal'))
    document.getElementById('edit-schedule-modal').style.display = 'none';
};
document.getElementById('edit-schedule-form').onsubmit = async function (e) {
  e.preventDefault();
  await fetch('/api/schedules').then(r => r.json()).then(data => { schedules = data; });
  const course_id = document.getElementById('edit-course-select').value;
  const teacher = document.getElementById('edit-teacher').value;
  const room = document.getElementById('edit-room').value;
  const subject = document.getElementById('edit-subject').value;
  const day = document.getElementById('edit-day').value;
  const date = document.getElementById('edit-date').value;
  const start_time = document.getElementById('edit-start').value;
  const end_time = document.getElementById('edit-end').value;
  const overlap = schedules.some(s => String(s.course_id) === String(course_id) && s.date === date && s.start_time === start_time && s.id != editingScheduleId);
  const el = document.getElementById('edit-schedule-msg');
  if (overlap) {
    el.textContent = 'Esiste già un orario per questo corso, data e ora di inizio.';
    el.className = 'hint';
    return;
  }
  fetch(`/api/schedules/${editingScheduleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_id,
      teacher,
      room,
      subject,
      day,
      date,
      start_time,
      end_time
    })
  }).then(r => r.text()).then(msg => {
    fetchCoursesAndSchedules();
    if (msg === 'OK') {
      el.textContent = 'Orario aggiornato!';
      el.className = 'success';
      document.getElementById('filter-course').value = course_id;
      renderSchedules();
      setTimeout(() => {
        document.getElementById('edit-schedule-modal').style.display = 'none';
      }, 1000);
    } else {
      el.textContent = msg;
      el.className = 'hint';
    }
  });
};
function deleteSchedule(id) {
  if (confirm('Sei sicuro di voler eliminare questo orario?'))
    fetch(`/api/schedules/${id}`, { method: 'DELETE' }).then(() => fetchCoursesAndSchedules());
}
document.getElementById('add-schedule-btn').onclick = () => {
  const filterVal = document.getElementById('filter-course').value;
  document.getElementById('add-course-select').innerHTML = courses.map(c => `<option value="${c.id}"${c.id == filterVal ? ' selected' : ''}>${c.name}</option>`).join('');
  document.getElementById('add-teacher').value = '';
  document.getElementById('add-room').value = '';
  document.getElementById('add-subject').value = '';
  document.getElementById('add-day').value = '';
  document.getElementById('add-date').value = '';
  document.getElementById('add-start').value = '';
  document.getElementById('add-end').value = '';
  document.getElementById('add-schedule-msg').textContent = '';
  document.getElementById('add-schedule-modal').style.display = 'flex';
};
document.getElementById('close-add-schedule-modal').onclick = () => {
  document.getElementById('add-schedule-modal').style.display = 'none';
};
document.getElementById('cancel-add-schedule').onclick = function () {
  document.getElementById('add-schedule-modal').style.display = 'none';
};
window.addEventListener('click', function (e) {
  if (e.target === document.getElementById('add-schedule-modal'))
    document.getElementById('add-schedule-modal').style.display = 'none';
});
document.getElementById('add-schedule-form').onsubmit = async function (e) {
  e.preventDefault();
  await fetch('/api/schedules').then(r => r.json()).then(data => { schedules = data; });
  const course_id = document.getElementById('add-course-select').value;
  const teacher = document.getElementById('add-teacher').value;
  const room = document.getElementById('add-room').value;
  const subject = document.getElementById('add-subject').value;
  const day = document.getElementById('add-day').value;
  const date = document.getElementById('add-date').value;
  const start_time = document.getElementById('add-start').value;
  const end_time = document.getElementById('add-end').value;
  const overlap = schedules.some(s => String(s.course_id) === String(course_id) && s.date === date && s.start_time === start_time);
  const el = document.getElementById('add-schedule-msg');
  if (overlap) {
    el.textContent = 'Esiste già un orario per questo corso, data e ora di inizio.';
    el.className = 'hint';
    return;
  }
  fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_id,
      teacher,
      room,
      subject,
      day,
      date,
      start_time,
      end_time
    })
  }).then(r => r.text()).then(msg => {
    fetchCoursesAndSchedules();
    if (msg === 'OK') {
      el.textContent = 'Orario aggiunto!';
      el.className = 'success';
      document.getElementById('filter-course').value = course_id;
      renderSchedules();
      setTimeout(() => {
        document.getElementById('add-schedule-modal').style.display = 'none';
      }, 1000);
    } else {
      el.textContent = msg;
      el.className = 'hint';
    }
  });
};
function renderSchedulesList() {
  const search = searchScheduleCourseInput.value.toLowerCase();
  const courseId = filterScheduleCourseSelect.value;
  let html = '';
  const filtered = allSchedules.filter(s => {
    const course = allCourses.find(c => c.id == s.course_id) || {};
    const matchName = (course.name || '').toLowerCase().includes(search);
    const matchId = !courseId || s.course_id == courseId;
    return matchName && matchId;
  });
  if (!filtered.length) {
    html = '<div class="hint">Nessun orario trovato.';
  } else {
    html = `<div class='table-responsive'><table class='modern-table'><thead><tr><th>Corso</th><th>Docente</th><th>Aula</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th><th>Azioni</th></tr></thead><tbody>`;
    filtered.forEach(s => {
      const course = allCourses.find(c => c.id == s.course_id) || {};
      html += `<tr><td>${course.name||'-'}</td><td>${s.teacher}</td><td>${s.room}</td><td>${s.day}</td><td>${s.date}</td><td>${s.start_time}</td><td>${s.end_time}</td><td style='text-align:center;'><button class='icon-btn' title='Modifica' onclick='openEditSchedule(${s.id})'>✏️</button> <button class='icon-btn' title='Elimina' onclick='deleteSchedule(${s.id})'>🗑️</button></td></tr>`;
    });
    html += '</tbody></table></div>';
  }
  document.getElementById('schedules-list').innerHTML = html;
}
function updateFilterScheduleCourseSelect() {
  filterScheduleCourseSelect.innerHTML = '<option value="">Tutti i corsi</option>' + allCourses.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}
function fetchCourses() {
  return fetch('/api/courses').then(r=>r.json()).then(data => { allCourses = data; updateFilterScheduleCourseSelect(); });
}
function fetchSchedules() {
  fetch('/api/schedules').then(r=>r.json()).then(data => {
    allSchedules = data;
    renderSchedulesList();
  });
}
document.addEventListener('DOMContentLoaded', () => {
  searchScheduleCourseInput = document.getElementById('search-schedule-course');
  filterScheduleCourseSelect = document.getElementById('filter-schedule-course');
  if(searchScheduleCourseInput && filterScheduleCourseSelect) {
    searchScheduleCourseInput.addEventListener('input', renderSchedulesList);
    filterScheduleCourseSelect.addEventListener('change', renderSchedulesList);
  }
  fetchCourses().then(fetchSchedules);
});
fetchCoursesAndSchedules(); 