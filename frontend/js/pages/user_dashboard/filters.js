// Filtri della dashboard utente: selettori multipli con ricerca + applicazione filtri
import { createFilterGroup } from "../../components/FilterGroup.js";
import { normalize } from "../../shared/dom.js";
import { state } from "./state.js";

const GIORNI_SETTIMANA = [
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
  "domenica",
];

// Opzioni uniche {value: id, label: nome} dagli orari dell'utente, ordinate per nome
function opzioniDa(arr, chiaveId, chiaveNome) {
  const mappa = new Map();
  arr.forEach((s) => {
    if (s[chiaveId] != null && s[chiaveNome]) mappa.set(s[chiaveId], s[chiaveNome]);
  });
  return [...mappa]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "it"));
}

// Crea i selettori (una volta sola, all'avvio della pagina)
export function initFilterControls(onChange) {
  state.filters = createFilterGroup(
    {
      teacher: { host: "filter-teacher-u", placeholder: "Tutti i docenti", search: "Cerca docente…", label: "Filtra per docente" },
      room: { host: "filter-room-u", placeholder: "Tutte le aule", search: "Cerca aula…", label: "Filtra per aula" },
      subject: { host: "filter-subject-u", placeholder: "Tutte le materie", search: "Cerca materia…", label: "Filtra per materia" },
      day: { host: "filter-date-u", placeholder: "Tutti i giorni", search: "Cerca giorno…", label: "Filtra per giorno" },
    },
    onChange,
  );
}

// Aggiorna le opzioni dagli orari correnti, mantenendo le selezioni ancora valide
export function populateFilterOptions() {
  const { allSchedules } = state;
  const etichette = new Map(allSchedules.filter((s) => s.day).map((s) => [normalize(s.day), s.day]));
  state.filters?.setOptions({
    teacher: opzioniDa(allSchedules, "teacher_id", "teacher"),
    room: opzioniDa(allSchedules, "room_id", "room"),
    subject: opzioniDa(allSchedules, "subject_id", "subject"),
    day: GIORNI_SETTIMANA.filter((g) => etichette.has(g)).map((g) => etichette.get(g)),
  });
}

// Applica i filtri correnti alle lezioni dell'utente
export function getFilteredUserSchedules() {
  const { allCourses, allSchedules, filters } = state;

  const docenti = filters.values("teacher");
  const aule = filters.values("room");
  const materie = filters.values("subject");
  const giorni = filters.values("day", normalize);
  const dataEsatta = document.getElementById("filter-date-exact-u")?.value;

  return allSchedules
    .filter(
      (s) =>
        allCourses.some((c) => c.id == s.course_id) &&
        (!docenti.size || docenti.has(String(s.teacher_id))) &&
        (!aule.size || aule.has(String(s.room_id))) &&
        (!materie.size || materie.has(String(s.subject_id))) &&
        (!giorni.size || giorni.has(normalize(s.day))) &&
        (!dataEsatta || s.date === dataEsatta),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time),
    );
}

export function resetFilters() {
  state.filters?.clear();
  const dateInput = document.getElementById("filter-date-exact-u");
  if (dateInput) dateInput.value = "";
}
