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
// Mobile menu toggle
// ------------------------------
document.getElementById("mobile-menu-btn").addEventListener("click", () => {
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenu.classList.toggle("hidden");
});

// ------------------------------
// Funzione per normalizzare stringhe (rimuove accenti e minuscola)
// ------------------------------
function normalize(str) {
  return str
    ? str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    : "";
}

// ------------------------------
// Caricamento dati e inizializzazione Choices.js
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Inizializza Choices una sola volta per ciascun filtro
  teacherChoices = new Choices("#filter-teacher-u", { removeItemButton: true });
  roomChoices = new Choices("#filter-room-u", { removeItemButton: true });
  subjectChoices = new Choices("#filter-subject-u", { removeItemButton: true });
  dayChoices = new Choices("#filter-date-u", {
    removeItemButton: true,
    searchEnabled: false,
    shouldSort: false,
    placeholder: true,
    position: "top", // *** Qui facciamo aprire il filtro Giorno verso l’alto ***
  });

  // Carica dati dalle API
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

      // Aggiungi event listener per i filtri (usa istanze Choices già create)
      [teacherChoices, roomChoices, subjectChoices, dayChoices].forEach(
        (choiceInstance) => {
          choiceInstance.passedElement.element.addEventListener(
            "change",
            () => {
              renderSchedulesTable(allCourses, allSchedules);
            },
          );
        },
      );

      // Listener per input data esatta
      document
        .getElementById("filter-date-exact-u")
        .addEventListener("change", () => {
          renderSchedulesTable(allCourses, allSchedules);
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

  const unique = (arr, key) => [
    ...new Set(arr.map((i) => i[key]).filter(Boolean)),
  ];

  // Insegnanti
  teacherChoices.clearChoices();
  teacherChoices.setChoices(
    unique(allSchedules, "teacher").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false,
  );

  // Aule
  roomChoices.clearChoices();
  roomChoices.setChoices(
    unique(allSchedules, "room").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false,
  );

  // Materie
  subjectChoices.clearChoices();
  subjectChoices.setChoices(
    unique(allSchedules, "subject").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false,
  );

  // Giorni
  const giorniPresentiSet = new Set(
    allSchedules.map((s) => normalize(s.day)).filter(Boolean),
  );
  const giorniOrdinati = settimana.filter((g) =>
    giorniPresentiSet.has(normalize(g)),
  );

  dayChoices.clearChoices();
  dayChoices.setChoices(
    giorniOrdinati.map((d) => ({ value: d, label: d })),
    "value",
    "label",
    false,
  );
}

// ------------------------------
// Render badge corsi
// ------------------------------
function renderCoursesBadges(courses) {
  const container = document.getElementById("user-courses");
  if (!courses.length) {
    container.innerHTML =
      '<div class="text-gray-500 text-center py-8 text-sm md:text-base">Nessun corso assegnato.</div>';
    return;
  }
  container.innerHTML = courses
    .map(
      (c) => `
                        <span class="inline-flex items-center px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-blue-200 hover:to-purple-200 transition-all duration-200 transform hover:scale-105">
                            📚 corso: ${c.name}
                        </span>
                    `,
    )
    .join("");
}

// ------------------------------
// Render tabella orari con filtri applicati
// ------------------------------
function renderSchedulesTable(courses, schedules) {
  let filtered = schedules.filter((s) =>
    courses.some((c) => c.id == s.course_id),
  );

  // Prendi valori selezionati dai filtri
  const teacherFilter = teacherChoices.getValue(true);
  const roomFilter = roomChoices.getValue(true);
  const subjectFilter = subjectChoices.getValue(true);
  const dayFilter = dayChoices.getValue(true);
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
      dayFilter.map(normalize).includes(normalize(s.day)),
    );
  }
  if (dateExact) {
    filtered = filtered.filter((s) => s.date === dateExact);
  }

  filtered = filtered.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time),
  );

  let html = "";
  if (!filtered.length) {
    html =
      '<div class="text-center py-12 text-gray-500"><div class="text-4xl md:text-6xl mb-4">📅</div><p class="text-lg md:text-xl">Nessun orario trovato per questi filtri.</p></div>';
  } else {
    html = `
                        <div class="modern-table mobile-table">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="gradient-bg">
                                    <tr class="text-white">
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">👨‍🏫 Docente</th>
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">🏫 Aula</th>
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">📖 Materia</th>
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">📅 Giorno</th>
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">📆 Data</th>
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">🕘 Inizio</th>
                                        <th class="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold">🕘 Fine</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                    `;
    for (const s of filtered) {
      html += `
                            <tr class="hover:bg-blue-50 transition-all duration-200">
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 font-medium">${s.teacher}</td>
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">${s.room}</td>
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">${s.subject}</td>
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">${s.day}</td>
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">${formatDate(s.date)}</td>
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700 font-mono">${s.start_time}</td>
                                <td class="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700 font-mono">${s.end_time}</td>
                            </tr>
                        `;
    }
    html += "</tbody></table></div>";
  }
  document.getElementById("user-schedules-table").innerHTML = html;
}

// ------------------------------
// Modal functionality
// ------------------------------
function openModal() {
  modal.classList.remove("hidden");
  fetch("/user/current")
    .then((r) => r.json())
    .then((data) => {
      usernameDisplay.value = data.username;
      usernameHidden.value = data.username;
    })
    .catch(() => {
      editMsg.textContent = "Errore nel recupero username";
      editMsg.className =
        "text-center text-xs md:text-sm font-medium text-red-500";
    });
}

function closeModal() {
  modal.classList.add("hidden");
  newPassword.value = "";
  editHint.textContent = "";
  editMsg.textContent = "";
}

// Event listeners for modal
document
  .getElementById("edit-profile-btn")
  .addEventListener("click", openModal);
document
  .getElementById("edit-profile-btn-mobile")
  .addEventListener("click", openModal);
document
  .getElementById("edit-profile-btn-header")
  .addEventListener("click", openModal);
document.getElementById("close-modal").addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// ------------------------------
// Password validation
// ------------------------------
newPassword.addEventListener("input", () => {
  const val = newPassword.value;
  let msg = "";
  if (val.length < 8) msg += "Min 8 caratteri. ";
  if (!/[A-Z]/.test(val)) msg += "Almeno una maiuscola. ";
  if (!/[a-z]/.test(val)) msg += "Almeno una minuscola. ";
  if (!/[0-9]/.test(val)) msg += "Almeno un numero. ";
  editHint.textContent = msg;
  editHint.className = msg
    ? "text-xs md:text-sm mt-2 text-red-500"
    : "text-xs md:text-sm mt-2 text-green-500";
});

// ------------------------------
// Form submission
// ------------------------------
document
  .getElementById("edit-profile-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    if (editHint.textContent !== "" && !editHint.className.includes("green")) {
      editMsg.textContent = "Correggi la password prima di salvare.";
      editMsg.className =
        "text-center text-xs md:text-sm font-medium text-red-500";
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
      .then((r) => r.json())
      .then((resp) => {
        if (resp.success) {
          editMsg.textContent = "Profilo aggiornato con successo!";
          editMsg.className =
            "text-center text-xs md:text-sm font-medium text-green-500";
          newPassword.value = "";
          editHint.textContent = "";
        } else {
          editMsg.textContent = resp.message || "Errore sconosciuto";
          editMsg.className =
            "text-center text-xs md:text-sm font-medium text-red-500";
        }
      })
      .catch(() => {
        editMsg.textContent = "Errore di rete.";
        editMsg.className =
          "text-center text-xs md:text-sm font-medium text-red-500";
      });
  });
