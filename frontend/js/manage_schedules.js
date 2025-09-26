let courses = [];
let schedules = [];
let editingScheduleId = null;
let deletingScheduleId = null;
let teacherChoices, roomChoices, subjectChoices, dayChoices;

// Funzione di utilità per aggiungere un'ora all'orario
function addOneHourToTime(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0);
  date.setHours(date.getHours() + 1);
  return date.toTimeString().slice(0, 5);
}

// Configura l'aggiornamento automatico dell'ora di fine
function setupAutoEndTime() {
  const addStart = document.getElementById("add-start");
  const addEnd = document.getElementById("add-end");
  let addEndModified = false;

  addStart?.addEventListener("change", () => {
    if (!addEndModified && addStart.value) {
      addEnd.value = addOneHourToTime(addStart.value);
    }
    addEndModified = false;
  });
  addEnd?.addEventListener("input", () => {
    addEndModified = true;
  });

  const editStart = document.getElementById("edit-start");
  const editEnd = document.getElementById("edit-end");
  let editEndModified = false;

  editStart?.addEventListener("change", () => {
    if (!editEndModified && editStart.value) {
      editEnd.value = addOneHourToTime(editStart.value);
    }
    editEndModified = false;
  });
  editEnd?.addEventListener("input", () => {
    editEndModified = true;
  });
}

// Funzione per ottenere il giorno della settimana da una data
function getDayOfWeek(dateStr) {
  const days = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return days[date.getDay()];
}

// Configura l'aggiornamento automatico del giorno della settimana
function setupAutoDayOfWeek() {
  const addDateInput = document.getElementById("add-date");
  const addDayInput = document.getElementById("add-day");
  const editDateInput = document.getElementById("edit-date");
  const editDaySpan = document.getElementById("edit-day");

  addDateInput?.addEventListener("change", () => {
    addDayInput.value = addDateInput.value
      ? getDayOfWeek(addDateInput.value)
      : "";
  });

  editDateInput?.addEventListener("change", () => {
    editDaySpan.textContent = editDateInput.value
      ? getDayOfWeek(editDateInput.value)
      : "";
  });
}

// Funzione per formattare la data per l'interfaccia utente
function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

// Funzione principale per recuperare e renderizzare i dati
function fetchCoursesAndSchedules() {
  Promise.all([
    fetch("/api/courses").then((r) => r.json()),
    fetch("/api/schedules").then((r) => r.json()),
  ]).then(([allCourses, allSchedules]) => {
    courses = allCourses;
    schedules = allSchedules;

    const uniqueCourseNames = [...new Set(courses.map((c) => c.name))].sort();

    const select = document.getElementById("filter-course");
    if (select) {
      select.innerHTML =
        '<option value="">Tutti i corsi</option>' +
        uniqueCourseNames
          .map((name) => `<option value="${name}">${name}</option>`)
          .join("");
    }

    populateFilterOptions();
    renderSchedules();
    updateDatalists();
    updateScheduleStats();
  });
}

// Funzione per renderizzare la tabella degli orari
function renderSchedules() {
  const courseNameFilter = document.getElementById("filter-course")?.value || "";
  const teacherFilter = teacherChoices ? teacherChoices.getValue(true) : [];
  const roomFilter = roomChoices ? roomChoices.getValue(true) : [];
  const subjectFilter = subjectChoices ? subjectChoices.getValue(true) : [];
  const dayFilter = dayChoices ? dayChoices.getValue(true) : [];
  const dateFilter = document.getElementById("filter-date")?.value || "";
  const startTimeFilter = document.getElementById("filter-start")?.value || "";
  const endTimeFilter = document.getElementById("filter-end")?.value || "";

  console.log("Filtri applicati:", {
    courseNameFilter,
    teacherFilter,
    roomFilter,
    subjectFilter,
    dayFilter,
    dateFilter,
    startTimeFilter,
    endTimeFilter,
  });

  let filtered = schedules;

  if (dayFilter.length) {
    filtered = filtered.filter((s) => dayFilter.includes(s.day));
  }
  if (dateFilter) {
    filtered = filtered.filter((s) => s.date === dateFilter);
  }
  if (startTimeFilter) {
    filtered = filtered.filter((s) => s.start_time >= startTimeFilter);
  }
  if (endTimeFilter) {
    filtered = filtered.filter((s) => s.end_time <= endTimeFilter);
  }

  if (courseNameFilter) {
    const matchingCourseIds = courses
      .filter((c) => c.name === courseNameFilter)
      .map((c) => String(c.id));
    filtered = filtered.filter((s) =>
      matchingCourseIds.includes(String(s.course_id))
    );
  }

  if (teacherFilter.length) {
    filtered = filtered.filter((s) => teacherFilter.includes(s.teacher));
  }
  if (roomFilter.length) {
    filtered = filtered.filter((s) => roomFilter.includes(s.room));
  }
  if (subjectFilter.length) {
    filtered = filtered.filter((s) => subjectFilter.includes(s.subject));
  }

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
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                👨‍🏫 Docente
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                🏫 Aula
              </th>
              <th class="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                📖 Materia
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
          <td class="px-4 py-4 text-sm text-gray-800 font-semibold border-r border-gray-100">
            ${s.day || "-"}
          </td>
          <td class="px-4 py-4 text-sm border-r border-gray-100">
            <span class="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-xs font-mono">
              ${formatDate(s.date)}
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
  const schedulesListEl = document.getElementById("schedules-list");
  if (schedulesListEl) {
    schedulesListEl.innerHTML = html;
  }
  updateScheduleStats();
}

// Funzione per azzerare tutti i filtri
function clearFilters() {
  const filterCourseEl = document.getElementById("filter-course");
  if (filterCourseEl) {
    filterCourseEl.value = "";
  }
  if (teacherChoices) teacherChoices.removeActiveItems();
  if (roomChoices) roomChoices.removeActiveItems();
  if (subjectChoices) subjectChoices.removeActiveItems();
  if (dayChoices) dayChoices.removeActiveItems();
  const filterDateEl = document.getElementById("filter-date");
  if (filterDateEl) {
    filterDateEl.value = "";
  }
  renderSchedules();
}

// Apre il modal di modifica
function openEditSchedule(id) {
  editingScheduleId = id;
  const s = schedules.find((x) => x.id == id);
  const course = courses.find((c) => c.id == s.course_id);

  const editCourseSelectEl = document.getElementById("edit-course-select");
  if (editCourseSelectEl) {
    editCourseSelectEl.innerHTML = courses
      .map(
        (c) =>
          `<option value="${c.id}"${c.id == s.course_id ? " selected" : ""}>${
            c.name
          }</option>`
      )
      .join("");
  }
  
  document.getElementById("edit-teacher").value = s.teacher;
  document.getElementById("edit-room").value = s.room;
  document.getElementById("edit-subject").value = s.subject || "";
  const editDayEl = document.getElementById("edit-day");
  if (editDayEl) {
    editDayEl.textContent = s.day || "";
  }
  document.getElementById("edit-date").value = s.date;
  document.getElementById("edit-start").value = s.start_time;
  document.getElementById("edit-end").value = s.end_time;
  const editScheduleMsgEl = document.getElementById("edit-schedule-msg");
  if (editScheduleMsgEl) {
    editScheduleMsgEl.textContent = "";
  }

  const editScheduleModalEl = document.getElementById("edit-schedule-modal");
  if (editScheduleModalEl) {
    editScheduleModalEl.style.display = "flex";
  }

  toggleAddButtonVisibility("edit", "teacher");
  toggleAddButtonVisibility("edit", "room");
  toggleAddButtonVisibility("edit", "subject");
}

// Gestione form di modifica
const editScheduleFormEl = document.getElementById("edit-schedule-form");
if (editScheduleFormEl) {
  editScheduleFormEl.onsubmit = async function (e) {
    e.preventDefault();
    const editMsgEl = document.getElementById("edit-schedule-msg");

    const course_id = document.getElementById("edit-course-select")?.value;
    const teacher = document.getElementById("edit-teacher")?.value;
    const room = document.getElementById("edit-room")?.value;
    const subject = document.getElementById("edit-subject")?.value;
    const day = document.getElementById("edit-day")?.textContent;
    const date = document.getElementById("edit-date")?.value;
    const start_time = document.getElementById("edit-start")?.value;
    const end_time = document.getElementById("edit-end")?.value;

    if (
      document.getElementById("edit-teacher-btn")?.style.display !== "none" ||
      document.getElementById("edit-room-btn")?.style.display !== "none" ||
      document.getElementById("edit-subject-btn")?.style.display !== "none"
    ) {
      if (editMsgEl) {
        editMsgEl.textContent =
          "Per favore, aggiungi i nuovi valori prima di salvare l'orario.";
        editMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
      return;
    }

    if (start_time >= end_time) {
      if (editMsgEl) {
        editMsgEl.textContent =
          "L'ora di inizio deve essere precedente a quella di fine.";
        editMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
      return;
    }

    const overlap = schedules.some(
      (s) =>
        String(s.course_id) === String(course_id) &&
        s.date === date &&
        s.start_time === start_time &&
        s.id != editingScheduleId
    );

    if (overlap) {
      if (editMsgEl) {
        editMsgEl.textContent =
          "Esiste già un orario per questo corso, data e ora di inizio.";
        editMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
      return;
    }

    if (editMsgEl) {
      editMsgEl.textContent = "";
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
          if (editMsgEl) {
            editMsgEl.textContent = "Orario aggiornato!";
            editMsgEl.className =
              "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800";
          }
          const filterCourseEl = document.getElementById("filter-course");
          if (filterCourseEl) {
            filterCourseEl.value = course_id;
          }
          renderSchedules();
          setTimeout(() => {
            const editScheduleModalEl = document.getElementById("edit-schedule-modal");
            if (editScheduleModalEl) {
              editScheduleModalEl.style.display = "none";
            }
          }, 1000);
        } else {
          if (editMsgEl) {
            editMsgEl.textContent = msg;
            editMsgEl.className =
              "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
          }
        }
      });
  };
}

// Apre il modal di eliminazione
function openDeleteScheduleModal(id) {
  deletingScheduleId = id;
  const s = schedules.find((x) => x.id == id);
  const course = courses.find((c) => c.id == s.course_id);
  
  const deleteScheduleCourseDisplayEl = document.getElementById("delete-schedule-course-display");
  if (deleteScheduleCourseDisplayEl) {
    deleteScheduleCourseDisplayEl.textContent = course.name;
  }
  const deleteScheduleTeacherDisplayEl = document.getElementById("delete-schedule-teacher-display");
  if (deleteScheduleTeacherDisplayEl) {
    deleteScheduleTeacherDisplayEl.textContent = s.teacher;
  }
  const deleteScheduleSubjectDisplayEl = document.getElementById("delete-schedule-subject-display");
  if (deleteScheduleSubjectDisplayEl) {
    deleteScheduleSubjectDisplayEl.textContent = s.subject;
  }
  const deleteScheduleRoomDisplayEl = document.getElementById("delete-schedule-room-display");
  if (deleteScheduleRoomDisplayEl) {
    deleteScheduleRoomDisplayEl.textContent = s.room;
  }
  const deleteScheduleDayDisplayEl = document.getElementById("delete-schedule-day-display");
  if (deleteScheduleDayDisplayEl) {
    deleteScheduleDayDisplayEl.textContent = s.day;
  }
  const deleteScheduleDateDisplayEl = document.getElementById("delete-schedule-date-display");
  if (deleteScheduleDateDisplayEl) {
    deleteScheduleDateDisplayEl.textContent = formatDate(s.date);
  }
  const deleteScheduleStartDisplayEl = document.getElementById("delete-schedule-start-display");
  if (deleteScheduleStartDisplayEl) {
    deleteScheduleStartDisplayEl.textContent = s.start_time;
  }
  const deleteScheduleEndDisplayEl = document.getElementById("delete-schedule-end-display");
  if (deleteScheduleEndDisplayEl) {
    deleteScheduleEndDisplayEl.textContent = s.end_time;
  }
  const deleteScheduleModalEl = document.getElementById("delete-schedule-modal");
  if (deleteScheduleModalEl) {
    deleteScheduleModalEl.style.display = "flex";
  }
}

// Funzione per eliminare l'orario
function deleteSchedule() {
  if (deletingScheduleId) {
    fetch(`/api/schedules/${deletingScheduleId}`, {
      method: "DELETE"
    }).then(
      () => {
        fetchCoursesAndSchedules();
        const deleteScheduleModalEl = document.getElementById("delete-schedule-modal");
        if (deleteScheduleModalEl) {
          deleteScheduleModalEl.style.display = "none";
        }
        deletingScheduleId = null;
      }
    );
  }
}

// Apre il modal di aggiunta
const addScheduleBtnEl = document.getElementById("add-schedule-btn");
if (addScheduleBtnEl) {
  addScheduleBtnEl.onclick = () => {
    const filterVal = document.getElementById("filter-course")?.value;
    const addCourseSelectEl = document.getElementById("add-course-select");
    if (addCourseSelectEl) {
      addCourseSelectEl.innerHTML = `<option value="" disabled selected>Seleziona un corso</option>` + courses
        .map(
          (c) =>
          `<option value="${c.id}"${c.id == filterVal ? " selected" : ""}>${
            c.name
          }</option>`
        )
        .join("");
    }
    document.getElementById("add-teacher").value = "";
    document.getElementById("add-room").value = "";
    document.getElementById("add-subject").value = "";
    const addDayEl = document.getElementById("add-day");
    if (addDayEl) {
      addDayEl.value = "";
    }
    document.getElementById("add-date").value = "";
    document.getElementById("add-start").value = "";
    document.getElementById("add-end").value = "";
    const addScheduleMsgEl = document.getElementById("add-schedule-msg");
    if (addScheduleMsgEl) {
      addScheduleMsgEl.textContent = "";
    }
    const addScheduleModalEl = document.getElementById("add-schedule-modal");
    if (addScheduleModalEl) {
      addScheduleModalEl.style.display = "flex";
    }
    toggleAddButtonVisibility("add", "teacher");
    toggleAddButtonVisibility("add", "room");
    toggleAddButtonVisibility("add", "subject");
  };
}

// Gestione form di aggiunta
const addScheduleFormEl = document.getElementById("add-schedule-form");
if (addScheduleFormEl) {
  addScheduleFormEl.onsubmit = async function (e) {
    e.preventDefault();
    const addMsgEl = document.getElementById("add-schedule-msg");
    const course_id = document.getElementById("add-course-select")?.value;
    const teacher = document.getElementById("add-teacher")?.value;
    const room = document.getElementById("add-room")?.value;
    const subject = document.getElementById("add-subject")?.value;
    const day = document.getElementById("add-day")?.value;
    const date = document.getElementById("add-date")?.value;
    const start_time = document.getElementById("add-start")?.value;
    const end_time = document.getElementById("add-end")?.value;
    if (
      document.getElementById("add-teacher-btn")?.style.display !== "none" ||
      document.getElementById("add-room-btn")?.style.display !== "none" ||
      document.getElementById("add-subject-btn")?.style.display !== "none"
    ) {
      if (addMsgEl) {
        addMsgEl.textContent = "Per favore, aggiungi i nuovi valori prima di aggiungere l'orario.";
        addMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
      return;
    }
    if (start_time >= end_time) {
      if (addMsgEl) {
        addMsgEl.textContent = "L'ora di inizio deve essere precedente a quella di fine.";
        addMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
      return;
    }
    const overlap = schedules.some(
      (s) =>
      String(s.course_id) === String(course_id) &&
      s.date === date &&
      s.start_time === start_time
    );
    if (overlap) {
      if (addMsgEl) {
        addMsgEl.textContent = "Esiste già un orario per questo corso, data e ora di inizio.";
        addMsgEl.className = "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
      }
      return;
    }
    if (addMsgEl) {
      addMsgEl.textContent = "";
    }
    fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          course_id,
          teacher,
          room,
          subject,
          day,
          date,
          start_time,
          end_time
        }),
      })
      .then((r) => r.text())
      .then((msg) => {
        fetchCoursesAndSchedules();
        if (msg === "OK") {
          if (addMsgEl) {
            addMsgEl.textContent = "Orario aggiunto con successo!";
            addMsgEl.className =
              "mt-4 p-3 rounded-lg text-sm bg-green-100 text-green-800";
          }
          const addScheduleModalEl = document.getElementById("add-schedule-modal");
          if (addScheduleModalEl) {
            setTimeout(() => {
              addScheduleModalEl.style.display = "none";
            }, 1000);
          }
        } else {
          if (addMsgEl) {
            addMsgEl.textContent = msg;
            addMsgEl.className =
              "mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800";
          }
        }
      });
  };
}

function updateDatalists() {
  const teachers = [...new Set(schedules.map((s) => s.teacher))].filter(
    (x) => !!x
  );
  const rooms = [...new Set(schedules.map((s) => s.room))].filter((x) => !!x);
  const subjects = [...new Set(schedules.map((s) => s.subject))].filter(
    (x) => !!x
  );
  const days = [...new Set(schedules.map((s) => s.day))].filter((x) => !!x);
  const teacherListEl = document.getElementById("teacher-list");
  if (teacherListEl) {
    teacherListEl.innerHTML = teachers
      .map((t) => `<option value="${t}">`)
      .join("");
  }
  const roomListEl = document.getElementById("room-list");
  if (roomListEl) {
    roomListEl.innerHTML = rooms.map((r) => `<option value="${r}">`).join("");
  }
  const subjectListEl = document.getElementById("subject-list");
  if (subjectListEl) {
    subjectListEl.innerHTML = subjects
      .map((s) => `<option value="${s}">`)
      .join("");
  }
  const dayListEl = document.getElementById("day-list");
  if (dayListEl) {
    dayListEl.innerHTML = days.map((d) => `<option value="${d}">`).join("");
  }
}

function updateScheduleStats() {
  const total = schedules.length;
  document.getElementById("total-schedules").textContent = total;

  const today = new Date().toISOString().slice(0, 10);
  const thisWeekSchedules = schedules.filter(
    (s) =>
    new Date(s.date) >= new Date(today) &&
    new Date(s.date) <= new Date(today).setDate(new Date(today).getDate() + 7)
  );
  document.getElementById("week-schedules").textContent =
    thisWeekSchedules.length;

  const uniqueTeachers = new Set(schedules.map((s) => s.teacher)).size;
  document.getElementById("unique-teachers").textContent = uniqueTeachers;

  const uniqueSubjects = new Set(schedules.map((s) => s.subject)).size;
  document.getElementById("unique-subjects").textContent = uniqueSubjects;

  const uniqueClassrooms = new Set(schedules.map((s) => s.room)).size;
  document.getElementById("unique-classrooms").textContent = uniqueClassrooms;

  const filteredCount = filteredSchedules().length;
  document.getElementById("filtered-schedules").textContent = filteredCount;

  updateRefreshButtonText(filteredCount, total);
}

function populateFilterOptions() {
  const uniqueTeachers = [
    ...new Set(schedules.map((s) => s.teacher).filter((t) => !!t)),
  ].sort();
  const uniqueRooms = [
    ...new Set(schedules.map((s) => s.room).filter((r) => !!r)),
  ].sort();
  const uniqueSubjects = [
    ...new Set(schedules.map((s) => s.subject).filter((s) => !!s)),
  ].sort();
  const uniqueDays = [
    ...new Set(schedules.map((s) => s.day).filter((d) => !!d)),
  ].sort((a, b) => {
    const daysOrder = [
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
      "Domenica",
    ];
    return daysOrder.indexOf(a) - daysOrder.indexOf(b);
  });

  const teacherSelect = document.getElementById("filter-teacher");
  const roomSelect = document.getElementById("filter-room");
  const subjectSelect = document.getElementById("filter-subject");
  const daySelect = document.getElementById("filter-day");

  if (teacherSelect && !teacherChoices) {
    teacherChoices = new Choices(teacherSelect, {
      choices: uniqueTeachers.map((t) => ({
        value: t,
        label: t
      })),
      placeholder: true,
      removeItemButton: true,
    });
  } else if (teacherChoices) {
    teacherChoices.setChoices(
      uniqueTeachers.map((t) => ({
        value: t,
        label: t
      })),
      "value",
      "label",
      true
    );
  }

  if (roomSelect && !roomChoices) {
    roomChoices = new Choices(roomSelect, {
      choices: uniqueRooms.map((r) => ({
        value: r,
        label: r
      })),
      placeholder: true,
      removeItemButton: true,
    });
  } else if (roomChoices) {
    roomChoices.setChoices(
      uniqueRooms.map((r) => ({
        value: r,
        label: r
      })),
      "value",
      "label",
      true
    );
  }

  if (subjectSelect && !subjectChoices) {
    subjectChoices = new Choices(subjectSelect, {
      choices: uniqueSubjects.map((s) => ({
        value: s,
        label: s
      })),
      placeholder: true,
      removeItemButton: true,
    });
  } else if (subjectChoices) {
    subjectChoices.setChoices(
      uniqueSubjects.map((s) => ({
        value: s,
        label: s
      })),
      "value",
      "label",
      true
    );
  }

  if (daySelect && !dayChoices) {
    dayChoices = new Choices(daySelect, {
      choices: uniqueDays.map((d) => ({
        value: d,
        label: d
      })),
      placeholder: true,
      removeItemButton: true,
    });
  } else if (dayChoices) {
    dayChoices.setChoices(
      uniqueDays.map((d) => ({
        value: d,
        label: d
      })),
      "value",
      "label",
      true
    );
  }
}

function filteredSchedules() {
  const courseNameFilter = document.getElementById("filter-course")?.value || "";
  const teacherFilter = teacherChoices ? teacherChoices.getValue(true) : [];
  const roomFilter = roomChoices ? roomChoices.getValue(true) : [];
  const subjectFilter = subjectChoices ? subjectChoices.getValue(true) : [];
  const dayFilter = dayChoices ? dayChoices.getValue(true) : [];
  const dateFilter = document.getElementById("filter-date")?.value || "";
  const startTimeFilter = document.getElementById("filter-start")?.value || "";
  const endTimeFilter = document.getElementById("filter-end")?.value || "";

  if (
    !courseNameFilter &&
    teacherFilter.length === 0 &&
    roomFilter.length === 0 &&
    subjectFilter.length === 0 &&
    dayFilter.length === 0 &&
    !dateFilter &&
    !startTimeFilter &&
    !endTimeFilter
  ) {
    return schedules;
  }

  let filtered = schedules;

  if (dayFilter?.length) {
    filtered = filtered.filter((s) => dayFilter.includes(s.day));
  }
  if (dateFilter) {
    filtered = filtered.filter((s) => s.date === dateFilter);
  }
  if (startTimeFilter) {
    filtered = filtered.filter((s) => s.start_time >= startTimeFilter);
  }
  if (endTimeFilter) {
    filtered = filtered.filter((s) => s.end_time <= endTimeFilter);
  }

  if (courseNameFilter) {
    const matchingCourseIds = courses
      .filter((c) => c.name === courseNameFilter)
      .map((c) => String(c.id));
    filtered = filtered.filter((s) =>
      matchingCourseIds.includes(String(s.course_id))
    );
  }

  if (teacherFilter?.length) {
    filtered = filtered.filter((s) => teacherFilter.includes(s.teacher));
  }
  if (roomFilter?.length) {
    filtered = filtered.filter((s) => roomFilter.includes(s.room));
  }
  if (subjectFilter?.length) {
    filtered = filtered.filter((s) => subjectFilter.includes(s.subject));
  }

  return filtered;
}

// Gestione visibilità pulsanti aggiunta/modifica
function toggleAddButtonVisibility(mode, type) {
  const inputEl = document.getElementById(`${mode}-${type}`);
  const btnEl = document.getElementById(`${mode}-${type}-btn`);
  if (!inputEl || !btnEl) return;
  const datalistEl = document.getElementById(`${type}-list`);
  const values = Array.from(datalistEl?.options || []).map(
    (opt) => opt.value
  );

  inputEl.oninput = () => {
    btnEl.style.display = values.includes(inputEl.value) ? "none" : "block";
  };
}

document.addEventListener("DOMContentLoaded", () => {
  fetchCoursesAndSchedules();
  setupAutoEndTime();
  setupAutoDayOfWeek();

  document
    .getElementById("refresh-data")
    ?.addEventListener("click", fetchCoursesAndSchedules);
  document
    .getElementById("clear-filters-btn")
    ?.addEventListener("click", clearFilters);
  document
    .getElementById("close-add-schedule-modal")
    ?.addEventListener("click", () => {
      document.getElementById("add-schedule-modal").style.display = "none";
    });
  document
    .getElementById("close-edit-schedule-modal")
    ?.addEventListener("click", () => {
      document.getElementById("edit-schedule-modal").style.display = "none";
    });
  document
    .getElementById("cancel-delete-schedule")
    ?.addEventListener("click", () => {
      document.getElementById("delete-schedule-modal").style.display = "none";
    });
  document
    .getElementById("confirm-delete-schedule")
    ?.addEventListener("click", deleteSchedule);

  const filterElements = [
    "filter-course",
    "filter-date",
    "filter-start",
    "filter-end",
  ];
  filterElements.forEach((id) => {
    document.getElementById(id)?.addEventListener("change", renderSchedules);
  });

  const liveFilterElements = [
    "filter-teacher",
    "filter-room",
    "filter-subject",
    "filter-day",
  ];
  liveFilterElements.forEach((id) => {
    document
      .getElementById(id)
      ?.addEventListener("change", () => renderSchedules());
  });
});