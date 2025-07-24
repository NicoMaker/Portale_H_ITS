document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const username = document.getElementById('username');
  const password = document.getElementById('password');
  const loginMsg = document.getElementById('login-msg');

  // Forza rimozione di qualsiasi valore nei campi (anche tornando indietro dal browser)
  setTimeout(() => {
    username.value = '';
    password.value = '';
  }, 0);

  // Disabilita autocompletamento via JS (in aggiunta al blocco HTML)
  form.setAttribute('autocomplete', 'off');
  username.setAttribute('autocomplete', 'off');
  password.setAttribute('autocomplete', 'new-password');

  // Disabilita caching per evitare ritorno con dati visibili
  if ('credentials' in navigator) {
    try {
      navigator.credentials.preventSilentAccess && navigator.credentials.preventSilentAccess();
    } catch (e) { }
  }

  // Previeni ripristino automatico del form se si torna indietro
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      form.reset();
    }
  });

  // Gestione invio form via fetch
  form.onsubmit = function (e) {
    e.preventDefault();

    const data = `username=${encodeURIComponent(username.value)}&password=${encodeURIComponent(password.value)}`;

    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: data
    })
      .then(r => r.text())
      .then(msg => {
        if (msg.includes('dashboard')) {
          // Login riuscito → reindirizza in base al tipo utente
          window.location = msg.includes('admin_dashboard')
            ? '/admin_dashboard.html'
            : '/user_dashboard.html';
        } else if (msg.includes('Credenziali non valide')) {
          loginMsg.innerHTML = '<span style="color:red">❌ Credenziali non valide</span>';
        } else {
          loginMsg.innerHTML = msg;
        }
      })
      .catch(() => {
        loginMsg.innerHTML = '<span style="color:red">⚠️ Errore di rete. Riprova.</span>';
      });
  };
});
