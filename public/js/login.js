document.getElementById('login-form').onsubmit = function(e) {
  e.preventDefault();
  const form = this;
  fetch('/login', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:`username=${encodeURIComponent(form.username.value)}&password=${encodeURIComponent(form.password.value)}`
  }).then(r=>r.text()).then(msg => {
    if(msg.includes('dashboard')) {
      window.location = msg.includes('admin_dashboard') ? '/admin_dashboard.html' : '/user_dashboard.html';
    } else if(msg.includes('Credenziali non valide')) {
      document.getElementById('login-msg').innerHTML = '<span style="color:red">❌ Credenziali non valide</span>';
    } else {
      document.getElementById('login-msg').innerHTML = msg;
    }
  });
}; 