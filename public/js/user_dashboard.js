document.addEventListener('DOMContentLoaded', () => {
  fetch('/user/courses').then(r=>r.json()).then(courses => {
    let html = '<h3>🎓 Corsi assegnati</h3>';
    let debug = '';
    if (!courses.length) {
      html += '<div class="hint">Nessun corso assegnato. Contatta un amministratore per essere iscritto a un corso.</div>';
      debug = 'Nessun corso collegato a questo utente.';
      document.getElementById('user-courses').innerHTML = html;
      document.getElementById('user-courses-debug').textContent = debug;
      return;
    }
    html += '<div class="courses-list">' + courses.map(c=>`<div class='course-card'><h4>${c.name} <span class='badge'>ID: ${c.id}</span></h4><p>${c.description||''}</p><div id='schedule-for-course-${c.id}'></div></div>`).join('') + '</div>';
    debug = 'Corsi collegati: ' + courses.map(c=>`${c.name} (ID: ${c.id})`).join(', ');
    document.getElementById('user-courses').innerHTML = html;
    document.getElementById('user-courses-debug').textContent = debug;
    // Fetch orari una sola volta
    fetch('/user/schedules').then(r=>r.json()).then(schedules => {
      courses.forEach(c => {
        const scheds = schedules.filter(s=>s.course_id==c.id);
        let schedHtml = '<h4 style="margin:1rem 0 0.5rem 0">🗓️ Orari</h4>';
        if (!scheds.length) {
          schedHtml += '<div class="hint">Nessun orario trovato per questo corso. Contatta l’amministratore per aggiungere orari.</div>';
        } else {
          schedHtml += '<div style="overflow-x:auto"><table class="schedule-table"><tr><th>Docente</th><th>Aula</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th></tr>' +
            scheds.map(s=>`<tr><td>${s.teacher}</td><td>${s.room}</td><td>${s.day}</td><td>${formatDate(s.date)}</td><td>${s.start_time}</td><td>${s.end_time}</td></tr>`).join('') + '</table></div>';
        }
        document.getElementById('schedule-for-course-'+c.id).innerHTML = schedHtml;
      });
      if (!schedules.length && courses.length) {
        // Nessun orario in assoluto
        courses.forEach(c => {
          document.getElementById('schedule-for-course-'+c.id).innerHTML = '<div class="hint">Nessun orario presente nel sistema per questo corso.</div>';
        });
      }
    }).catch(() => {
      courses.forEach(c => {
        document.getElementById('schedule-for-course-'+c.id).innerHTML = '<div class="hint">Errore nel recupero degli orari. Riprova più tardi.</div>';
      });
    });
  }).catch(() => {
    document.getElementById('user-courses-debug').textContent = 'Errore nel recupero dei corsi. Riprova più tardi.';
  });
});
function formatDate(iso) {
  if(!iso) return '-';
  const d = new Date(iso);
  if(isNaN(d)) return '-';
  return d.toLocaleDateString('it-IT', {day:'2-digit', month:'2-digit', year:'numeric'});
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