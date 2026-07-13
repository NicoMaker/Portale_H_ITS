// Modali della pagina Gestione Orari: aggiungi, modifica, elimina
import { schedulesApi } from "../../shared/api.js";
import { formatDate } from "../../shared/dom.js";
import { state } from "./state.js";
import { fetchCoursesAndSchedules } from "./data.js";
import { renderSchedules } from "./render.js";
import { toggleAddButtonVisibility } from "./formHelpers.js";

const $ = (id) => document.getElementById(id);

function mostraMsg(el, testo, ok) {
  el.textContent = testo;
  el.className = ok
    ? "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800"
    : "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
}

// Valida i campi comuni ad add/edit; ritorna un messaggio d'errore o null
function validaOrario({ start_time, end_time, course_id, date, ignoreId }, prefix) {
  const bottoniAperti = ["teacher", "room", "subject"].some(
    (f) => $(`${prefix}-${f}-btn`).style.display !== "none",
  );
  if (bottoniAperti)
    return "Per favore, aggiungi i nuovi valori prima di salvare l'orario.";
  if (start_time >= end_time)
    return "L'ora di inizio deve essere precedente a quella di fine.";
  const overlap = state.schedules.some(
    (s) =>
      String(s.course_id) === String(course_id) &&
      s.date === date &&
      s.start_time === start_time &&
      (ignoreId === undefined || s.id != ignoreId),
  );
  if (overlap)
    return "Esiste già un orario per questo corso, data e ora di inizio.";
  return null;
}

// ── AGGIUNGI ──
function apriAdd() {
  const filterVal = $("filter-course").value;
  const sorted = [...state.courses].sort((a, b) => a.name.localeCompare(b.name));
  $("add-course-select").innerHTML =
    `<option value="" disabled selected>Seleziona un corso</option>` +
    sorted
      .map(
        (c) =>
          `<option value="${c.id}"${filterVal && c.name === filterVal ? " selected" : ""}>${c.name}</option>`,
      )
      .join("");
  ["teacher", "room", "subject", "day", "date", "start", "end"].forEach(
    (f) => ($(`add-${f}`).value = ""),
  );
  $("add-schedule-msg").textContent = "";
  $("add-schedule-modal").style.display = "flex";
  ["teacher", "room", "subject"].forEach((f) =>
    toggleAddButtonVisibility("add", f),
  );
}

async function submitAdd(e) {
  e.preventDefault();
  const msgEl = $("add-schedule-msg");
  const dati = raccogliDati("add");

  const errore = validaOrario({ ...dati, ignoreId: undefined }, "add");
  if (errore) return mostraMsg(msgEl, errore, false);

  msgEl.textContent = "";
  const msg = await schedulesApi.crea(dati);
  if (msg === "OK") {
    mostraMsg(msgEl, "Orario aggiunto con successo!", true);
    await fetchCoursesAndSchedules();
    setTimeout(() => ($("add-schedule-modal").style.display = "none"), 1500);
  } else {
    mostraMsg(msgEl, msg, false);
  }
}

// ── MODIFICA ──
export function openEditSchedule(id) {
  state.editingScheduleId = id;
  const s = state.schedules.find((x) => x.id == id);
  const sorted = [...state.courses].sort((a, b) => a.name.localeCompare(b.name));

  $("edit-course-select").innerHTML = sorted
    .map(
      (c) =>
        `<option value="${c.id}"${c.id == s.course_id ? " selected" : ""}>${c.name}</option>`,
    )
    .join("");

  $("edit-teacher").value = s.teacher;
  $("edit-room").value = s.room;
  $("edit-subject").value = s.subject || "";
  $("edit-day").textContent = s.day || "";
  $("edit-date").value = s.date;
  $("edit-start").value = s.start_time;
  $("edit-end").value = s.end_time;
  $("edit-schedule-msg").textContent = "";
  $("edit-schedule-modal").style.display = "flex";

  ["teacher", "room", "subject"].forEach((f) =>
    toggleAddButtonVisibility("edit", f),
  );
}

async function submitEdit(e) {
  e.preventDefault();
  const msgEl = $("edit-schedule-msg");
  const dati = raccogliDati("edit");

  const errore = validaOrario(
    { ...dati, ignoreId: state.editingScheduleId },
    "edit",
  );
  if (errore) return mostraMsg(msgEl, errore, false);

  msgEl.textContent = "";
  const msg = await schedulesApi.modifica(state.editingScheduleId, dati);
  await fetchCoursesAndSchedules();
  if (msg === "OK") {
    mostraMsg(msgEl, "Orario aggiornato!", true);
    $("filter-course").value = dati.course_id;
    renderSchedules();
    setTimeout(() => ($("edit-schedule-modal").style.display = "none"), 1000);
  } else {
    mostraMsg(msgEl, msg, false);
  }
}

// Legge i valori del form (il giorno di edit sta in un <span>)
function raccogliDati(prefix) {
  return {
    course_id: $(`${prefix}-course-select`).value,
    teacher: $(`${prefix}-teacher`).value,
    room: $(`${prefix}-room`).value,
    subject: $(`${prefix}-subject`).value,
    day:
      prefix === "add"
        ? $("add-day").value
        : $("edit-day").textContent,
    date: $(`${prefix}-date`).value,
    start_time: $(`${prefix}-start`).value,
    end_time: $(`${prefix}-end`).value,
  };
}

// ── ELIMINA ──
export function openDeleteScheduleModal(id) {
  state.deletingScheduleId = id;
  const s = state.schedules.find((x) => x.id == id);
  const course = state.courses.find((c) => c.id == s.course_id);
  const set = (id, v) => ($(id).textContent = v);
  set("delete-schedule-course-display", course ? course.name : "-");
  set("delete-schedule-teacher-display", s.teacher);
  set("delete-schedule-subject-display", s.subject);
  set("delete-schedule-room-display", s.room);
  set("delete-schedule-day-display", s.day);
  set("delete-schedule-date-display", formatDate(s.date));
  set("delete-schedule-start-display", s.start_time);
  set("delete-schedule-end-display", s.end_time);
  $("delete-schedule-modal").style.display = "flex";
}

async function deleteSchedule() {
  if (!state.deletingScheduleId) return;
  await schedulesApi.elimina(state.deletingScheduleId);
  await fetchCoursesAndSchedules();
  $("delete-schedule-modal").style.display = "none";
  state.deletingScheduleId = null;
}

// ── Setup listener dei modali ──
export function initModali() {
  $("add-schedule-btn").onclick = apriAdd;
  $("add-schedule-form").onsubmit = submitAdd;
  $("edit-schedule-form").onsubmit = submitEdit;
  $("confirm-delete-schedule").onclick = deleteSchedule;

  const chiudi = (id, resetDelete = false) => {
    $(id).style.display = "none";
    if (resetDelete) state.deletingScheduleId = null;
  };

  $("close-edit-schedule-modal").onclick = () => chiudi("edit-schedule-modal");
  $("cancel-edit-schedule").onclick = () => chiudi("edit-schedule-modal");
  $("close-add-schedule-modal").onclick = () => chiudi("add-schedule-modal");
  $("cancel-add-schedule").onclick = () => chiudi("add-schedule-modal");
  $("close-delete-schedule-modal").onclick = () =>
    chiudi("delete-schedule-modal", true);
  $("cancel-delete-schedule").onclick = () =>
    chiudi("delete-schedule-modal", true);

  window.addEventListener("click", (e) => {
    if (e.target === $("edit-schedule-modal")) chiudi("edit-schedule-modal");
    if (e.target === $("add-schedule-modal")) chiudi("add-schedule-modal");
    if (e.target === $("delete-schedule-modal"))
      chiudi("delete-schedule-modal", true);
  });
}
