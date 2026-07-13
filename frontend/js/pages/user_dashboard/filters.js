// Filtri della dashboard utente: popolamento opzioni Choices.js e applicazione filtri
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

function valoriUnici(arr, key) {
  return [...new Set(arr.map((i) => i[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "it"),
  );
}

export function populateFilterOptions() {
  const { allSchedules, teacherChoices, roomChoices, subjectChoices, dayChoices } =
    state;

  const setChoices = (instance, valori) => {
    instance.clearChoices();
    instance.setChoices(
      valori.map((v) => ({ value: v, label: v })),
      "value",
      "label",
      true,
    );
  };

  setChoices(teacherChoices, valoriUnici(allSchedules, "teacher"));
  setChoices(roomChoices, valoriUnici(allSchedules, "room"));
  setChoices(subjectChoices, valoriUnici(allSchedules, "subject"));

  // Giorni ordinati secondo la settimana
  const giorniPresenti = new Set(
    allSchedules.map((s) => normalize(s.day)).filter(Boolean),
  );
  const giorniOrdinati = GIORNI_SETTIMANA.filter((g) => giorniPresenti.has(g));
  const labelOriginali = new Map(
    allSchedules.map((s) => [normalize(s.day), s.day]),
  );
  dayChoices.clearChoices();
  dayChoices.setChoices(
    giorniOrdinati.map((g) => ({
      value: labelOriginali.get(g),
      label: labelOriginali.get(g),
    })),
    "value",
    "label",
    true,
  );
}

// Applica i filtri correnti alle lezioni dell'utente
export function getFilteredUserSchedules() {
  const { allCourses, allSchedules, teacherChoices, roomChoices, subjectChoices, dayChoices } =
    state;

  let filtered = allSchedules.filter((s) =>
    allCourses.some((c) => c.id == s.course_id),
  );

  const teacherFilter = teacherChoices ? teacherChoices.getValue(true) : [];
  const roomFilter = roomChoices ? roomChoices.getValue(true) : [];
  const subjectFilter = subjectChoices ? subjectChoices.getValue(true) : [];
  const dayFilter = dayChoices ? dayChoices.getValue(true) : [];
  const dateExact = document.getElementById("filter-date-exact-u")?.value;

  if (teacherFilter.length)
    filtered = filtered.filter((s) => teacherFilter.includes(s.teacher));
  if (roomFilter.length)
    filtered = filtered.filter((s) => roomFilter.includes(s.room));
  if (subjectFilter.length)
    filtered = filtered.filter((s) => subjectFilter.includes(s.subject));
  if (dayFilter.length)
    filtered = filtered.filter((s) =>
      dayFilter.map(normalize).includes(normalize(s.day)),
    );
  if (dateExact) filtered = filtered.filter((s) => s.date === dateExact);

  return filtered.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time),
  );
}

export function resetFilters() {
  state.teacherChoices.clearStore();
  state.roomChoices.clearStore();
  state.subjectChoices.clearStore();
  state.dayChoices.clearStore();
  const dateInput = document.getElementById("filter-date-exact-u");
  if (dateInput) dateInput.value = "";
  populateFilterOptions();
}
