let courses = [];
let schedules = [];
let editingScheduleId = null;
let deletingScheduleId = null; // New variable to store the ID of the schedule to be deleted
let searchScheduleCourseInput,
  filterScheduleCourseSelect,
  allSchedules = [],
  allCourses = [];
// Inizializza Choices.js per i filtri multipli
let teacherChoices, roomChoices, subjectChoices, dayChoices;

function addOneHourToTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0);
  date.setHours(date.getHours() + 1);
  return date.toTimeString().slice(0, 5);
}

function setupAutoEndTime() {
  const addStart = document.getElementById("add-start");
  const addEnd = document.getElementById("add-end");
  let addEndModified = false;

  addStart.addEventListener("change", () => {
    if (!addEndModified && addStart.value) {
      addEnd.value = addOneHourToTime(addStart.value);
    }
  });
  addEnd.addEventListener("input", () => {
    addEndModified = true;
  });

  const editStart = document.getElementById("edit-start");
  const editEnd = document.getElementById("edit-end");
  let editEndModified = false;

  editStart.addEventListener("change", () => {
    if (!editEndModified && editStart.value) {
      editEnd.value = addOneHourToTime(editStart.value);
    }
  });
  editEnd.addEventListener("input", () => {
    editEndModified = true;
  });
}

function fetchCoursesAndSchedules() {
  Promise.all([
    fetch("/api/courses").then((r) => r.json()),
    fetch("/api/schedules").then((r) => r.json()),
  ]).then(([allCourses, allSchedules]) => {
    courses = allCourses;
    schedules = allSchedules;
    const select = document.getElementById("filter-course");
    select.innerHTML =
      '<option value="">Tutti i corsi</option>' +
      courses.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    populateFilterOptions();
    renderSchedules();
    updateDatalists();
  });
}
document.getElementById("filter-course").onchange = renderSchedules;
// Importa la funzione formatDate
// Se il browser non supporta import/export, assicuriamoci che formatDate sia globale
if (typeof window.formatDate !== "function") {
  const script = document.createElement("script");
  script.src = "js/utils.js";
  document.head.appendChild(script);
}

function renderSchedules() {
  const courseId = document.getElementById("filter-course").value;
  // Ottieni i valori selezionati (array)
  const teacherFilter = teacherChoices ? teacherChoices.getValue(true) : [];
  const roomFilter = roomChoices ? roomChoices.getValue(true) : [];
  const subjectFilter = subjectChoices ? subjectChoices.getValue(true) : [];
  const dayFilter = dayChoices ? dayChoices.getValue(true) : [];
  const dateFilter = document.getElementById("filter-date").value;
  let filtered = schedules;
  if (courseId)
    filtered = filtered.filter((s) => String(s.course_id) === String(courseId));
  if (teacherFilter.length)
    filtered = filtered.filter((s) => teacherFilter.includes(s.teacher));
  if (roomFilter.length)
    filtered = filtered.filter((s) => roomFilter.includes(s.room));
  if (subjectFilter.length)
    filtered = filtered.filter((s) => subjectFilter.includes(s.subject));
  if (dayFilter.length)
    filtered = filtered.filter((s) => dayFilter.includes(s.day));
  if (dateFilter) filtered = filtered.filter((s) => s.date === dateFilter);
  // Ordina per data e ora
  filtered = filtered.slice().sort((a, b) => {
    if (a.date === b.date) return a.start_time.localeCompare(b.start_time);
    return a.date.localeCompare(b.date);
  });

  let html = "";
  if (!filtered.length) {
    html = `
      <div class="flex flex-col items-center justify-center py-16 text-gray-500">
        <div class="text-6xl mb-4">📅</div>
        <h3 class="text-lg font-medium mb-2">Nessun orario trovato</h3>
        <p class="text-sm">Modifica i filtri per visualizzare altri risultati</p>
      </div>
    `;
  } else {
    html = `
      <div class="overflow-x-auto">
        <table class="w-full table-auto border-collapse">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                📚 Corso
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                👨‍🏫 Docente  
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                🏫 Aula
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                📖 Materia
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                📅 Giorno
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                📆 Data
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                🕐 Inizio
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                🕐 Fine
              </th>
              <th class="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                ⚙️ Azioni
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
    `;
    filtered.forEach((s) => {
      const course = courses.find((c) => c.id == s.course_id);
      html += `
        <tr class="hover:bg-blue-25 transition-all duration-200 border-b border-gray-100">
          <td class="px-4 py-4 border-r border-gray-100">
            <span class="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              ${course ? course.name : "-"}
            </span>
          </td>
          <td class="px-4 py-4 text-sm text-gray-800 font-medium border-r border-gray-100">
            ${s.teacher || "-"}
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">${s.room || "-"}</code>
          </td>
          <td class="px-4 py-4 text-sm text-gray-700 italic border-r border-gray-100">
            ${s.subject || "-"}
          </td>
          <td class="px-4 py-4 text-sm text-gray-800 font-semibold border-r border-gray-100">
            ${s.day || "-"}
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
              ${typeof formatDate === "function" ? formatDate(s.date) : s.date}
            </span>
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
              ${s.start_time}
            </span>
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
              ${s.end_time}
            </span>
          </td>
          <td class="px-4 py-4 text-center">
            <div class="flex justify-center space-x-2">
              <button class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105" 
                      title="Modifica" onclick="openEditSchedule(${s.id})">
                ✏️
              </button>
              <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105" 
                      title="Elimina" onclick="openDeleteScheduleModal(${s.id})">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    html += "</tbody></table></div>";
  }
  document.getElementById("schedules-list").innerHTML = html;
}

// Aggiorna i filtri per ricerca live
[
  "filter-teacher",
  "filter-room",
  "filter-subject",
  "filter-day",
  "filter-date",
].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    if (el.tagName === "SELECT") {
      el.onchange = renderSchedules;
    } else {
      el.oninput = renderSchedules;
    }
  }
});
function openEditSchedule(id) {
  editingScheduleId = id;
  const s = schedules.find((x) => x.id == id);
  document.getElementById("edit-course-select").innerHTML = courses
    .map(
      (c) =>
        `<option value="${c.id}"${c.id == s.course_id ? " selected" : ""}>${
          c.name
        }</option>`,
    )
    .join("");
  document.getElementById("edit-teacher").value = s.teacher;
  document.getElementById("edit-room").value = s.room;
  document.getElementById("edit-subject").value = s.subject || "";
  document.getElementById("edit-day").textContent = s.day;
  document.getElementById("edit-date").value = s.date;
  document.getElementById("edit-start").value = s.start_time;
  document.getElementById("edit-end").value = s.end_time;
  document.getElementById("edit-schedule-msg").textContent = "";
  document.getElementById("edit-schedule-modal").style.display = "flex";
}
document.getElementById("close-edit-schedule-modal").onclick = () => {
  document.getElementById("edit-schedule-modal").style.display = "none";
};
document.getElementById("cancel-edit-schedule").onclick = function () {
  document.getElementById("edit-schedule-modal").style.display = "none";
};
window.onclick = (e) => {
  if (e.target === document.getElementById("edit-schedule-modal"))
    document.getElementById("edit-schedule-modal").style.display = "none";
};
document.getElementById("edit-schedule-form").onsubmit = async function (e) {
  e.preventDefault();
  await fetch("/api/schedules")
    .then((r) => r.json())
    .then((data) => {
      schedules = data;
    });
  const course_id = document.getElementById("edit-course-select").value;
  const teacher = document.getElementById("edit-teacher").value;
  const room = document.getElementById("edit-room").value;
  const subject = document.getElementById("edit-subject").value;
  const day = document.getElementById("edit-day").textContent;
  const date = document.getElementById("edit-date").value;
  const start_time = document.getElementById("edit-start").value;
  const end_time = document.getElementById("edit-end").value;

  if (start_time >= end_time) {
    const el = document.getElementById("edit-schedule-msg"); // Define el here
    el.textContent = "L'ora di inizio deve essere precedente a quella di fine.";
    el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return;
  }
  const overlap = schedules.some(
    (s) =>
      String(s.course_id) === String(course_id) &&
      s.date === date &&
      s.start_time === start_time &&
      s.id != editingScheduleId,
  );
  const el = document.getElementById("edit-schedule-msg");
  if (overlap) {
    el.textContent =
      "Esiste già un orario per questo corso, data e ora di inizio.";
    el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return;
  }
  fetch(`/api/schedules/${editingScheduleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course_id,
      teacher,
      room,
      subject,
      day,
      date,
      start_time,
      end_time,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      fetchCoursesAndSchedules();
      if (msg === "OK") {
        el.textContent = "Orario aggiornato!";
        el.className =
          "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800";
        document.getElementById("filter-course").value = course_id;
        renderSchedules();
        setTimeout(() => {
          document.getElementById("edit-schedule-modal").style.display = "none";
        }, 1000);
      } else {
        el.textContent = msg;
        el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
    });
};

// Function to open the delete confirmation modal
function openDeleteScheduleModal(id) {
  deletingScheduleId = id;
  document.getElementById("delete-schedule-modal").style.display = "flex";
}

// Function to actually delete the schedule
function deleteSchedule() {
  if (deletingScheduleId) {
    fetch(`/api/schedules/${deletingScheduleId}`, { method: "DELETE" }).then(
      () => {
        fetchCoursesAndSchedules();
        document.getElementById("delete-schedule-modal").style.display = "none";
        deletingScheduleId = null; // Reset the ID
      },
    );
  }
}

// Event listeners for the delete confirmation modal
document.getElementById("close-delete-schedule-modal").onclick = () => {
  document.getElementById("delete-schedule-modal").style.display = "none";
  deletingScheduleId = null; // Clear the ID on close
};

document.getElementById("cancel-delete-schedule").onclick = () => {
  document.getElementById("delete-schedule-modal").style.display = "none";
  deletingScheduleId = null; // Clear the ID on cancel
};

document.getElementById("confirm-delete-schedule").onclick = () => {
  deleteSchedule(); // Call the actual delete function when confirmed
};

window.addEventListener("click", (e) => {
  if (e.target === document.getElementById("delete-schedule-modal")) {
    document.getElementById("delete-schedule-modal").style.display = "none";
    deletingScheduleId = null; // Clear the ID if clicking outside
  }
});

document.getElementById("add-schedule-btn").onclick = () => {
  const filterVal = document.getElementById("filter-course").value;
  document.getElementById("add-course-select").innerHTML =
    `<option value="" disabled selected>Seleziona un corso</option>` +
    courses.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");

  document.getElementById("add-teacher").value = "";
  document.getElementById("add-room").value = "";
  document.getElementById("add-subject").value = "";
  document.getElementById("add-day").textContent = "";
  document.getElementById("add-date").value = "";
  document.getElementById("add-start").value = "";
  document.getElementById("add-end").value = "";
  document.getElementById("add-schedule-msg").textContent = "";
  document.getElementById("add-schedule-modal").style.display = "flex";
};
document.getElementById("close-add-schedule-modal").onclick = () => {
  document.getElementById("add-schedule-modal").style.display = "none";
};
document.getElementById("cancel-add-schedule").onclick = function () {
  document.getElementById("add-schedule-modal").style.display = "none";
};
window.addEventListener("click", function (e) {
  if (e.target === document.getElementById("add-schedule-modal"))
    document.getElementById("add-schedule-modal").style.display = "none";
});
document.getElementById("add-schedule-form").onsubmit = async function (e) {
  e.preventDefault();
  await fetch("/api/schedules")
    .then((r) => r.json())
    .then((data) => {
      schedules = data;
    });
  const course_id = document.getElementById("add-course-select").value;
  const teacher = document.getElementById("add-teacher").value;
  const room = document.getElementById("add-room").value;
  const subject = document.getElementById("add-subject").value;
  const day = document.getElementById("add-day").textContent;
  const date = document.getElementById("add-date").value;
  const start_time = document.getElementById("add-start").value;
  const end_time = document.getElementById("add-end").value;

  if (start_time >= end_time) {
    const el = document.getElementById("add-schedule-msg"); // Define el here
    el.textContent = "L'ora di inizio deve essere precedente a quella di fine.";
    el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return;
  }
  const overlap = schedules.some(
    (s) =>
      String(s.course_id) === String(course_id) &&
      s.date === date &&
      s.start_time === start_time,
  );
  const el = document.getElementById("add-schedule-msg");
  if (overlap) {
    el.textContent =
      "Esiste già un orario per questo corso, data e ora di inizio.";
    el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return;
  }
  fetch("/api/schedules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course_id,
      teacher,
      room,
      subject,
      day,
      date,
      start_time,
      end_time,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      fetchCoursesAndSchedules();
      if (msg === "OK") {
        el.textContent = "Orario aggiunto!";
        el.className =
          "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800";
        document.getElementById("filter-course").value = course_id;
        renderSchedules();
        setTimeout(() => {
          document.getElementById("add-schedule-modal").style.display = "none";
        }, 1000);
      } else {
        el.textContent = msg;
        el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
    });
};

function renderSchedulesList() {
  const search = searchScheduleCourseInput.value.toLowerCase();
  const courseId = filterScheduleCourseSelect.value;
  let html = "";
  const filtered = allSchedules.filter((s) => {
    const course = allCourses.find((c) => c.id == s.course_id) || {};
    const matchName = (course.name || "").toLowerCase().includes(search);
    const matchId = !courseId || s.course_id == courseId;
    return matchName && matchId;
  });
  if (!filtered.length) {
    html = `
      <div class="flex flex-col items-center justify-center py-16 text-gray-500">
        <div class="text-6xl mb-4">📅</div>
        <h3 class="text-lg font-medium mb-2">Nessun orario trovato</h3>
        <p class="text-sm">Modifica i filtri per visualizzare altri risultati</p>
      </div>
    `;
  } else {
    html = `
      <div class="overflow-x-auto">
        <table class="w-full table-auto border-collapse">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <tr>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">📚 Corso</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">👨‍🏫 Docente</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">🏫 Aula</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">📖 Materia</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">📅 Giorno</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">📆 Data</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">🕐 Inizio</th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">🕐 Fine</th>
              <th class="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">⚙️ Azioni</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
    `;
    filtered.forEach((s) => {
      const course = allCourses.find((c) => c.id == s.course_id) || {};
      html += `
        <tr class="hover:bg-blue-25 transition-all duration-200 border-b border-gray-100">
          <td class="px-4 py-4 border-r border-gray-100">
            <span class="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
              ${course.name || "-"}
            </span>
          </td>
          <td class="px-4 py-4 text-sm text-gray-800 font-medium border-r border-gray-100">${s.teacher}</td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">${s.room}</code>
          </td>
          <td class="px-4 py-4 text-sm text-gray-700 italic border-r border-gray-100">${s.subject || ""}</td>
          <td class="px-4 py-4 text-sm text-gray-800 font-semibold border-r border-gray-100">${s.day}</td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
              ${typeof formatDate === "function" ? formatDate(s.date) : s.date}
            </span>
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">${s.start_time}</span>
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">${s.end_time}</span>
          </td>
          <td class="px-4 py-4 text-center">
            <div class="flex justify-center space-x-2">
              <button class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105" 
                      title="Modifica" onclick="openEditSchedule(${s.id})">✏️</button>
              <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105" 
                      title="Elimina" onclick="openDeleteScheduleModal(${s.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
    html += "</tbody></table></div>";
  }
  document.getElementById("schedules-list").innerHTML = html;
}

function updateFilterScheduleCourseSelect() {
  filterScheduleCourseSelect.innerHTML =
    '<option value="">Tutti i corsi</option>' +
    allCourses
      .map((c) => `<option value="${c.id}">${c.name}</option>`)
      .join("");
}
function fetchCourses() {
  return fetch("/api/courses")
    .then((r) => r.json())
    .then((data) => {
      allCourses = data;
      updateFilterScheduleCourseSelect();
    });
}
function fetchSchedules() {
  fetch("/api/schedules")
    .then((r) => r.json())
    .then((data) => {
      allSchedules = data;
      renderSchedulesList();
    });
}
// Funzione per ottenere il giorno della settimana in italiano da una data ISO
function getItalianDayOfWeek(dateString) {
  if (!dateString) return "";
  const giorni = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  const d = new Date(dateString);
  if (isNaN(d)) return "";
  return giorni[d.getDay()];
}

// Collega il calcolo automatico del giorno ai campi data nei modali di aggiunta e modifica
function setupAutoDayFill() {
  const addDate = document.getElementById("add-date");
  const addDayDiv = document.getElementById("add-day");
  if (addDate && addDayDiv) {
    addDate.addEventListener("change", function () {
      const giorno = getItalianDayOfWeek(this.value);
      addDayDiv.textContent = giorno;
    });
  }
  const editDate = document.getElementById("edit-date");
  const editDayDiv = document.getElementById("edit-day");
  if (editDate && editDayDiv) {
    editDate.addEventListener("change", function () {
      const giorno = getItalianDayOfWeek(this.value);
      editDayDiv.textContent = giorno;
    });
  }
}

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

  const teachers = [
    ...new Set(schedules.map((s) => s.teacher).filter(Boolean)),
  ];
  teacherChoices.clearChoices();
  teacherChoices.setChoices(
    teachers.map((t) => ({ value: t, label: t })),
    "value",
    "label",
    false,
  );

  const rooms = [...new Set(schedules.map((s) => s.room).filter(Boolean))];
  roomChoices.clearChoices();
  roomChoices.setChoices(
    rooms.map((r) => ({ value: r, label: r })),
    "value",
    "label",
    false,
  );

  const subjects = [
    ...new Set(schedules.map((s) => s.subject).filter(Boolean)),
  ];
  subjectChoices.clearChoices();
  subjectChoices.setChoices(
    subjects.map((su) => ({ value: su, label: su })),
    "value",
    "label",
    false,
  );

  const giorniPresenti = new Set(schedules.map((s) => s.day).filter(Boolean));
  const giorniOrdinati = settimana.filter((g) => giorniPresenti.has(g));
  dayChoices.clearChoices();
  dayChoices.setChoices(
    giorniOrdinati.map((d) => ({ value: d, label: d })),
    "value",
    "label",
    false,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  searchScheduleCourseInput = document.getElementById("search-schedule-course");
  filterScheduleCourseSelect = document.getElementById(
    "filter-schedule-course",
  );
  setupAddFieldWithButton("add-teacher", "add-teacher-btn", "teacher-list");
  setupAddFieldWithButton("add-room", "add-room-btn", "room-list");
  setupAddFieldWithButton("add-subject", "add-subject-btn", "subject-list");

  setupAddFieldWithButton("edit-teacher", "edit-teacher-btn", "teacher-list");
  setupAddFieldWithButton("edit-room", "edit-room-btn", "room-list");
  setupAddFieldWithButton("edit-subject", "edit-subject-btn", "subject-list");

  if (searchScheduleCourseInput && filterScheduleCourseSelect) {
    searchScheduleCourseInput.addEventListener("input", renderSchedulesList);
    filterScheduleCourseSelect.addEventListener("change", renderSchedulesList);
  }
  fetchCourses().then(fetchSchedules);
  setupAutoDayFill();
  setupAutoEndTime();
  // Inizializza Choices.js per i filtri multipli
  teacherChoices = new Choices("#filter-teacher", {
    removeItemButton: true,
    searchEnabled: true,
    shouldSort: false,
    position: "bottom",
    placeholder: true,
  });
  roomChoices = new Choices("#filter-room", {
    removeItemButton: true,
    searchEnabled: true,
    shouldSort: false,
    position: "bottom",
    placeholder: true,
  });
  subjectChoices = new Choices("#filter-subject", {
    removeItemButton: true,
    searchEnabled: true,
    shouldSort: false,
    position: "bottom",
    placeholder: true,
  });
  dayChoices = new Choices("#filter-day", {
    removeItemButton: true,
    searchEnabled: true,
    shouldSort: false,
    position: "bottom",
    placeholder: true,
  });

  document
    .getElementById("add-schedule-form")
    .addEventListener("submit", function (e) {
      const start = document.getElementById("add-start").value;
      const end = document.getElementById("add-end").value;
      if (end <= start) {
        e.preventDefault();
        const el = document.getElementById("add-schedule-msg"); // Define el here
        el.textContent =
          "L'ora di inizio deve essere precedente a quella di fine.";
        el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
        return false;
      }
    });

  document
    .getElementById("edit-schedule-form")
    .addEventListener("submit", function (e) {
      const start = document.getElementById("edit-start").value;
      const end = document.getElementById("edit-end").value;
      if (end <= start) {
        e.preventDefault();
        const el = document.getElementById("edit-schedule-msg"); // Define el here
        el.textContent =
          "L'ora di inizio deve essere precedente a quella di fine.";
        el.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
        return false;
      }
    });
});
fetchCoursesAndSchedules();

function setupAddFieldWithButton(inputId, buttonId, listId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const list = document.getElementById(listId);

  if (!input || !button || !list) return;

  input.addEventListener("input", () => {
    const val = input.value.trim();
    const exists = Array.from(list.options).some(
      (opt) => opt.value.toLowerCase() === val.toLowerCase(),
    );
    button.style.display = val && !exists ? "inline-block" : "none";
  });

  button.addEventListener("click", () => {
    const val = input.value.trim();
    if (!val) return;
    const opt = document.createElement("option");
    opt.value = val;
    list.appendChild(opt);
    button.style.display = "none";
  });
}

function updateDatalists() {
  const teachers = [
    ...new Set(schedules.map((s) => s.teacher).filter(Boolean)),
  ];
  const rooms = [...new Set(schedules.map((s) => s.room).filter(Boolean))];
  const subjects = [
    ...new Set(schedules.map((s) => s.subject).filter(Boolean)),
  ];

  const setOptions = (id, values) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = values.map((v) => `<option value="${v}">`).join("");
  };

  setOptions("teacher-list", teachers);
  setOptions("room-list", rooms);
  setOptions("subject-list", subjects);
}
