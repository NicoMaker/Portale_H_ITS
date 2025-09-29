let allCourses = [];
let users = [];
let courseToDeleteId = null;

function fetchCourses() {
  fetch("/api/courses")
    .then(async (r) => {
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg);
      }
      return r.json();
    })
    .then((courses) => {
      allCourses = courses;
      return fetch("/api/users");
    })
    .then(async (r) => {
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg);
      }
      return r.json();
    })
    .then((usersData) => {
      users = usersData;
      renderCoursesList();
    })
    .catch((err) => {
      const tableBody = document.getElementById("courses-table-body");
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="3" class="px-6 py-4 text-center text-red-500 font-medium">
              ⚠️ Errore nel caricamento: ${err.message}
            </td>
          </tr>
        `;
      }
    });
}

function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.className = `mt-4 p-4 rounded-2xl text-sm font-medium ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    el.classList.remove("hidden");

    setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }
}

// Modal functions for Add Course
document.getElementById("add-course-btn").onclick = () => {
  document.getElementById("add-course-modal").style.display = "flex";
  document.getElementById("course-msg").classList.add("hidden");
};

document.getElementById("close-add-course-modal").onclick = () => {
  document.getElementById("add-course-modal").style.display = "none";
};

document.getElementById("cancel-add-course").onclick = function () {
  document.getElementById("add-course-modal").style.display = "none";
};

document.getElementById("add-course-form").onsubmit = function (e) {
  e.preventDefault();

  const name = document.getElementById("course-name").value;
  const description = document.getElementById("course-desc").value;

  fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        fetchCourses();
        showMessage("course-msg", "Corso aggiunto con successo!", "success");
        this.reset();
        setTimeout(() => {
          document.getElementById("add-course-modal").style.display = "none";
        }, 1500);
      } else {
        showMessage("course-msg", msg, "error");
      }
    });
};

let editingCourseId = null;

function openEditCourse(id) {
  editingCourseId = id;
  const course = allCourses.find((c) => c.id == id);
  if (course) {
    document.getElementById("edit-course-name").value = course.name;
    document.getElementById("edit-course-desc").value = course.description || "";
  }
  document.getElementById("edit-course-msg").classList.add("hidden");
  document.getElementById("edit-course-modal").style.display = "flex";
}

document.getElementById("close-edit-course-modal").onclick = () => {
  document.getElementById("edit-course-modal").style.display = "none";
};

document.getElementById("cancel-edit-course").onclick = function () {
  document.getElementById("edit-course-modal").style.display = "none";
};

window.onclick = (e) => {
  if (e.target.id === "edit-course-modal") {
    document.getElementById("edit-course-modal").style.display = "none";
  }
  if (e.target.id === "add-course-modal") {
    document.getElementById("add-course-modal").style.display = "none";
  }
  if (e.target.id === "delete-confirm-modal") {
    document.getElementById("delete-confirm-modal").style.display = "none";
  }
};

document.getElementById("edit-course-form").onsubmit = function (e) {
  e.preventDefault();

  const name = document.getElementById("edit-course-name").value;
  const description = document.getElementById("edit-course-desc").value;

  fetch(`/api/courses/${editingCourseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        fetchCourses();
        showMessage("edit-course-msg", "Corso aggiornato!", "success");
        setTimeout(() => {
          document.getElementById("edit-course-modal").style.display = "none";
        }, 1500);
      } else {
        showMessage("edit-course-msg", msg, "error");
      }
    });
};

// Functions for Delete Confirmation Modal
function deleteCourse(id) {
  courseToDeleteId = id;
  const course = allCourses.find((c) => c.id == id);
  if (course) {
    document.getElementById("delete-course-name-display").textContent = course.name;
  }
  document.getElementById("delete-confirm-modal").style.display = "flex";
}

document.getElementById("close-delete-confirm-modal").onclick = () => {
  document.getElementById("delete-confirm-modal").style.display = "none";
};

document.getElementById("cancel-delete-course").onclick = () => {
  document.getElementById("delete-confirm-modal").style.display = "none";
};

document.getElementById("confirm-delete-course").onclick = () => {
  if (courseToDeleteId) {
    fetch(`/api/courses/${courseToDeleteId}`, { method: "DELETE" })
      .then(() => {
        fetchCourses();
        document.getElementById("delete-confirm-modal").style.display = "none";
      })
      .catch((err) => {
        console.error("Errore durante l'eliminazione:", err);
        document.getElementById("delete-confirm-modal").style.display = "none";
      });
  }
};

// Initial setup on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchCourses();
  document.getElementById("search-course")?.addEventListener("input", renderCoursesList);
  document.getElementById("user-filter")?.addEventListener("change", renderCoursesList);
});

// Update stats function
function updateCourseStats() {
  const totalCoursesEl = document.getElementById("total-courses");
  if (totalCoursesEl) {
    totalCoursesEl.textContent = allCourses.length;
  }

  const coursesWithUsers = allCourses.filter(
    (course) =>
      users.some(
        (user) => user.courses && user.courses.some((uc) => uc.id === course.id)
      )
  ).length;

  const coursesWithUsersEl = document.getElementById("courses-with-users");
  if (coursesWithUsersEl) {
    coursesWithUsersEl.textContent = coursesWithUsers;
  }

  const coursesWithoutUsers = allCourses.length - coursesWithUsers;
  const coursesWithoutUsersEl = document.getElementById("courses-without-users");
  if (coursesWithoutUsersEl) {
    coursesWithoutUsersEl.textContent = coursesWithoutUsers;
  }

  // Get the current search query and user filter
  const searchQuery = document.getElementById("search-course")?.value?.toLowerCase() || "";
  const userFilter = document.getElementById("user-filter")?.value || "all";

  // Filter courses based on BOTH the search query and the user filter
  const coursesWithUsersIds = new Set(
    users.flatMap((user) => user.courses.map((c) => c.id))
  );

  const filteredCourses = allCourses
    .filter((course) => {
      // First, filter by user status
      if (userFilter === "with_users") {
        return coursesWithUsersIds.has(course.id);
      }
      if (userFilter === "without_users") {
        return !coursesWithUsersIds.has(course.id);
      }
      return true; // "all"
    })
    .filter((course) => {
      // Then, filter by search query
      return (
        course.name.toLowerCase().includes(searchQuery) ||
        (course.description && course.description.toLowerCase().includes(searchQuery))
      );
    });

  const filteredCoursesEl = document.getElementById("filtered-courses");
  if (filteredCoursesEl) {
    filteredCoursesEl.textContent = filteredCourses.length;
  }
}

// Function to render the table rows with a modern look
function renderCoursesList() {
  const tableBody = document.getElementById("courses-table-body");
  const searchQuery = document.getElementById("search-course")?.value?.toLowerCase() || "";
  const userFilter = document.getElementById("user-filter")?.value || "all";
  let html = "";

  const coursesWithUsersIds = new Set(
    users.flatMap((user) => user.courses.map((c) => c.id))
  );

  let filteredCourses = allCourses
    .filter((course) => {
      // First, filter by user status
      if (userFilter === "with_users") {
        return coursesWithUsersIds.has(course.id);
      }
      if (userFilter === "without_users") {
        return !coursesWithUsersIds.has(course.id);
      }
      return true; // "all"
    })
    .filter((course) => {
      // Then, filter by search query
      return (
        course.name.toLowerCase().includes(searchQuery) ||
        (course.description && course.description.toLowerCase().includes(searchQuery))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!filteredCourses.length) {
    html = `
      <tr>
        <td colspan="3" class="px-6 py-12 text-center text-gray-500">
          <div class="relative mb-6">
            <div class="text-6xl mb-2 float-animation">📚</div>
            <div class="absolute -top-1 -right-1 text-xl animate-bounce">✨</div>
          </div>
          <h3 class="text-xl font-bold text-gray-700 mb-2">Nessun corso trovato</h3>
          <p class="text-sm text-gray-500">Nessun corso corrisponde ai tuoi filtri.</p>
        </td>
      </tr>
    `;
  } else {
    filteredCourses.forEach((course) => {
      html += `
        <tr class="hover:bg-gray-100 transition-colors cursor-pointer">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="bg-gray-200 p-2 rounded-lg text-lg mr-4">📚</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">${course.name}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm text-gray-600">
              ${
                course.description ||
                "<span class='italic text-gray-400'>Nessuna descrizione</span>"
              }
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex space-x-3 items-center">
              <button onclick="openEditCourse(${course.id})"
                      class="text-blue-600 hover:text-blue-900 transition-colors transform hover:scale-110"
                      title="Modifica">
                ✏️
              </button>
              <button onclick="deleteCourse(${course.id})"
                      class="text-red-600 hover:text-red-900 transition-colors transform hover:scale-110"
                      title="Elimina">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    });
  }

  if (tableBody) {
    tableBody.innerHTML = html;
  }
  updateCourseStats();
}