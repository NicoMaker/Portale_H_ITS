// Validazione password live
const password = document.getElementById('password');
const hint = document.getElementById('password-hint');
password.addEventListener('input', () => {
  const val = password.value;
  let msg = '';
  if(val.length < 8) msg += 'Min 8 caratteri. ';
  if(!/[A-Z]/.test(val)) msg += 'Almeno una maiuscola. ';
  if(!/[a-z]/.test(val)) msg += 'Almeno una minuscola. ';
  if(!/[0-9]/.test(val)) msg += 'Almeno un numero. ';
  hint.textContent = msg;
  hint.style.color = msg ? 'var(--accent)' : 'green';
});
// Feedback submit
document.getElementById('register-form').onsubmit = function(e) {
  if(hint.textContent) {
    e.preventDefault();
    hint.style.color = 'red';
    return false;
  }
  e.preventDefault();
  const form = this;
  fetch('/register', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:`username=${encodeURIComponent(form.username.value)}&password=${encodeURIComponent(form.password.value)}`
  }).then(r=>r.text()).then(msg => {
    if(msg.trim() === 'Registrazione avvenuta!') {
      document.getElementById('register-msg').innerHTML = '<span style="color:green">Registrazione avvenuta! Vai ad <a href="/login.html">accedi</a> per entrare.</span>';
    } else {
      document.getElementById('register-msg').innerHTML = '<span style="color:red">'+msg+'</span>';
    }
  });
}; 