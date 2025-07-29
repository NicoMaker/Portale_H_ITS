// ------------------------------
// Selettori base
// ------------------------------
const modal = document.getElementById("edit-profile-modal");
const usernameDisplay = document.getElementById("new_username");
const usernameHidden = document.getElementById("new_username_hidden");
const newPassword = document.getElementById("new_password");
const editHint = document.getElementById("edit-password-hint");
const editMsg = document.getElementById("edit-profile-msg");

// ------------------------------
// Apri il modale e carica username
// ------------------------------
document.getElementById("edit-profile-btn").onclick = () => {
  modal.style.display = "flex";

  fetch("/user/current")
    .then((r) => r.json())
    .then((data) => {
      if (data.username) {
        usernameDisplay.value = data.username;
        usernameHidden.value = data.username;
      } else {
        throw new Error("Username non trovato");
      }
    })
    .catch((err) => {
      console.error("Errore nel recupero dello username:", err);
      editMsg.textContent = "Errore nel recupero dello username.";
    });
};

// ------------------------------
// Chiudi modale
// ------------------------------
document.getElementById("close-modal").onclick = () => {
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// ------------------------------
// Validazione password in tempo reale
// ------------------------------
newPassword.addEventListener("input", () => {
  const val = newPassword.value;
  let msg = "";
  if (val.length < 8) msg += "Min 8 caratteri. ";
  if (!/[A-Z]/.test(val)) msg += "Almeno una maiuscola. ";
  if (!/[a-z]/.test(val)) msg += "Almeno una minuscola. ";
  if (!/[0-9]/.test(val)) msg += "Almeno un numero. ";
  editHint.textContent = msg;
  editHint.style.color = msg ? "var(--accent)" : "green";
});

// ------------------------------
// Submit form modifica profilo
// ------------------------------
document.getElementById("edit-profile-form").onsubmit = function (e) {
  e.preventDefault();

  if (editHint.textContent) {
    editHint.style.color = "red";
    return false;
  }

  fetch("/user/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: usernameHidden.value,
      password: newPassword.value,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      editMsg.textContent = msg;
      if (msg === "OK") {
        editMsg.style.color = "green";
        setTimeout(() => location.reload(), 1000);
      } else {
        editMsg.style.color = "red";
      }
    })
    .catch((err) => {
      console.error("Errore durante il salvataggio:", err);
      editMsg.textContent = "Errore durante il salvataggio.";
      editMsg.style.color = "red";
    });
};
