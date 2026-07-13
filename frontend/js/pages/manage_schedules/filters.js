// Filtri della pagina Gestione Orari: Choices.js + logica di filtro condivisa
import { state, ORDINE_GIORNI } from "./state.js";
import { renderSchedules } from "./render.js";

// Inizializza (o reinizializza) le multi-select Choices.js
export function populateFilterOptions() {
  const unici = (key) =>
    [...new Set(state.schedules.map((s) => s[key]).filter(Boolean))].sort();

  const teachers = unici("teacher");
  const rooms = unici("room");
  const subjects = unici("subject");
  const days = [
    ...new Set(state.schedules.map((s) => s.day).filter(Boolean)),
  ].sort((a, b) => ORDINE_GIORNI.indexOf(a) - ORDINE_GIORNI.indexOf(b));

  // Distrugge le istanze esistenti per evitare duplicati
  state.teacherChoices?.destroy();
  state.roomChoices?.destroy();
  state.subjectChoices?.destroy();
  state.dayChoices?.destroy();

  const crea = (selector, valori) => {
    const inst = new Choices(selector, {
      choices: valori.map((v) => ({ value: v, label: v })),
      removeItemButton: true,
    });
    inst.passedElement.element.addEventListener("change", renderSchedules);
    return inst;
  };

  state.teacherChoices = crea("#filter-teacher", teachers);
  state.roomChoices = crea("#filter-room", rooms);
  state.subjectChoices = crea("#filter-subject", subjects);
  state.dayChoices = crea("#filter-day", days);
}

// Ritorna gli orari filtrati secondo i controlli correnti
export function getFilteredSchedules() {
  const courseNameFilter = document.getElementById("filter-course")?.value;
  const teacherFilter = state.teacherChoices?.getValue(true) || [];
  const roomFilter = state.roomChoices?.getValue(true) || [];
  const subjectFilter = state.subjectChoices?.getValue(true) || [];
  const dayFilter = state.dayChoices?.getValue(true) || [];
  const dateFilter = document.getElementById("filter-date")?.value;

  let filtered = state.schedules;

  if (courseNameFilter) {
    const ids = state.courses
      .filter((c) => c.name === courseNameFilter)
      .map((c) => String(c.id));
    filtered = filtered.filter((s) => ids.includes(String(s.course_id)));
  }
  if (teacherFilter.length)
    filtered = filtered.filter((s) => teacherFilter.includes(s.teacher));
  if (roomFilter.length)
    filtered = filtered.filter((s) => roomFilter.includes(s.room));
  if (subjectFilter.length)
    filtered = filtered.filter((s) => subjectFilter.includes(s.subject));
  if (dayFilter.length)
    filtered = filtered.filter((s) => dayFilter.includes(s.day));
  if (dateFilter) filtered = filtered.filter((s) => s.date === dateFilter);

  return filtered;
}

export function clearFilters() {
  const courseSelect = document.getElementById("filter-course");
  if (courseSelect) courseSelect.value = "";
  state.teacherChoices?.removeActiveItems();
  state.roomChoices?.removeActiveItems();
  state.subjectChoices?.removeActiveItems();
  state.dayChoices?.removeActiveItems();
  const dateInput = document.getElementById("filter-date");
  if (dateInput) dateInput.value = "";
  renderSchedules();
}
