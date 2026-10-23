// Caricamento dati (corsi, orari, anagrafiche), select corso e datalist di autocompletamento
import {
  coursesApi,
  schedulesApi,
  teachersApi,
  roomsApi,
  subjectsApi,
} from "../../shared/api.js";
import { state } from "./state.js";
import { renderSchedules, updateScheduleStats } from "./render.js";
import { populateFilterOptions } from "./filters.js";

export async function fetchCoursesAndSchedules() {
  const [courses, schedules, teachers, rooms, subjects] = await Promise.all([
    coursesApi.lista(),
    schedulesApi.lista(),
    teachersApi.lista(),
    roomsApi.lista(),
    subjectsApi.lista(),
  ]);
  state.courses = courses;
  state.schedules = schedules;
  state.teachers = teachers;
  state.rooms = rooms;
  state.subjects = subjects;

  populateFilterOptions();
  renderSchedules();
  updateDatalists();
  updateScheduleStats();
}

// Ricarica solo le anagrafiche (dopo l'aggiunta di un nuovo docente/aula/materia)
export async function fetchCatalogs() {
  const [teachers, rooms, subjects] = await Promise.all([
    teachersApi.lista(),
    roomsApi.lista(),
    subjectsApi.lista(),
  ]);
  state.teachers = teachers;
  state.rooms = rooms;
  state.subjects = subjects;
  updateDatalists();
}

// Popola i <datalist> di docenti/aule/materie per l'autocompletamento
export function updateDatalists() {
  const riempi = (id, voci) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    voci.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.name;
      el.appendChild(opt);
    });
  };

  riempi("teacher-list", state.teachers);
  riempi("room-list", state.rooms);
  riempi("subject-list", state.subjects);
}
