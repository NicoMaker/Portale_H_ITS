// Filtri della pagina Gestione Orari: usa il componente FilterGroup + logica di filtro
import { createFilterGroup } from "../../components/FilterGroup.js";
import { state, ORDINE_GIORNI } from "./state.js";
import { renderSchedules } from "./render.js";

const $ = (id) => document.getElementById(id);

const CAMPI = {
  course: { host: "filter-course", placeholder: "Tutti i corsi", search: "Cerca corso…", label: "Filtra per corso" },
  teacher: { host: "filter-teacher", placeholder: "Tutti i docenti", search: "Cerca docente…", label: "Filtra per docente" },
  room: { host: "filter-room", placeholder: "Tutte le aule", search: "Cerca aula…", label: "Filtra per aula" },
  subject: { host: "filter-subject", placeholder: "Tutte le materie", search: "Cerca materia…", label: "Filtra per materia" },
  day: { host: "filter-day", placeholder: "Tutti i giorni", search: "Cerca giorno…", label: "Filtra per giorno" },
};

// Crea i selettori (una volta sola, all'avvio della pagina)
export function initFilterControls() {
  state.filters = createFilterGroup(CAMPI, renderSchedules);
}

// Aggiorna le opzioni dai dati correnti, mantenendo le selezioni ancora valide.
// Docenti/aule/materie arrivano dalle rispettive tabelle e vengono mostrati
// solo se hanno almeno un orario (altrimenti il filtro non darebbe risultati).
export function populateFilterOptions() {
  const daAnagrafica = (voci, chiave) => {
    const presenti = new Set(state.schedules.map((s) => s[chiave]));
    return voci.filter((v) => presenti.has(v.id)).map((v) => ({ value: v.id, label: v.name }));
  };
  const giorni = [...new Set(state.schedules.map((s) => s.day).filter(Boolean))].sort(
    (a, b) => ORDINE_GIORNI.indexOf(a) - ORDINE_GIORNI.indexOf(b),
  );

  state.filters?.setOptions({
    course: state.courses.map((c) => ({ value: c.id, label: c.name })),
    teacher: daAnagrafica(state.teachers, "teacher_id"),
    room: daAnagrafica(state.rooms, "room_id"),
    subject: daAnagrafica(state.subjects, "subject_id"),
    day: giorni,
  });
}

// Ritorna gli orari filtrati secondo i controlli correnti
export function getFilteredSchedules() {
  const f = state.filters;
  if (!f) return state.schedules;
  const corsi = f.values("course");
  const docenti = f.values("teacher");
  const aule = f.values("room");
  const materie = f.values("subject");
  const giorni = f.values("day");
  const data = $("filter-date")?.value;

  return state.schedules.filter(
    (s) =>
      (!corsi.size || corsi.has(String(s.course_id))) &&
      (!docenti.size || docenti.has(String(s.teacher_id))) &&
      (!aule.size || aule.has(String(s.room_id))) &&
      (!materie.size || materie.has(String(s.subject_id))) &&
      (!giorni.size || giorni.has(s.day)) &&
      (!data || s.date === data),
  );
}

export function clearFilters() {
  state.filters?.clear();
  const dateInput = $("filter-date");
  if (dateInput) dateInput.value = "";
  renderSchedules();
}
