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
  updateScheduleStats();
}
