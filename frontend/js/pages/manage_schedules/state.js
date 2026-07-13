// Stato della pagina Gestione Orari + utility su orari e giorni della settimana

export const state = {
  courses: [],
  schedules: [],
  editingScheduleId: null,
  deletingScheduleId: null,
  // Istanze Choices.js
  teacherChoices: null,
  roomChoices: null,
  subjectChoices: null,
  dayChoices: null,
};

const GIORNI = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

export const ORDINE_GIORNI = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
];

// Aggiunge un'ora a un orario "HH:MM"
export function addOneHourToTime(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0);
  date.setHours(date.getHours() + 1);
  return date.toTimeString().slice(0, 5);
}

// Ricava il giorno della settimana (in italiano) da una data ISO
export function getDayOfWeek(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return GIORNI[date.getDay()];
}
