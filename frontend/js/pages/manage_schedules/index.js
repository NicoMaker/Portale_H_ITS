// Entry point della pagina Gestione Orari
import { state } from "./state.js";
import { fetchCoursesAndSchedules } from "./data.js";
import { renderSchedules } from "./render.js";
import { clearFilters } from "./filters.js";
import {
  setupAutoEndTime,
  setupAutoDayOfWeek,
  setupDynamicFields,
} from "./formHelpers.js";
import {
  initModali,
  openEditSchedule,
  openDeleteScheduleModal,
} from "./modals.js";

const $ = (id) => document.getElementById(id);

// Le righe usano onclick inline: gli handler devono essere globali
window.openEditSchedule = openEditSchedule;
window.openDeleteScheduleModal = openDeleteScheduleModal;

function initFiltri() {
  $("filter-course").onchange = renderSchedules;
  $("filter-date").oninput = renderSchedules;
  $("clear-filters-btn")?.addEventListener("click", clearFilters);
}

function initRealtime() {
  if (!window.AppSocket) return;
  ["schedules_updated", "courses_updated"].forEach((ev) =>
    AppSocket.on(ev, fetchCoursesAndSchedules),
  );
}

document.addEventListener("DOMContentLoaded", () => {
  setupAutoEndTime();
  setupAutoDayOfWeek();
  setupDynamicFields();
  initModali();
  initFiltri();
  initRealtime();

  fetchCoursesAndSchedules();

  $("refresh-data")?.addEventListener("click", fetchCoursesAndSchedules);
});
