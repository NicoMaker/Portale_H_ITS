// Entry point della dashboard utente
import { userApi } from "../../shared/api.js";
import { toast } from "../../shared/dom.js";
import { state } from "./state.js";
import {
  initFilterControls,
  populateFilterOptions,
  resetFilters,
} from "./filters.js";
import { renderCoursesBadges, renderSchedulesTable } from "./render.js";
import { initEditProfile } from "./editProfile.js";

const $ = (id) => document.getElementById(id);

async function caricaDati() {
  const [courses, schedules] = await Promise.all([
    userApi.corsi(),
    userApi.orari(),
  ]);
  state.allCourses = courses;
  state.allSchedules = schedules;
}

function renderTutto() {
  renderCoursesBadges();
  renderSchedulesTable();
}

function initFiltri() {
  initFilterControls(renderSchedulesTable);

  $("filter-date-exact-u")?.addEventListener("change", renderSchedulesTable);
  $("reset-filters-btn-u")?.addEventListener("click", () => {
    resetFilters();
    renderSchedulesTable();
  });
}

function initMobileMenu() {
  $("mobile-menu-btn")?.addEventListener("click", () => {
    $("mobile-menu")?.classList.toggle("hidden");
  });
}

function initRealtime() {
  if (!window.AppSocket) return;

  AppSocket.on("schedule_updated", async () => {
    await caricaDati();
    populateFilterOptions();
    renderTutto();
    toast("🔄 Orari aggiornati in tempo reale");
  });

  AppSocket.on("courses_updated", async () => {
    state.allCourses = await userApi.corsi();
    renderCoursesBadges();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initMobileMenu();
  initFiltri();
  initEditProfile();
  initRealtime();

  try {
    await caricaDati();
    populateFilterOptions();
    renderTutto();
  } catch (e) {
    console.error("Errore caricamento dashboard:", e);
  }

  $("refresh-btn")?.addEventListener("click", async () => {
    await caricaDati();
    populateFilterOptions();
    renderTutto();
  });
});
