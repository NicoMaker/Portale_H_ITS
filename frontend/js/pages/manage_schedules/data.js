// Caricamento dati (corsi + orari), select corso e datalist di autocompletamento
import { coursesApi, schedulesApi } from "../../shared/api.js";
import { state } from "./state.js";
import { renderSchedules, updateScheduleStats } from "./render.js";
import { populateFilterOptions } from "./filters.js";

export async function fetchCoursesAndSchedules() {
  const [allCourses, allSchedules] = await Promise.all([
    coursesApi.lista(),
    schedulesApi.lista(),
  ]);
  state.courses = allCourses;
  state.schedules = allSchedules;

  const uniqueCourseNames = [
    ...new Set(state.courses.map((c) => c.name)),
  ].sort();
  const select = document.getElementById("filter-course");
  if (select) {
    select.innerHTML =
      '<option value="">Tutti i corsi</option>' +
      uniqueCourseNames
        .map((name) => `<option value="${name}">${name}</option>`)
        .join("");
  }

  populateFilterOptions();
  renderSchedules();
  updateDatalists();
  updateScheduleStats();
}

// Popola i <datalist> di docenti/aule/materie per l'autocompletamento
export function updateDatalists() {
  const unici = (key) =>
    [...new Set(state.schedules.map((s) => s[key]).filter(Boolean))].sort();

  const riempi = (id, valori) => {
    const el = document.getElementById(id);
    if (el)
      el.innerHTML = valori.map((v) => `<option value="${v}">`).join("");
  };

  riempi("teacher-list", unici("teacher"));
  riempi("room-list", unici("room"));
  riempi("subject-list", unici("subject"));
}
