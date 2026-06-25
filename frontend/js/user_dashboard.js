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
const filterDateExactU = document.getElementById("filter-date-exact-u");

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
    position: "top",
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

      updateUserStats();

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

      filterDateExactU.addEventListener("change", () => {
        renderSchedulesTable(allCourses, allSchedules);
      });

      document
        .getElementById("reset-filters-btn-u")
        .addEventListener("click", resetFilters);

      const refreshBtn = document.getElementById("refresh-data");
      if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
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
              updateUserStats();
            })
            .catch((e) => {
              console.error("Errore nel caricamento dati:", e);
            });
        });
      }
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

  teacherChoices.clearChoices();
  teacherChoices.setChoices(
    unique(allSchedules, "teacher").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false,
  );

  roomChoices.clearChoices();
  roomChoices.setChoices(
    unique(allSchedules, "room").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false,
  );

  subjectChoices.clearChoices();
  subjectChoices.setChoices(
    unique(allSchedules, "subject").map((v) => ({ value: v, label: v })),
    "value",
    "label",
    false,
  );

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
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:.875rem;">Nessun corso assegnato.</div>';
    return;
  }
  container.innerHTML = courses.map(c => `
    <span style="display:inline-flex;align-items:center;gap:.4rem;padding:.4rem 1rem;border-radius:9999px;font-size:.8rem;font-weight:600;background:linear-gradient(135deg,#eef2ff,#f0f9ff);color:#4f46e5;border:1.5px solid #c7d2fe;transition:all .15s;cursor:default;"
      onmouseover="this.style.background='linear-gradient(135deg,#e0e7ff,#dbeafe)';this.style.transform='scale(1.04)'"
      onmouseout="this.style.background='linear-gradient(135deg,#eef2ff,#f0f9ff)';this.style.transform='scale(1)'">
      📚 ${c.name}
    </span>`).join('');
}

// ------------------------------
// Render tabella orari con filtri applicati
// ------------------------------
function renderSchedulesTable(courses, schedules) {
  let filtered = schedules.filter((s) =>
    courses.some((c) => c.id == s.course_id),
  );

  const teacherFilter = teacherChoices.getValue(true);
  const roomFilter = roomChoices.getValue(true);
  const subjectFilter = subjectChoices.getValue(true);
  const dayFilter = dayChoices.getValue(true);
  const dateExact = filterDateExactU.value;

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
    html = '<div style="padding:3rem;text-align:center;"><div style="font-size:3rem;margin-bottom:.75rem;">📅</div><p style="font-weight:700;color:#374151;margin:0 0 .25rem;">Nessun orario trovato</p><p style="font-size:.875rem;color:#9ca3af;margin:0;">Modifica i filtri per vedere altri risultati.</p></div>';
  } else {
    html = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:linear-gradient(135deg,#4f46e5,#7c3aed);">
              <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">🕐 Orario</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">📅 Giorno</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">📆 Data</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">👨‍🏫 Docente</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">🏫 Aula</th>
              <th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">📖 Materia</th>
            </tr>
          </thead>
          <tbody>
    `;
    for (const s of filtered) {
      html += `
        <tr style="border-bottom:1px solid #f3f4f6;transition:background .15s;" onmouseover="this.style.background='#f9f8ff'" onmouseout="this.style.background=''">
          <td style="padding:.75rem 1rem;">
            <div style="display:flex;align-items:center;gap:.4rem;">
              <span style="background:#f0fdf4;color:#15803d;padding:3px 8px;border-radius:9999px;font-size:.75rem;font-weight:700;font-family:monospace;">${s.start_time}</span>
              <span style="color:#9ca3af;font-size:.7rem;">→</span>
              <span style="background:#fff5f5;color:#dc2626;padding:3px 8px;border-radius:9999px;font-size:.75rem;font-weight:700;font-family:monospace;">${s.end_time}</span>
            </div>
          </td>
          <td style="padding:.75rem 1rem;font-size:.875rem;color:#374151;">${s.day}</td>
          <td style="padding:.75rem 1rem;font-size:.875rem;color:#374151;">${formatDate(s.date)}</td>
          <td style="padding:.75rem 1rem;font-size:.875rem;font-weight:600;color:#111827;">${s.teacher}</td>
          <td style="padding:.75rem 1rem;font-size:.875rem;color:#374151;">${s.room}</td>
          <td style="padding:.75rem 1rem;font-size:.875rem;color:#6b7280;font-style:italic;">${s.subject}</td>
        </tr>
      `;
    }
    html += "</tbody></table></div>";
  }
  document.getElementById("user-schedules-table").innerHTML = html;
  updateUserStats();
}

// ------------------------------
// Funzione per resettare i filtri
// ------------------------------
function resetFilters() {
  teacherChoices.clearStore();
  roomChoices.clearStore();
  subjectChoices.clearStore();
  dayChoices.clearStore();
  filterDateExactU.value = "";

  populateFilterOptions();
  renderSchedulesTable(allCourses, allSchedules);
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

// ------------------------------
// Funzioni per statistiche
// ------------------------------
function updateUserStats() {
  const totalLessonsEl = document.getElementById("total-lessons");
  if (totalLessonsEl) {
    totalLessonsEl.textContent = allSchedules.length;
  }

  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));

  const weekLessons = allSchedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate >= weekStart && scheduleDate <= weekEnd;
  }).length;

  const weekLessonsEl = document.getElementById("week-lessons");
  if (weekLessonsEl) {
    weekLessonsEl.textContent = weekLessons;
  }

  const now = new Date();
  const upcomingLessons = allSchedules
    .filter((schedule) => new Date(schedule.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextLessonEl = document.getElementById("next-lesson");
  if (nextLessonEl) {
    if (upcomingLessons.length > 0) {
      const nextLesson = upcomingLessons[0];
      const nextDate = new Date(nextLesson.date);
      const timeStr = nextLesson.start_time;
      nextLessonEl.textContent = `${nextDate.toLocaleDateString("it-IT")} alle ${timeStr}`;
    } else {
      nextLessonEl.textContent = "Nessuna lezione programmata";
    }
  }

  const filteredLessons = getFilteredUserSchedules();
  const filteredLessonsEl = document.getElementById("filtered-lessons");
  if (filteredLessonsEl) {
    filteredLessonsEl.textContent = filteredLessons.length;
  }
}

function getFilteredUserSchedules() {
  let filtered = [...allSchedules];

  const teacherFilter = teacherChoices ? teacherChoices.getValue(true) : [];
  if (teacherFilter.length > 0) {
    filtered = filtered.filter((schedule) =>
      teacherFilter.includes(schedule.teacher),
    );
  }

  const roomFilter = roomChoices ? roomChoices.getValue(true) : [];
  if (roomFilter.length > 0) {
    filtered = filtered.filter((schedule) =>
      roomFilter.includes(schedule.room),
    );
  }

  const subjectFilter = subjectChoices ? subjectChoices.getValue(true) : [];
  if (subjectFilter.length > 0) {
    filtered = filtered.filter((schedule) =>
      subjectFilter.includes(schedule.subject),
    );
  }

  const dayFilter = dayChoices ? dayChoices.getValue(true) : [];
  if (dayFilter.length > 0) {
    filtered = filtered.filter((schedule) => dayFilter.includes(schedule.day));
  }

  const dateFilter = document.getElementById("filter-date-exact-u")?.value;
  if (dateFilter) {
    filtered = filtered.filter((schedule) => schedule.date === dateFilter);
  }

  return filtered;
}

// ============================================================
// REAL-TIME — Socket.IO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  if (!window.AppSocket) return;

  // Quando l'admin aggiorna gli orari o cambia il corso dell'utente
  AppSocket.on("schedule_updated", () => {
    // Ricarica silenziosa dei dati
    Promise.all([
      fetch("/user/courses").then((r) => r.json()),
      fetch("/user/schedules").then((r) => r.json()),
    ])
      .then(([courses, schedules]) => {
        allCourses = courses;
        allSchedules = schedules;
        if (typeof renderSchedulesTable === "function") renderSchedulesTable();
        if (typeof renderCoursesCards === "function") renderCoursesCards();
        showRealtimeToastUser("🔄 Orari aggiornati in tempo reale");
      })
      .catch(() => {});
  });

  AppSocket.on("courses_updated", () => {
    fetch("/user/courses")
      .then((r) => r.json())
      .then((courses) => {
        allCourses = courses;
        if (typeof renderCoursesCards === "function") renderCoursesCards();
      })
      .catch(() => {});
  });
});

function showRealtimeToastUser(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:#1e1b4b;color:#e0e7ff;padding:.7rem 1.1rem;border-radius:12px;font-size:.8rem;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:none;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .35s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 350); }, 2800);
}
