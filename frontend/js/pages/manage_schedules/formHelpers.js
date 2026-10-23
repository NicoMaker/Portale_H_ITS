// Comportamenti dei form: ora di fine automatica, giorno automatico e
// selettori collegati materia ↔ docente (si compilano e si filtrano a vicenda).
import { state, addOneHourToTime, getDayOfWeek } from "./state.js";

const $ = (id) => document.getElementById(id);

// Imposta l'ora di fine a +1h quando cambia l'inizio (se non modificata a mano)
export function setupAutoEndTime() {
  const collega = (startId, endId) => {
    const start = $(startId);
    const end = $(endId);
    let endModified = false;
    start.addEventListener("change", () => {
      if (!endModified && start.value)
        end.value = addOneHourToTime(start.value);
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

// ── Selettori collegati materia ↔ docente ──
// state.subjects[i].teacher_ids e state.teachers[i].subject_ids arrivano dalla
// relazione "chi insegna cosa" (Gestione Materie / Gestione Docenti).
const esc = (t) =>
  String(t).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const perNome = (a, b) => a.name.localeCompare(b.name, "it");

function opzioni(voci, selezionato, segnaposto) {
  const righe = voci
    .map(
      (v) =>
        `<option value="${v.id}"${v.id === selezionato ? " selected" : ""}>${esc(v.name)}</option>`,
    )
    .join("");
  return `<option value="" disabled${selezionato ? "" : " selected"}>${esc(segnaposto)}</option>${righe}`;
}

// Ridisegna i tre selettori in base a materia/docente scelti
function disegna(prefix, sid, tid) {
  const materia = state.subjects.find((s) => s.id === sid) || null;
  const docente = state.teachers.find((t) => t.id === tid) || null;

  // Se c'è un docente, solo le sue materie; se c'è una materia, solo i suoi docenti
  const materie = (docente
    ? state.subjects.filter((s) => docente.subject_ids.includes(s.id))
    : state.subjects
  )
    .slice()
    .sort(perNome);
  const docenti = (materia
    ? state.teachers.filter((t) => materia.teacher_ids.includes(t.id))
    : state.teachers
  )
    .slice()
    .sort(perNome);

  $(`${prefix}-subject`).innerHTML = opzioni(
    materie,
    sid,
    materie.length ? "Seleziona una materia" : "Nessuna materia per questo docente",
  );
  $(`${prefix}-teacher`).innerHTML = opzioni(
    docenti,
    tid,
    docenti.length ? "Seleziona un docente" : "Nessun docente per questa materia",
  );

  // Suggerimenti sotto i campi
  const hintMateria = $(`${prefix}-subject-hint`);
  const hintDocente = $(`${prefix}-teacher-hint`);
  if (docente) {
    hintMateria.textContent = `Materie insegnate da ${docente.name}: ${materie.length}`;
  } else {
    hintMateria.textContent = "Scegli la materia: il docente si propone da solo.";
  }
  if (materia && !materia.teacher_ids.length) {
    hintDocente.innerHTML = `⚠️ Nessun docente insegna questa materia: assegnalo in <a href="/manage_subjects.html" target="_blank" class="text-blue-600 underline">Gestione Materie</a>.`;
  } else if (materia) {
    hintDocente.textContent = `${docenti.length} ${docenti.length === 1 ? "docente insegna" : "docenti insegnano"} ${materia.name}.`;
  } else {
    hintDocente.textContent = "Mostra tutti i docenti finché non scegli la materia.";
  }
}

// Dopo un cambio: azzera ciò che non è più coerente e compila l'unica scelta possibile
function ricalcola(prefix, origine) {
  let sid = Number($(`${prefix}-subject`).value) || null;
  let tid = Number($(`${prefix}-teacher`).value) || null;
  const materia = state.subjects.find((s) => s.id === sid);
  const docente = state.teachers.find((t) => t.id === tid);

  if (origine === "subject" && materia) {
    if (tid && !materia.teacher_ids.includes(tid)) tid = null;
    if (!tid && materia.teacher_ids.length === 1) tid = materia.teacher_ids[0];
  }
  if (origine === "teacher" && docente) {
    if (sid && !docente.subject_ids.includes(sid)) sid = null;
    if (!sid && docente.subject_ids.length === 1) sid = docente.subject_ids[0];
  }
  disegna(prefix, sid, tid);
}

// Riempie i selettori del form (add/edit) con i valori indicati
export function riempiSelezioni(prefix, { subjectId, teacherId, roomId } = {}) {
  disegna(prefix, subjectId || null, teacherId || null);
  const aule = state.rooms.slice().sort(perNome);
  $(`${prefix}-room`).innerHTML = opzioni(aule, roomId || null, "Seleziona un'aula");
}

export function setupLinkedSelects() {
  ["add", "edit"].forEach((prefix) => {
    $(`${prefix}-subject`).addEventListener("change", () =>
      ricalcola(prefix, "subject"),
    );
    $(`${prefix}-teacher`).addEventListener("change", () =>
      ricalcola(prefix, "teacher"),
    );
  });
}
