// Comportamenti dei form: ora di fine automatica, giorno automatico,
// e aggiunta dinamica di nuovi docenti/aule/materie.
import { state, addOneHourToTime, getDayOfWeek } from "./state.js";
import { updateDatalists } from "./data.js";

const $ = (id) => document.getElementById(id);

// Imposta l'ora di fine a +1h quando cambia l'inizio (se non modificata a mano)
export function setupAutoEndTime() {
  const collega = (startId, endId) => {
    const start = $(startId);
    const end = $(endId);
    let endModified = false;
    start.addEventListener("change", () => {
      if (!endModified && start.value) end.value = addOneHourToTime(start.value);
      endModified = false;
    });
    end.addEventListener("input", () => {
      endModified = true;
    });
  };
  collega("add-start", "add-end");
  collega("edit-start", "edit-end");
}

// Calcola il giorno della settimana dalla data
export function setupAutoDayOfWeek() {
  $("add-date").addEventListener("change", () => {
    $("add-day").value = $("add-date").value
      ? getDayOfWeek($("add-date").value)
      : "";
  });
  $("edit-date").addEventListener("change", () => {
    $("edit-day").textContent = $("edit-date").value
      ? getDayOfWeek($("edit-date").value)
      : "";
  });
}

// Mostra il pulsante "+" se il valore digitato non esiste ancora
export function toggleAddButtonVisibility(modalType, field) {
  const input = $(`${modalType}-${field}`);
  const button = $(`${modalType}-${field}-btn`);
  const value = input.value.trim();
  const existing = [
    ...new Set(state.schedules.map((s) => s[field]).filter(Boolean)),
  ];
  button.style.display = value && !existing.includes(value) ? "block" : "none";
}

// Registra un nuovo valore (docente/aula/materia) come opzione disponibile
function handleAdd(inputId, key, modalType) {
  const input = $(`${modalType}-${inputId}`);
  const value = input.value.trim();
  if (value && !state.schedules.some((s) => s[key] === value)) {
    state.schedules.push({
      id: Date.now(),
      course_id:
        modalType === "add"
          ? $("add-course-select").value
          : $("edit-course-select").value,
      teacher: key === "teacher" ? value : "",
      room: key === "room" ? value : "",
      subject: key === "subject" ? value : "",
      day: "",
      date: "",
      start_time: "",
      end_time: "",
    });
    updateDatalists();
    input.value = value;
    toggleAddButtonVisibility(modalType, inputId);
  }
}

// Collega i listener dei campi con aggiunta dinamica
export function setupDynamicFields() {
  const campi = ["teacher", "room", "subject"];
  ["add", "edit"].forEach((modalType) => {
    campi.forEach((field) => {
      $(`${modalType}-${field}-btn`).onclick = () =>
        handleAdd(field, field, modalType);
      $(`${modalType}-${field}`).addEventListener("input", () =>
        toggleAddButtonVisibility(modalType, field),
      );
    });
  });
}
