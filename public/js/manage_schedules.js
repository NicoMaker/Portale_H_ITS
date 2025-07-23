let courses = [];
let schedules = [];
let editingScheduleId = null;
let searchScheduleCourseInput, filterScheduleCourseSelect, allSchedules = [], allCourses = [];
// Inizializza Choices.js per i filtri multipli
let teacherChoices, roomChoices, subjectChoices, dayChoices;
function fetchCoursesAndSchedules() {
  Promise.all([
    fetch('/api/courses').then(r => r.json()),
    fetch('/api/schedules').then(r => r.json())
  ]).then(([allCourses, allSchedules]) => {
    courses = allCourses;
    schedules = allSchedules;
    const select = document.getElementById('filter-course');
    select.innerHTML = '<option value="">Tutti i corsi</option>' + courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    populateFilterOptions();
    renderSchedules();
    updateDatalists();
  });
}
document.getElementById('filter-course').onchange = renderSchedules;
// Importa la funzione formatDate
// Se il browser non supporta import/export, assicuriamoci che formatDate sia globale
if (typeof window.formatDate !== 'function') {
  const script = document.createElement('script');
  script.src = 'js/utils.js';
  document.head.appendChild(script);
}
function renderSchedules() {
  const courseId = document.getElementById('filter-course').value;
  // Ottieni i valori selezionati (array)
  const teacherFilter = teacherChoices ? teacherChoices.getValue(true) : [];
  const roomFilter = roomChoices ? roomChoices.getValue(true) : [];
  const subjectFilter = subjectChoices ? subjectChoices.getValue(true) : [];
  const dayFilter = dayChoices ? dayChoices.getValue(true) : [];
  const dateFilter = document.getElementById('filter-date').value;
  let filtered = schedules;
  if (courseId) filtered = filtered.filter(s => String(s.course_id) === String(courseId));
  if (teacherFilter.length) filtered = filtered.filter(s => teacherFilter.includes(s.teacher));
  if (roomFilter.length) filtered = filtered.filter(s => roomFilter.includes(s.room));
  if (subjectFilter.length) filtered = filtered.filter(s => subjectFilter.includes(s.subject));
  if (dayFilter.length) filtered = filtered.filter(s => dayFilter.includes(s.day));
  if (dateFilter) filtered = filtered.filter(s => s.date === dateFilter);
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
['filter-teacher', 'filter-room', 'filter-subject', 'filter-day', 'filter-date'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    if (el.tagName === 'SELECT') {
      el.onchange = renderSchedules;
    } else {
      el.oninput = renderSchedules;
    }
  }
});
function openEditSchedule(id) {
  editingScheduleId = id;
  const s = schedules.find(x => x.id == id);
  document.getElementById('edit-course-select').innerHTML = courses.map(c => `<option value="${c.id}"${c.id == s.course_id ? ' selected' : ''}>${c.name}</option>`).join('');
  document.getElementById('edit-teacher').value = s.teacher;
  document.getElementById('edit-room').value = s.room;
  document.getElementById('edit-subject').value = s.subject || '';
  document.getElementById('edit-day').textContent = s.day;
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
  const day = document.getElementById('edit-day').textContent;
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
  document.getElementById('add-course-select').innerHTML =
    `<option value="" disabled selected>Seleziona un corso</option>` +
    courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  document.getElementById('add-teacher').value = '';
  document.getElementById('add-room').value = '';
  document.getElementById('add-subject').value = '';
  document.getElementById('add-day').textContent = '';
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
  const day = document.getElementById('add-day').textContent;
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
    html = `<div class='table-responsive'><table class='modern-table'><thead><tr><th>Corso</th><th>Docente</th><th>Aula</th><th>Materia</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th><th>Azioni</th></tr></thead><tbody>`;
    filtered.forEach(s => {
      const course = allCourses.find(c => c.id == s.course_id) || {};
      html += `<tr><td>${course.name || '-'}</td><td>${s.teacher}</td><td>${s.room}</td><td>${s.subject || ''}</td><td>${s.day}</td><td>${typeof formatDate === 'function' ? formatDate(s.date) : s.date}</td><td>${s.start_time}</td><td>${s.end_time}</td><td style='text-align:center;'><button class='icon-btn' title='Modifica' onclick='openEditSchedule(${s.id})'>✏️</button> <button class='icon-btn' title='Elimina' onclick='deleteSchedule(${s.id})'>🗑️</button></td></tr>`;
    });
    html += '</tbody></table></div>';
  }
  document.getElementById('schedules-list').innerHTML = html;
}
function updateFilterScheduleCourseSelect() {
  filterScheduleCourseSelect.innerHTML = '<option value="">Tutti i corsi</option>' + allCourses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}
function fetchCourses() {
  return fetch('/api/courses').then(r => r.json()).then(data => { allCourses = data; updateFilterScheduleCourseSelect(); });
}
function fetchSchedules() {
  fetch('/api/schedules').then(r => r.json()).then(data => {
    allSchedules = data;
    renderSchedulesList();
  });
}
// Funzione per ottenere il giorno della settimana in italiano da una data ISO
function getItalianDayOfWeek(dateString) {
  if (!dateString) return '';
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return giorni[d.getDay()];
}

// Collega il calcolo automatico del giorno ai campi data nei modali di aggiunta e modifica
function setupAutoDayFill() {
  const addDate = document.getElementById('add-date');
  const addDayDiv = document.getElementById('add-day');
  if (addDate && addDayDiv) {
    addDate.addEventListener('change', function () {
      const giorno = getItalianDayOfWeek(this.value);
      addDayDiv.textContent = giorno;
    });
  }
  const editDate = document.getElementById('edit-date');
  const editDayDiv = document.getElementById('edit-day');
  if (editDate && editDayDiv) {
    editDate.addEventListener('change', function () {
      const giorno = getItalianDayOfWeek(this.value);
      editDayDiv.textContent = giorno;
    });
  }
}

function populateFilterOptions() {
  // Docenti
  const teachers = [...new Set(schedules.map(s => s.teacher).filter(Boolean))];
  teacherChoices.clearChoices();
  teacherChoices.setChoices(teachers.map(t => ({ value: t, label: t })), 'value', 'label', false);
  // Aule
  const rooms = [...new Set(schedules.map(s => s.room).filter(Boolean))];
  roomChoices.clearChoices();
  roomChoices.setChoices(rooms.map(r => ({ value: r, label: r })), 'value', 'label', false);
  // Materie
  const subjects = [...new Set(schedules.map(s => s.subject).filter(Boolean))];
  subjectChoices.clearChoices();
  subjectChoices.setChoices(subjects.map(su => ({ value: su, label: su })), 'value', 'label', false);
  // Giorni
  const days = [...new Set(schedules.map(s => s.day).filter(Boolean))];
  dayChoices.clearChoices();
  dayChoices.setChoices(days.map(d => ({ value: d, label: d })), 'value', 'label', false);
}

document.addEventListener('DOMContentLoaded', () => {
  searchScheduleCourseInput = document.getElementById('search-schedule-course');
  filterScheduleCourseSelect = document.getElementById('filter-schedule-course');
  setupAddFieldWithButton('add-teacher', 'add-teacher-btn', 'teacher-list');
  setupAddFieldWithButton('add-room', 'add-room-btn', 'room-list');
  setupAddFieldWithButton('add-subject', 'add-subject-btn', 'subject-list');

  setupAddFieldWithButton('edit-teacher', 'edit-teacher-btn', 'teacher-list');
  setupAddFieldWithButton('edit-room', 'edit-room-btn', 'room-list');
  setupAddFieldWithButton('edit-subject', 'edit-subject-btn', 'subject-list');

  if (searchScheduleCourseInput && filterScheduleCourseSelect) {
    searchScheduleCourseInput.addEventListener('input', renderSchedulesList);
    filterScheduleCourseSelect.addEventListener('change', renderSchedulesList);
  }
  fetchCourses().then(fetchSchedules);
  setupAutoDayFill();
  // Inizializza Choices.js per i filtri multipli
  teacherChoices = new Choices('#filter-teacher', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
  roomChoices = new Choices('#filter-room', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
  subjectChoices = new Choices('#filter-subject', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
  dayChoices = new Choices('#filter-day', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
});
fetchCoursesAndSchedules();

function setupAddFieldWithButton(inputId, buttonId, listId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const list = document.getElementById(listId);

  if (!input || !button || !list) return;

  input.addEventListener('input', () => {
    const val = input.value.trim();
    const exists = Array.from(list.options).some(opt => opt.value.toLowerCase() === val.toLowerCase());
    button.style.display = val && !exists ? 'inline-block' : 'none';
  });

  button.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) return;
    const opt = document.createElement('option');
    opt.value = val;
    list.appendChild(opt);
    button.style.display = 'none';
  });
}

function updateDatalists() {
  const teachers = [...new Set(schedules.map(s => s.teacher).filter(Boolean))];
  const rooms = [...new Set(schedules.map(s => s.room).filter(Boolean))];
  const subjects = [...new Set(schedules.map(s => s.subject).filter(Boolean))];

  const setOptions = (id, values) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = values.map(v => `<option value="${v}">`).join('');
  };

  setOptions('teacher-list', teachers);
  setOptions('room-list', rooms);
  setOptions('subject-list', subjects);
}
