// Modale "Modifica profilo" della dashboard utente
import { userApi } from "../../shared/api.js";
import { requisitiMancanti } from "../../shared/password.js";

const $ = (id) => document.getElementById(id);

export function initEditProfile() {
  const modal = $("edit-profile-modal");
  const usernameDisplay = $("new_username");
  const usernameHidden = $("username_hidden");
  const newPassword = $("new_password");
  const editHint = $("edit-password-hint");
  const editMsg = $("edit-profile-msg");

  function openModal() {
    modal.classList.remove("hidden");
    userApi
      .corrente()
      .then((data) => {
        usernameDisplay.value = data.username;
        if (usernameHidden) usernameHidden.value = data.username;
      })
      .catch(() => {
        editMsg.textContent = "Errore nel recupero username";
        editMsg.className =
          "text-center text-xs md:text-sm font-medium text-red-500";
      });
  }

  function closeModal() {
    modal.classList.add("hidden");
    newPassword.value = "";
    editHint.textContent = "";
    editMsg.textContent = "";
  }

  // Tre pulsanti possono aprire il modale (desktop, mobile, header)
  ["edit-profile-btn", "edit-profile-btn-mobile", "edit-profile-btn-header"].forEach(
    (id) => $(id)?.addEventListener("click", openModal),
  );
  $("close-modal")?.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Validazione password live
  newPassword.addEventListener("input", () => {
    const missing = requisitiMancanti(newPassword.value);
    const map = {
      "8+ caratteri": "Min 8 caratteri. ",
      maiuscola: "Almeno una maiuscola. ",
      minuscola: "Almeno una minuscola. ",
      numero: "Almeno un numero. ",
    };
    const msg = missing.map((m) => map[m] || "").join("");
    editHint.textContent = msg;
    editHint.className = msg
      ? "text-xs md:text-sm mt-2 text-red-500"
      : "text-xs md:text-sm mt-2 text-green-500";
  });

  // Submit
  $("edit-profile-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (editHint.textContent !== "" && !editHint.className.includes("green")) {
      editMsg.textContent = "Correggi la password prima di salvare.";
      editMsg.className =
        "text-center text-xs md:text-sm font-medium text-red-500";
      return;
    }
    try {
      const resp = await userApi.aggiornaProfilo({
        username: usernameHidden ? usernameHidden.value : usernameDisplay.value,
        password: newPassword.value,
      });
      if (resp.success) {
        editMsg.textContent = "Profilo aggiornato con successo!";
        editMsg.className =
          "text-center text-xs md:text-sm font-medium text-green-500";
        newPassword.value = "";
        editHint.textContent = "";
      } else {
        editMsg.textContent = resp.message || "Errore sconosciuto";
        editMsg.className =
          "text-center text-xs md:text-sm font-medium text-red-500";
      }
    } catch {
      editMsg.textContent = "Errore di rete.";
      editMsg.className =
        "text-center text-xs md:text-sm font-medium text-red-500";
    }
  });
}
