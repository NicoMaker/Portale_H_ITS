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
            <code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">${
              s.room || "-"
            }</code>
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
                      title="Elimina" onclick="openDeleteScheduleModal(${
                        s.id
                      })">
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

// NEW: Function to clear all filters
function clearFilters() {
  document.getElementById("filter-course").value = ""; // Reset course filter
  if (teacherChoices) teacherChoices.removeActiveItems();
  if (roomChoices) roomChoices.removeActiveItems();
  if (subjectChoices) subjectChoices.removeActiveItems();
  if (dayChoices) dayChoices.removeActiveItems();
  document.getElementById("filter-date").value = ""; // Clear date input
  renderSchedules(); // Re-render schedules with cleared filters
}

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

  // Validazione ora di inizio/fine
  const editStart = document.getElementById("edit-start").value;
  const editEnd = document.getElementById("edit-end").value;
  const editMsgEl = document.getElementById("edit-schedule-msg");

  if (editStart >= editEnd) {
    editMsgEl.textContent =
      "L'ora di inizio deve essere precedente a quella di fine.";
    editMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return;
  }

  // Validazione campi Docente, Aula, Materia
  if (
    !validateDatalistField(
      "edit-teacher",
      "teacher-list",
      "edit-schedule-msg",
      "Docente",
    )
  )
    return;
  if (
    !validateDatalistField(
      "edit-room",
      "room-list",
      "edit-schedule-msg",
      "Aula",
    )
  )
    return;
  if (
    !validateDatalistField(
      "edit-subject",
      "subject-list",
      "edit-schedule-msg",
      "Materia",
    )
  )
    return;

  await fetch("/api/schedules")
    .then((r) => r.json())
    .then((data) => {
      schedules = data;
    });

  const course_id = document.getElementById("edit-course-select").value;
  const teacher = document.getElementById("edit-teacher").value;
  const room = document.getElementById("edit-room").value;
  const subject = document.getElementById("edit-subject").value;
  // Non modifichiamo day in edit modal, è solo visualizzato
  const day = document.getElementById("edit-day").textContent;
  const date = document.getElementById("edit-date").value;
  const start_time = document.getElementById("edit-start").value;
  const end_time = document.getElementById("edit-end").value;

  const overlap = schedules.some(
    (s) =>
      String(s.course_id) === String(course_id) &&
      s.date === date &&
      s.start_time === start_time &&
      s.id != editingScheduleId,
  );

  if (overlap) {
    editMsgEl.textContent =
      "Esiste già un orario per questo corso, data e ora di inizio.";
    editMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return;
  }

  // Se tutte le validazioni passano, resetta il messaggio e invia
  editMsgEl.textContent = "";
  editMsgEl.className = "hidden"; // Nascondi il messaggio di errore

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
        editMsgEl.textContent = "Orario aggiornato!";
        editMsgEl.className =
          "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800";
        document.getElementById("filter-course").value = course_id;
        renderSchedules();
        setTimeout(() => {
          document.getElementById("edit-schedule-modal").style.display = "none";
        }, 1000);
      } else {
        editMsgEl.textContent = msg;
        editMsgEl.className =
          "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
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
    courses
      .map((c) => `<option value="${c.id}"${c.id == filterVal ? " selected" : ""}>${c.name}</option>`)
      .join(""); // Pre-select if a course filter is active
  document.getElementById("add-teacher").value = "";
  document.getElementById("add-room").value = "";
  document.getElementById("add-subject").value = "";
  document.getElementById("add-day").value = ""; // Use .value for input type text
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
  const day = document.getElementById("add-day").value;
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
        el.textContent = "Orario aggiunto con successo!";
        el.className =
          "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800";
        setTimeout(() => {
          document.getElementById("add-schedule-modal").style.display = "none";
        }, 1500);
      } else {
        el.textContent = msg;
        el.className =
          "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
    });
};

function populateFilterOptions() {
  const teachers = [...new Set(schedules.map((s) => s.teacher).filter(Boolean))];
  const rooms = [...new Set(schedules.map((s) => s.room).filter(Boolean))];
  const subjects = [...new Set(schedules.map((s) => s.subject).filter(Boolean))];
  const days = [...new Set(schedules.map((s) => s.day).filter(Boolean))].sort((a, b) => {
    const dayOrder = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });

  if (teacherChoices) teacherChoices.destroy();
  if (roomChoices) roomChoices.destroy();
  if (subjectChoices) subjectChoices.destroy();
  if (dayChoices) dayChoices.destroy();

  teacherChoices = new Choices("#filter-teacher", {
    choices: teachers.map((t) => ({ value: t, label: t })),
    removeItemButton: true,
  });
  roomChoices = new Choices("#filter-room", {
    choices: rooms.map((r) => ({ value: r, label: r })),
    removeItemButton: true,
  });
  subjectChoices = new Choices("#filter-subject", {
    choices: subjects.map((s) => ({ value: s, label: s })),
    removeItemButton: true,
  });
  dayChoices = new Choices("#filter-day", {
    choices: days.map((d) => ({ value: d, label: d })),
    removeItemButton: true,
  });
}

function updateDatalists() {
  const teachers = [...new Set(schedules.map((s) => s.teacher).filter(Boolean))];
  const rooms = [...new Set(schedules.map((s) => s.room).filter(Boolean))];
  const subjects = [...new Set(schedules.map((s) => s.subject).filter(Boolean))];
  const days = [...new Set(schedules.map((s) => s.day).filter(Boolean))];

  document.getElementById("teacher-list").innerHTML = teachers
    .map((t) => `<option value="${t}">`)
    .join("");
  document.getElementById("room-list").innerHTML = rooms
    .map((r) => `<option value="${r}">`)
    .join("");
  document.getElementById("subject-list").innerHTML = subjects
    .map((s) => `<option value="${s}">`)
    .join("");
  document.getElementById("day-list").innerHTML = days
    .map((d) => `<option value="${d}">`)
    .join("");
}

// Funzione di utilità per validare i campi datalist
function validateDatalistField(
  inputId,
  datalistId,
  msgElementId,
  fieldName,
) {
  const input = document.getElementById(inputId);
  const datalist = document.getElementById(datalistId);
  const msgEl = document.getElementById(msgElementId);
  const options = Array.from(datalist.options).map((opt) => opt.value);

  if (input.value && !options.includes(input.value)) {
    msgEl.textContent = `${fieldName} selezionato non è valido. Seleziona un valore dall'elenco o aggiungine uno nuovo (se il pulsante 'Aggiungi' è visibile).`;
    msgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
    return false;
  }
  return true;
}

// Ensure event listeners are attached after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  setupAutoEndTime();
  fetchCoursesAndSchedules();

  // Add event listener for the new clear filters button
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
  }
});