// Modali della pagina Gestione Utenti: crea, modifica, elimina, cambio ruolo
import { usersApi } from "../../shared/api.js";
import { showMessage, chiudiModaliSuOverlay } from "../../shared/dom.js";
import { collegaHintPassword } from "../../shared/password.js";
import { state } from "./state.js";
import { fetchCourses, fetchUsers, updateNewCourseSelect } from "./data.js";

const $ = (id) => document.getElementById(id);

// ── Cambio ruolo ──
export function showChangeRoleModal(userId, newRole) {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return;
  state.userToChangeId = user.id;
  state.userToChangeRole = newRole;
  $("change-role-modal-title").textContent = `Cambia ruolo — ${user.username}`;
  $("change-role-modal-text").textContent =
    `Vuoi cambiare il ruolo di ${user.username} da ${user.role} a ${newRole}?`;
  const btn = $("confirm-change-role-btn");
  btn.textContent = `Sì, rendi ${newRole}`;
  btn.style.background = newRole === "admin" ? "#16a34a" : "#6b7280";
  $("change-role-modal").style.display = "flex";
}

export function hideChangeRoleModal() {
  $("change-role-modal").style.display = "none";
  state.userToChangeId = state.userToChangeRole = null;
}

async function changeUserRole() {
  if (!state.userToChangeId || !state.userToChangeRole) return;
  try {
    const r =
      state.userToChangeRole === "admin"
        ? await usersApi.promuovi(state.userToChangeId)
        : await usersApi.retrocedi(state.userToChangeId);
    if (!r.ok) throw new Error(await r.text());
    hideChangeRoleModal();
    fetchUsers();
  } catch (err) {
    console.error(err);
    hideChangeRoleModal();
  }
}

// ── Eliminazione ──
export function deleteUser(id) {
  state.userToDeleteId = id;
  const user = state.users.find((u) => u.id == id);
  if (user) {
    $("delete-user-name-display").textContent = user.username;
    const adminCount = state.users.filter((u) => u.role === "admin").length;
    const warn = $("delete-admin-warning");
    const btn = $("confirm-delete-user");
    if (user.role === "admin" && adminCount <= 1) {
      warn.style.display = "block";
      btn.disabled = true;
      btn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      warn.style.display = "none";
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
  $("delete-user-confirm-modal").style.display = "flex";
}

// ── Assegnazione corso ──
export async function assignCourse(id, courseId) {
  const msg = await usersApi.assegnaCorso(id, courseId);
  showMessage(
    "assign-msg",
    msg === "OK" ? "Corso assegnato!" : msg,
    msg === "OK" ? "success" : "error",
  );
  if (msg === "OK") fetchUsers();
}

// ── Modifica utente ──
export function openEditUser(id) {
  state.editingUserId = id;
  const user = state.users.find((u) => u.id === id);
  $("edit_username").value = user.username;
  $("edit_password").value = "";
  $("edit-user-password-hint").textContent = "";
  $("edit-user-msg").classList.add("hidden");
  $("edit-user-modal").style.display = "flex";
}

// ── Setup di tutti i listener dei modali ──
export function initModali() {
  // Apertura/chiusura
  $("add-user-btn").onclick = () => {
    $("add-user-modal").style.display = "flex";
    $("add-user-msg").classList.add("hidden");
    updateNewCourseSelect();
  };
  $("close-add-user-modal").onclick = () =>
    ($("add-user-modal").style.display = "none");
  $("cancel-add-user").onclick = () =>
    ($("add-user-modal").style.display = "none");
  $("close-edit-modal").onclick = () =>
    ($("edit-user-modal").style.display = "none");
  $("cancel-edit-user").onclick = () =>
    ($("edit-user-modal").style.display = "none");
  $("close-schedules-modal").onclick = () =>
    ($("user-schedules-modal").style.display = "none");

  chiudiModaliSuOverlay([
    "edit-user-modal",
    "user-schedules-modal",
    "add-user-modal",
    "delete-user-confirm-modal",
  ]);
  window.addEventListener("click", (e) => {
    if (e.target === $("change-role-modal")) hideChangeRoleModal();
  });

  // Eliminazione
  $("close-delete-user-confirm-modal").onclick = () =>
    ($("delete-user-confirm-modal").style.display = "none");
  $("cancel-delete-user-modal").onclick = () =>
    ($("delete-user-confirm-modal").style.display = "none");
  $("confirm-delete-user").onclick = async () => {
    if (state.userToDeleteId) {
      try {
        await usersApi.elimina(state.userToDeleteId);
        fetchUsers();
      } catch (err) {
        console.error(err);
      }
      $("delete-user-confirm-modal").style.display = "none";
    }
  };

  // Cambio ruolo
  $("confirm-change-role-btn").addEventListener("click", changeUserRole);
  $("cancel-change-role-btn").addEventListener("click", hideChangeRoleModal);
  $("close-change-role-modal").addEventListener("click", hideChangeRoleModal);

  // Validazione password live
  const newPassword = $("new-password");
  const addHint = $("add-password-hint");
  collegaHintPassword(newPassword, addHint);
  collegaHintPassword($("edit_password"), $("edit-user-password-hint"));

  // Form crea utente
  $("add-user-form").onsubmit = async function (e) {
    e.preventDefault();
    if (addHint.textContent && !addHint.textContent.startsWith("✓")) {
      showMessage("add-user-msg", "Correggi gli errori nella password", "error");
      return;
    }
    const msg = await usersApi.crea({
      username: $("new-username").value,
      password: newPassword.value,
      role: $("new-role").value,
      course_id: $("new-course").value,
    });
    if (msg === "OK") {
      showMessage("add-user-msg", "Utente creato!", "success");
      this.reset();
      updateNewCourseSelect();
      fetchUsers();
      setTimeout(() => ($("add-user-modal").style.display = "none"), 1400);
    } else {
      showMessage("add-user-msg", msg, "error");
    }
  };

  // Form modifica utente
  const editHint = $("edit-user-password-hint");
  $("edit-user-form").onsubmit = async function (e) {
    e.preventDefault();
    if (editHint.textContent && !editHint.textContent.startsWith("✓")) {
      showMessage("edit-user-msg", "Correggi gli errori nella password", "error");
      return;
    }
    const msg = await usersApi.modifica(state.editingUserId, {
      username: $("edit_username").value,
      password: $("edit_password").value,
    });
    if (msg === "OK") {
      showMessage("edit-user-msg", "Utente aggiornato!", "success");
      fetchUsers();
      setTimeout(() => ($("edit-user-modal").style.display = "none"), 1400);
    } else {
      showMessage("edit-user-msg", msg, "error");
    }
  };
}
