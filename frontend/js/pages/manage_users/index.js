// Entry point pagina Gestione Utenti: collega dati, render, modali, filtri e realtime
import { toast } from "../../shared/dom.js";
import { renderUsersList } from "./render.js";
import {
  fetchCourses,
  fetchUsers,
  updateNewCourseSelect,
} from "./data.js";
import {
  initModali,
  showChangeRoleModal,
  openEditUser,
  deleteUser,
  assignCourse,
} from "./modals.js";

const $ = (id) => document.getElementById(id);

// Le righe della tabella sono generate con onclick inline:
// gli handler devono essere raggiungibili come globali.
window.showChangeRoleModal = showChangeRoleModal;
window.openEditUser = openEditUser;
window.deleteUser = deleteUser;
window.assignCourse = assignCourse;

function toggleFilterCourseVisibility() {
  const filterRole = $("filter-role").value;
  const group = $("filter-course").closest(".filter-group");
  if (filterRole === "admin") {
    group.style.display = "none";
    $("filter-course").value = "";
  } else {
    group.style.display = "";
  }
}

function clearAllFilters() {
  $("search-user").value = "";
  $("filter-course").value = "";
  $("filter-role").value = "";
  $("filter-user-date").value = "";
  toggleFilterCourseVisibility();
  renderUsersList();
}

function initFiltri() {
  $("search-user").addEventListener("input", renderUsersList);
  $("filter-course").addEventListener("change", renderUsersList);
  $("filter-role")?.addEventListener("change", () => {
    toggleFilterCourseVisibility();
    renderUsersList();
  });
  $("filter-user-date")?.addEventListener("input", renderUsersList);
  $("clear-filters-btn")?.addEventListener("click", clearAllFilters);
}

function initRealtime() {
  if (!window.AppSocket) return;
  const labels = {
    created: "✅ Nuovo utente creato",
    deleted: "🗑️ Utente eliminato",
    edited: "✏️ Utente modificato",
    promoted: "👑 Promosso ad admin",
    demoted: "👤 Retrocesso a utente",
    course_assigned: "📚 Corso aggiornato",
    profile_updated: "👤 Profilo aggiornato",
  };
  AppSocket.on("users_updated", ({ action }) => {
    fetchCourses().then(fetchUsers);
    toast(labels[action] || "🔄 Dati aggiornati");
  });
  AppSocket.on("courses_updated", () => fetchCourses().then(fetchUsers));
}

document.addEventListener("DOMContentLoaded", () => {
  $("new-role").addEventListener("change", updateNewCourseSelect);
  initModali();
  initFiltri();
  initRealtime();

  toggleFilterCourseVisibility();
  fetchCourses().then(fetchUsers);

  $("refresh-data")?.addEventListener("click", () =>
    fetchCourses().then(fetchUsers),
  );
});
