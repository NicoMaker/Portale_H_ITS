// Modale modifica profilo
const modal = document.getElementById('edit-profile-modal');
document.getElementById('edit-profile-btn').onclick = () => { modal.style.display = 'flex'; };
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