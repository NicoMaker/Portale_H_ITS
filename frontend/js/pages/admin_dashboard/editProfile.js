// Modale "Modifica profilo" dell'admin (username sola lettura + nuova password)
import { userApi } from "../../shared/api.js";
import { passwordValida, requisitiMancanti } from "../../shared/password.js";

const $ = (id) => document.getElementById(id);

const HINT_DEFAULT = `
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
  <span>La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero.</span>`;

export function initEditProfile() {
  const modal = $("edit-profile-modal");
  const usernameDisplay = $("new_username");
  const newPassword = $("new_password");
  const editHint = $("edit-password-hint");
  const editMsg = $("edit-profile-msg");
  const togglePassword = $("toggle-password");

  // Mostra/nascondi password
  togglePassword.addEventListener("click", () => {
    const type =
      newPassword.getAttribute("type") === "password" ? "text" : "password";
    newPassword.setAttribute("type", type);
    const eyeIcon = togglePassword.querySelector("svg");
    eyeIcon.innerHTML =
      type === "text"
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>`;
  });

  // Apri modale e carica username
  $("edit-profile-btn").addEventListener("click", () => {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    userApi
      .corrente()
      .then((data) => {
        if (!data.username) throw new Error("Username non trovato");
        usernameDisplay.value = data.username;
      })
      .catch((err) => {
        console.error("Errore nel recupero dello username:", err);
        editMsg.textContent = "Errore nel recupero dello username.";
        editMsg.className = "text-center text-sm font-medium text-red-500";
      });
  });

  // Chiusura
  const chiudi = () => {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    editMsg.textContent = "";
    newPassword.value = "";
    editHint.innerHTML = HINT_DEFAULT;
    editHint.className =
      "mt-2 text-sm text-gray-500 flex items-center space-x-2";
  };
  $("close-modal").addEventListener("click", chiudi);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) chiudi();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) chiudi();
  });
  modal.addEventListener("transitionend", () => {
    if (!modal.classList.contains("hidden")) newPassword.focus();
  });

  // Validazione live
  newPassword.addEventListener("input", () => {
    const missing = requisitiMancanti(newPassword.value);
    if (missing.length === 0) {
      editHint.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-green-500">Password valida!</span>`;
    } else {
      editHint.innerHTML = `<svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span class="text-orange-500">Mancano: ${missing.join(", ")}</span>`;
    }
  });

  // Submit
  $("edit-profile-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!passwordValida(newPassword.value)) {
      editMsg.textContent = "La password non soddisfa tutti i requisiti";
      editMsg.className = "text-center text-sm font-medium text-red-500";
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="flex items-center justify-center space-x-2"><svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Salvando...</span></span>`;
    submitBtn.disabled = true;

    try {
      const resp = await userApi.aggiornaProfilo({ password: newPassword.value });
      if (resp.success) {
        editMsg.innerHTML = `<div class="flex items-center justify-center space-x-2 text-green-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Profilo aggiornato con successo!</span></div>`;
        setTimeout(() => location.reload(), 1500);
      } else {
        editMsg.innerHTML = messaggioErrore(resp.message || "Errore");
      }
    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      editMsg.innerHTML = messaggioErrore("Errore durante il salvataggio.");
    } finally {
      submitBtn.innerHTML = originalContent;
      submitBtn.disabled = false;
    }
  });
}

function messaggioErrore(testo) {
  return `<div class="flex items-center justify-center space-x-2 text-red-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><span>${testo}</span></div>`;
}
