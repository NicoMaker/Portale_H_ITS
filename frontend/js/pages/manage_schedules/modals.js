// Modali della pagina Gestione Orari: aggiungi, modifica, elimina.
// La validazione "vera" (sovrapposizioni aula/docente/corso, coerenza docente↔materia)
// è lato server; qui solo controlli minimi per UX.
import { schedulesApi } from "../../shared/api.js";
import { formatDate } from "../../shared/dom.js";
import { state } from "./state.js";
import { fetchCoursesAndSchedules } from "./data.js";
import { renderSchedules } from "./render.js";
import { riempiSelezioni } from "./formHelpers.js";

const $ = (id) => document.getElementById(id);

function mostraMsg(el, testo, ok) {
  el.textContent = testo;
  el.className = ok
    ? "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800"
    : "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
}

function validaOrario({
  start_time,
  end_time,
  course_id,
  date,
  subject_id,
  teacher_id,
  room_id,
}) {
  if (!course_id) return "Seleziona un corso.";
  if (!subject_id || !teacher_id || !room_id)
    return "Seleziona materia, docente e aula.";
  if (!date) return "Seleziona una data.";
  if (!start_time || !end_time) return "Indica ora di inizio e fine.";
  if (start_time >= end_time)
    return "L'ora di inizio deve essere precedente a quella di fine.";
  return null;
}

// ── AGGIUNGI ──
function apriAdd() {
  const filtrati = [...(state.filters?.values("course") || [])];
  const corsoPreselezionato = filtrati.length === 1 ? String(filtrati[0]) : "";
  const sorted = [...state.courses].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  $("add-course-select").innerHTML =
    `<option value="" disabled selected>Seleziona un corso</option>` +
    sorted
      .map(
        (c) =>
          `<option value="${c.id}"${corsoPreselezionato && String(c.id) === corsoPreselezionato ? " selected" : ""}>${c.name}</option>`,
      )
      .join("");
  ["day", "date", "start", "end"].forEach((f) => ($(`add-${f}`).value = ""));
  riempiSelezioni("add", {});
  $("add-schedule-msg").textContent = "";
  $("add-schedule-modal").style.display = "flex";
}

async function submitAdd(e) {
  e.preventDefault();
  const msgEl = $("add-schedule-msg");
  const dati = raccogliDati("add");
  const errore = validaOrario(dati);
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
  const sorted = [...state.courses].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  $("edit-course-select").innerHTML = sorted
    .map(
      (c) =>
        `<option value="${c.id}"${c.id == s.course_id ? " selected" : ""}>${c.name}</option>`,
    )
    .join("");
  riempiSelezioni("edit", {
    subjectId: s.subject_id,
    teacherId: s.teacher_id,
    roomId: s.room_id,
  });
  $("edit-day").textContent = s.day || "";
  $("edit-date").value = s.date;
  $("edit-start").value = s.start_time;
  $("edit-end").value = s.end_time;
  $("edit-schedule-msg").textContent = "";
  $("edit-schedule-modal").style.display = "flex";
}

async function submitEdit(e) {
  e.preventDefault();
  const msgEl = $("edit-schedule-msg");
  const dati = raccogliDati("edit");
  const errore = validaOrario(dati);
  if (errore) return mostraMsg(msgEl, errore, false);

  msgEl.textContent = "";
  const msg = await schedulesApi.modifica(state.editingScheduleId, dati);
  if (msg === "OK") {
    await fetchCoursesAndSchedules();
    mostraMsg(msgEl, "Orario aggiornato!", true);
    renderSchedules();
    setTimeout(() => ($("edit-schedule-modal").style.display = "none"), 1000);
  } else {
    mostraMsg(msgEl, msg, false);
  }
}

function raccogliDati(prefix) {
  return {
    course_id: $(`${prefix}-course-select`).value,
    teacher_id: Number($(`${prefix}-teacher`).value) || null,
    room_id: Number($(`${prefix}-room`).value) || null,
    subject_id: Number($(`${prefix}-subject`).value) || null,
    day: prefix === "add" ? $("add-day").value : $("edit-day").textContent,
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

// ── Setup listener ──
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
