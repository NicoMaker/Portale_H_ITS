let allSchedules = [];
let allCourses = [];
// Funzione per filtrare e renderizzare
function renderUserCourses() {
  document.getElementById('user-courses').innerHTML = '';
  document.getElementById('user-courses-debug').textContent = '';
}
function renderUserCoursesList(courses) {
  let html = '';
  if (!courses.length) {
    html = '<div class="hint">Nessun corso assegnato. Contatta un amministratore per essere iscritto a un corso.</div>';
  } else {
    html = '<div class="user-courses-list"><h3>Corsi a cui sei iscritto:</h3><ul>' +
      courses.map(c => `<li><b>${c.name}</b>${c.description ? ' - ' + c.description : ''}</li>`).join('') +
      '</ul></div>';
  }
  document.getElementById('user-courses').innerHTML = html;
}
function renderUserCoursesBadges(courses) {
  let html = '';
  if (!courses.length) {
    html = '<div class="hint">Nessun corso assegnato. Contatta un amministratore per essere iscritto a un corso.</div>';
  } else {
    html = '<div class="user-courses-badges-wrap">' +
      courses.map(c => `<span class="user-courses-badge">${c.name}</span>`).join('') +
      '</div>';
  }
  document.getElementById('user-courses').innerHTML = html;
}
// Inizializza Choices.js per i filtri multipli SOLO per i campi utente
let teacherChoicesU, roomChoicesU, subjectChoicesU, dayChoicesU;
teacherChoicesU = new Choices('#filter-teacher-u', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
roomChoicesU = new Choices('#filter-room-u', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
subjectChoicesU = new Choices('#filter-subject-u', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
dayChoicesU = new Choices('#filter-date-u', { removeItemButton: true, searchEnabled: true, shouldSort: false, position: 'bottom', placeholder: true });
// Dopo aver caricato i dati, popola le opzioni e mostra la tabella unica
document.addEventListener('DOMContentLoaded', () => {
  fetch('/user/courses').then(r=>r.json()).then(courses => {
    allCourses = courses;
    fetch('/user/schedules').then(r=>r.json()).then(schedules => {
      allSchedules = schedules;
      populateFilterOptionsU();
      renderUserCoursesBadges(allCourses);
      renderUserSchedulesTable(allCourses, allSchedules);
      // Setup filtri
      ['filter-teacher-u','filter-room-u','filter-subject-u','filter-date-u','filter-date-exact-u'].forEach(id=>{
        document.getElementById(id).onchange = () => {
          renderUserCoursesBadges(allCourses);
          renderUserSchedulesTable(allCourses, allSchedules);
        };
      });
    }).catch(async (err) => {
      let msg = 'Errore nel recupero degli orari. ';
      try {
        const resp = await fetch('/user/schedules');
        if (resp.status === 403) {
          msg += 'Sessione scaduta, effettua di nuovo il login.';
        } else {
          msg += 'Riprova più tardi.';
        }
      } catch (e) {
        msg += 'Riprova più tardi.';
      }
      document.getElementById('user-courses').innerHTML = `<div class="hint">${msg} <button onclick="location.reload()">Riprova</button></div>`;
      document.getElementById('user-schedules-table').innerHTML = '';
      console.error('Errore fetch orari:', err);
    });
  }).catch((err) => {
    document.getElementById('user-courses').innerHTML = '<div class="hint">Errore nel recupero dei corsi. Riprova più tardi. <button onclick="location.reload()">Riprova</button></div>';
    document.getElementById('user-schedules-table').innerHTML = '';
    console.error('Errore fetch corsi:', err);
  });
});

function populateFilterOptionsU() {
  // Docenti
  const teachers = [...new Set(allSchedules.map(s => s.teacher).filter(Boolean))];
  teacherChoicesU.clearChoices();
  teacherChoicesU.setChoices(teachers.map(t => ({ value: t, label: t })), 'value', 'label', false);
  // Aule
  const rooms = [...new Set(allSchedules.map(s => s.room).filter(Boolean))];
  roomChoicesU.clearChoices();
  roomChoicesU.setChoices(rooms.map(r => ({ value: r, label: r })), 'value', 'label', false);
  // Materie
  const subjects = [...new Set(allSchedules.map(s => s.subject).filter(Boolean))];
  subjectChoicesU.clearChoices();
  subjectChoicesU.setChoices(subjects.map(su => ({ value: su, label: su })), 'value', 'label', false);
  // Giorni
  const days = [...new Set(allSchedules.map(s => s.day).filter(Boolean))];
  dayChoicesU.clearChoices();
  dayChoicesU.setChoices(days.map(d => ({ value: d, label: d })), 'value', 'label', false);
}


// Funzione per ottenere il giorno della settimana in italiano da una data ISO
function getItalianDayOfWeek(dateString) {
  if (!dateString) return '';
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const d = new Date(dateString);
  if (isNaN(d)) return '';
  return giorni[d.getDay()];
}
function renderUserSchedulesTable(courses, schedules) {
  let filtered = schedules.filter(s => courses.some(c => c.id == s.course_id));
  // Filtri
  const teacherFilter = teacherChoicesU ? teacherChoicesU.getValue(true) : [];
  const roomFilter = roomChoicesU ? roomChoicesU.getValue(true) : [];
  const subjectFilter = subjectChoicesU ? subjectChoicesU.getValue(true) : [];
  const dayFilter = dayChoicesU ? dayChoicesU.getValue(true) : [];
  const dateExact = document.getElementById('filter-date-exact-u').value;
  if (teacherFilter.length) filtered = filtered.filter(s => teacherFilter.includes(s.teacher));
  if (roomFilter.length) filtered = filtered.filter(s => roomFilter.includes(s.room));
  if (subjectFilter.length) filtered = filtered.filter(s => subjectFilter.includes(s.subject));
  if (dayFilter.length) filtered = filtered.filter(s => dayFilter.includes(s.day));
  if (dateExact) filtered = filtered.filter(s => s.date === dateExact);
  filtered = filtered.slice().sort((a, b) => {
    if (a.date === b.date) return a.start_time.localeCompare(b.start_time);
    return a.date.localeCompare(b.date);
  });
  let html = '';
  if (!courses.length) {
    html = '<div class="hint">Nessun corso assegnato. Contatta un amministratore per essere iscritto a un corso.</div>';
  } else if (!filtered.length) {
    html = '<div class="hint">Nessun orario trovato per questi filtri.</div>';
  } else {
    html = `<div class='table-responsive'><table class='modern-table'><thead><tr><th>Docente</th><th>Aula</th><th>Materia</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th></tr></thead><tbody>`;
    filtered.forEach(s => {
      html += `<tr>`;
      html += `<td>${s.teacher}</td>`;
      html += `<td>${s.room}</td>`;
      html += `<td>${s.subject || ''}</td>`;
      html += `<td>${s.day || getItalianDayOfWeek(s.date)}</td>`;
      html += `<td>${formatDate(s.date)}</td>`;
      html += `<td>${s.start_time}</td>`;
      html += `<td>${s.end_time}</td>`;
      html += `</tr>`;
    });
    html += '</tbody></table></div>';
  }
  document.getElementById('user-schedules-table').innerHTML = html;
}
// Modale modifica profilo
const modal = document.getElementById('edit-profile-modal');
document.getElementById('edit-profile-btn').onclick = () => { modal.style.display = 'block'; };
document.getElementById('close-modal').onclick = () => { modal.style.display = 'none'; };
window.onclick = e => { if(e.target === modal) modal.style.display = 'none'; };
// Validazione password
const newPassword = document.getElementById('new_password');
const editHint = document.getElementById('edit-password-hint');
newPassword.addEventListener('input', () => {
  const val = newPassword.value;
  let msg = '';
  if(val.length < 8) msg += 'Min 8 caratteri. ';
  if(!/[A-Z]/.test(val)) msg += 'Almeno una maiuscola. ';
  if(!/[a-z]/.test(val)) msg += 'Almeno una minuscola. ';
  if(!/[0-9]/.test(val)) msg += 'Almeno un numero. ';
  editHint.textContent = msg;
  editHint.style.color = msg ? 'var(--accent)' : 'green';
});
document.getElementById('edit-profile-form').onsubmit = function(e) {
  if(editHint.textContent) {
    e.preventDefault();
    editHint.style.color = 'red';
    return false;
  }
  e.preventDefault();
  fetch('/user/profile', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:document.getElementById('new_username').value, password:newPassword.value})
  }).then(r=>r.text()).then(msg => {
    document.getElementById('edit-profile-msg').textContent = msg;
    if(msg==='OK') setTimeout(()=>location.reload(), 1000);
  });
}; 