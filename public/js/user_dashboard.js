// ------------------------------
// Funzione di formattazione data
// ------------------------------
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ------------------------------
// Variabili globali e riferimenti DOM
// ------------------------------
const modal = document.getElementById("edit-profile-modal");
const usernameDisplay = document.getElementById("new_username");
const usernameHidden = document.createElement("input");
usernameHidden.type = "hidden";
usernameHidden.id = "new_username_hidden";
usernameHidden.name = "new_username";
document.getElementById("edit-profile-form").appendChild(usernameHidden);
const newPassword = document.getElementById("new_password");
const editHint = document.getElementById("edit-password-hint");
const editMsg = document.getElementById("edit-profile-msg");

let allCourses = [];
let allSchedules = [];
let teacherChoices, roomChoices, subjectChoices, dayChoices;

// ------------------------------
// Funzione per normalizzare stringhe (rimuove accenti e minuscola)
// ------------------------------
function normalize(str) {
  return str
    ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";
}

// ------------------------------
// Caricamento dati e inizializzazione Choices.js
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  teacherChoices = new Choices("#filter-teacher-u", { removeItemButton: true });
  roomChoices = new Choices("#filter-room-u", { removeItemButton: true });
  subjectChoices = new Choices("#filter-subject-u", { removeItemButton: true });
  dayChoices = new Choices("#filter-date-u", {
    removeItemButton: true,
    searchEnabled: false,
    shouldSort: false,
    placeholder: true,
  });

  fetch("/user/courses")
    .then((r) => r.json())
    .then((courses) => {
      allCourses = courses;
      return fetch("/user/schedules");
    })
    .then((r) => r.json())
    .then((schedules) => {
      allSchedules = schedules;
      populateFilterOptions();
      renderCoursesBadges(allCourses);
      renderSchedulesTable(allCourses, allSchedules);

      // Aggiorna tabella quando i filtri cambiano
      [
        "filter-teacher-u",
        "filter-room-u",
        "filter-subject-u",
        "filter-date-u",
        "filter-date-exact-u",
      ].forEach((id) => {
        document.getElementById(id).onchange = () => {
          renderCoursesBadges(allCourses);
          renderSchedulesTable(allCourses, allSchedules);
        };
      });
    })
    .catch((e) => {
      console.error("Errore nel caricamento dati:", e);
    });
});

// ------------------------------
// Popola i filtri con dati univoci
// ------------------------------
function populateFilterOptions() {
  const settimana = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
    "Domenica",
  ];

  const unique = (arr, key) => [...new Set(arr.map((i) => i[key]).filter(Boolean))];

  // Filtri insegnanti, aula, materia
  teacherChoices.clearChoices();
  teacherChoices.setChoices(
    unique(allSchedules, "teacher").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false
  );

  roomChoices.clearChoices();
  roomChoices.setChoices(
    unique(allSchedules, "room").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false
  );

  subjectChoices.clearChoices();
  subjectChoices.setChoices(
    unique(allSchedules, "subject").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false
  );

  // Giorni presenti nei dati (normalize per uniformità)
  const giorniPresentiSet = new Set(
    allSchedules.map((s) => normalize(s.day)).filter(Boolean)
  );

  // Ordina i giorni presenti secondo la settimana, ma mantenendo solo quelli effettivamente presenti
  const giorniOrdinati = settimana.filter(
    (g) => giorniPresentiSet.has(normalize(g))
  );

  dayChoices.clearChoices();
  dayChoices.setChoices(
    giorniOrdinati.map((d) => ({ value: d, label: d })),
    "value",
    "label",
    false
  );
}

// ------------------------------
// Render badge corsi
// ------------------------------
function renderCoursesBadges(courses) {
  const container = document.getElementById("user-courses");
  if (!courses.length) {
    container.innerHTML = '<div class="hint">Nessun corso assegnato.</div>';
    return;
  }
  container.innerHTML =
    '<div class="user-courses-badges-wrap">' +
    courses.map((c) => `<span class="user-courses-badge">corso: ${c.name}</span>`).join("") +
    "</div>";
}

// ------------------------------
// Render tabella orari con filtri applicati
// ------------------------------
function renderSchedulesTable(courses, schedules) {
  let filtered = schedules.filter((s) =>
    courses.some((c) => c.id == s.course_id)
  );

  // Ottieni valori selezionati nei filtri
  const getVals = (id) => new Choices(`#${id}`).getValue(true);
  const teacherFilter = getVals("filter-teacher-u");
  const roomFilter = getVals("filter-room-u");
  const subjectFilter = getVals("filter-subject-u");
  const dayFilter = getVals("filter-date-u");
  const dateExact = document.getElementById("filter-date-exact-u").value;

  // Applica filtri
  if (teacherFilter.length)
    filtered = filtered.filter((s) => teacherFilter.includes(s.teacher));
  if (roomFilter.length)
    filtered = filtered.filter((s) => roomFilter.includes(s.room));
  if (subjectFilter.length)
    filtered = filtered.filter((s) => subjectFilter.includes(s.subject));
  if (dayFilter.length) {
    filtered = filtered.filter((s) =>
      dayFilter.map(normalize).includes(normalize(s.day))
    );
  }
  if (dateExact) filtered = filtered.filter((s) => s.date === dateExact);

  filtered = filtered.sort(
    (a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time)
  );

  let html = "";
  if (!filtered.length) {
    html = '<div class="hint">Nessun orario trovato per questi filtri.</div>';
  } else {
    html = `<table class="modern-table"><thead><tr>
      <th>Docente</th><th>Aula</th><th>Materia</th><th>Giorno</th><th>Data</th><th>Inizio</th><th>Fine</th>
    </tr></thead><tbody>`;
    for (const s of filtered) {
      html += `<tr><td>${s.teacher}</td><td>${s.room}</td><td>${s.subject}</td>
        <td>${s.day}</td><td>${formatDate(s.date)}</td><td>${s.start_time}</td><td>${s.end_time}</td></tr>`;
    }
    html += "</tbody></table>";
  }
  document.getElementById("user-schedules-table").innerHTML = html;
}

// ------------------------------
// Apertura e chiusura modale modifica profilo
// ------------------------------
document.getElementById("edit-profile-btn").onclick = () => {
  modal.style.display = "flex";
  fetch("/user/current")
    .then((r) => r.json())
    .then((data) => {
      usernameDisplay.value = data.username;
      usernameHidden.value = data.username;
    })
    .catch(() => {
      editMsg.textContent = "Errore nel recupero username";
    });
};

document.getElementById("close-modal").onclick = () => {
  modal.style.display = "none";
};

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

// ------------------------------
// Validazione password live
// ------------------------------
newPassword.addEventListener("input", () => {
  const val = newPassword.value;
  let msg = "";
  if (val.length < 8) msg += "Min 8 caratteri. ";
  if (!/[A-Z]/.test(val)) msg += "Almeno una maiuscola. ";
  if (!/[a-z]/.test(val)) msg += "Almeno una minuscola. ";
  if (!/[0-9]/.test(val)) msg += "Almeno un numero. ";
  editHint.textContent = msg;
  editHint.style.color = msg ? "var(--accent)" : "green";
});

// ------------------------------
// Submit modifica profilo
// ------------------------------
document.getElementById("edit-profile-form").onsubmit = function (e) {
  e.preventDefault();
  if (editHint.textContent) {
    editHint.style.color = "red";
    return;
  }

  fetch("/user/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: usernameHidden.value,
      password: newPassword.value,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      editMsg.textContent = msg;
      editMsg.style.color = msg === "OK" ? "green" : "red";
      if (msg === "OK") setTimeout(() => location.reload(), 1000);
    })
    .catch((err) => {
      console.error("Errore modifica profilo", err);
      editMsg.textContent = "Errore durante il salvataggio.";
      editMsg.style.color = "red";
    });
};
