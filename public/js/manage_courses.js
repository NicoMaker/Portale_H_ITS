function fetchCourses() {
  fetch('/api/courses').then(r=>r.json()).then(courses => {
    let html = '';
    if (!courses.length) {
      html = '<div class="hint">Nessun corso presente. Aggiungi un corso per iniziare.</div>';
    } else {
      html = `<div class='table-responsive'><table class='modern-table'><thead><tr><th>ID</th><th>Nome</th><th>Descrizione</th><th>Azioni</th></tr></thead><tbody>`;
      courses.forEach(c => {
        html += `<tr><td><span class='badge' style='background:var(--primary-light);color:#fff;'>${c.id}</span></td>`;
        html += `<td><span class='badge' style='background:#f1f5f9;color:var(--primary);'>${c.name}</span></td>`;
        html += `<td>${c.description||''}</td>`;
        html += `<td style='text-align:center;'><button class='icon-btn' title='Modifica' onclick='openEditCourse(${c.id})'>✏️</button> <button class='icon-btn' title='Elimina' onclick='deleteCourse(${c.id})'>🗑️</button></td></tr>`;
      });
      html += '</tbody></table></div>';
    }
    document.getElementById('courses-list').innerHTML = html;
  });
}
document.getElementById('add-course-form').onsubmit = function(e) {
  e.preventDefault();
  fetch('/api/courses', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('course-name').value,description:document.getElementById('course-desc').value})})
    .then(r=>r.text()).then(msg=>{
      fetchCourses();
      const el = document.getElementById('course-msg');
      if(msg==='OK') {
        el.textContent = 'Corso aggiunto con successo!';
        el.className = 'success';
        this.reset();
      } else {
        el.textContent = msg;
        el.className = 'hint';
      }
      setTimeout(()=>{el.textContent='';}, 2500);
    });
};
let editingCourseId = null;
function openEditCourse(id) {
  editingCourseId = id;
  fetch('/api/courses').then(r=>r.json()).then(courses => {
    const course = courses.find(c=>c.id==id);
    document.getElementById('edit-course-name').value = course ? course.name : '';
    document.getElementById('edit-course-desc').value = course ? course.description : '';
    document.getElementById('edit-course-msg').textContent = '';
    document.getElementById('edit-course-modal').style.display = 'flex';
  });
}
document.getElementById('close-edit-course-modal').onclick = () => {
  document.getElementById('edit-course-modal').style.display = 'none';
};
document.getElementById('cancel-edit-course').onclick = function() {
  document.getElementById('edit-course-modal').style.display = 'none';
};
window.onclick = e => {
  if(e.target === document.getElementById('edit-course-modal'))
    document.getElementById('edit-course-modal').style.display = 'none';
};
document.getElementById('edit-course-form').onsubmit = function(e) {
  e.preventDefault();
  fetch(`/api/courses/${editingCourseId}`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:document.getElementById('edit-course-name').value,description:document.getElementById('edit-course-desc').value})
  }).then(r=>r.text()).then(msg => {
    fetchCourses();
    const el = document.getElementById('edit-course-msg');
    if(msg==='OK') {
      el.textContent = 'Corso aggiornato!';
      el.className = 'success';
      setTimeout(()=>{
        document.getElementById('edit-course-modal').style.display = 'none';
      }, 1000);
    } else {
      el.textContent = msg;
      el.className = 'hint';
    }
  });
};
function deleteCourse(id) {
  if(confirm('Sei sicuro di voler eliminare questo corso?'))
    fetch(`/api/courses/${id}`, {method:'DELETE'}).then(()=>fetchCourses());
}
fetchCourses();
// CSS extra per tabella moderna e responsive
const style = document.createElement('style');
style.innerHTML = `
.table-responsive { overflow-x:auto; }
.modern-table { width:100%; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; box-shadow:0 1px 6px 0 rgba(0,0,0,0.04); }
.modern-table thead th { position:sticky; top:0; background:#e0e7ef; z-index:2; }
.modern-table th, .modern-table td { padding:0.85rem 0.5rem; text-align:left; }
.modern-table tr:nth-child(even) { background:#f8fafc; }
.modern-table tr:hover { background:#eaf0fb; transition:background 0.18s; }
@media (max-width:700px) {
  .modern-table, .modern-table thead, .modern-table tbody, .modern-table th, .modern-table td, .modern-table tr { display:block; }
  .modern-table thead { display:none; }
  .modern-table tr { margin-bottom:1.2rem; box-shadow:0 1px 6px 0 rgba(0,0,0,0.04); border-radius:12px; background:#fff; }
  .modern-table td { padding:0.7rem 1rem; border-bottom:none; }
  .modern-table td:before { content:attr(data-label); font-weight:600; color:var(--primary); display:block; margin-bottom:0.3em; }
}
`;
document.head.appendChild(style); 