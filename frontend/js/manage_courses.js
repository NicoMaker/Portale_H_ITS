let allCourses = [];
let courseToDeleteId = null; // Variabile per tenere traccia dell'ID del corso da eliminare

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
      renderCoursesList();
    })
    .catch((err) => {
      document.getElementById("courses-list").innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-red-500">
              <div class="text-8xl mb-6">⚠️</div>
              <h3 class="text-2xl font-bold mb-3">Errore nel caricamento</h3>
              <p class="text-lg mb-6">Errore nel caricamento corsi: ${err.message}</p>
              <button onclick="fetchCourses()"
                class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300">
                🔄 Riprova
              </button>
            </div>
          `;
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
      fetchCourses();
      if (msg === "OK") {
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
  fetch("/api/courses")
    .then((r) => r.json())
    .then((courses) => {
      const course = courses.find((c) => c.id == id);
      document.getElementById("edit-course-name").value = course
        ? course.name
        : "";
      document.getElementById("edit-course-desc").value = course
        ? course.description
        : "";
      document.getElementById("edit-course-msg").classList.add("hidden");
      document.getElementById("edit-course-modal").style.display = "flex";
    });
}

document.getElementById("close-edit-course-modal").onclick = () => {
  document.getElementById("edit-course-modal").style.display = "none";
};

document.getElementById("cancel-edit-course").onclick = function () {
  document.getElementById("edit-course-modal").style.display = "none";
};

window.onclick = (e) => {
  if (e.target === document.getElementById("edit-course-modal"))
    document.getElementById("edit-course-modal").style.display = "none";
  if (e.target === document.getElementById("add-course-modal"))
    document.getElementById("add-course-modal").style.display = "none";
  if (e.target === document.getElementById("delete-confirm-modal"))
    // NEW: Close delete modal on outside click
    document.getElementById("delete-confirm-modal").style.display = "none";
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
      fetchCourses();
      if (msg === "OK") {
        showMessage("edit-course-msg", "Corso aggiornato!", "success");
        setTimeout(() => {
          document.getElementById("edit-course-modal").style.display = "none";
        }, 1500);
      } else {
        showMessage("edit-course-msg", msg, "error");
      }
    });
};

// NEW: Functions for Delete Confirmation Modal
function openDeleteConfirmModal(id) {
  courseToDeleteId = id;
  const course = allCourses.find((c) => c.id == id);
  if (course) {
    document.getElementById("delete-course-name-display").textContent =
      course.name;
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
        // Potresti aggiungere qui un messaggio di errore all'utente
        document.getElementById("delete-confirm-modal").style.display = "none";
      });
  }
};

// Modified deleteCourse to open the custom modal
function deleteCourse(id) {
  openDeleteConfirmModal(id);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  fetchCourses();
});

let searchQuery = "";

// Funzione di ricerca
document.getElementById("search-course").addEventListener("input", function () {
  searchQuery = this.value.toLowerCase();
  renderCoursesList();
});

function renderCoursesList() {
  let html = "";

  // Filtra i corsi in base alla query di ricerca
  const filteredCourses = allCourses
    .filter((course) => course.name.toLowerCase().includes(searchQuery))
    .sort((a, b) => a.name.localeCompare(b.name)); // Ordina i corsi in ordine alfabetico

  if (!filteredCourses.length) {
    html = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
        <div class="relative mb-8">
          <div class="text-8xl mb-4 float-animation">📚</div>
          <div class="absolute -top-2 -right-2 text-3xl animate-bounce">✨</div>
        </div>
        <h3 class="text-2xl font-bold text-gray-700 mb-3">Nessun corso trovato</h3>
        <p class="text-lg text-gray-500 mb-6 text-center max-w-md">
          Nessun corso corrisponde alla tua ricerca. Prova con un altro nome!
        </p>
      </div>
    `;
  } else {
    filteredCourses.forEach((course) => {
      const gradients = [
        "from-purple-500 to-pink-500",
        "from-blue-500 to-cyan-500",
        "from-green-500 to-teal-500",
        "from-orange-500 to-red-500",
        "from-indigo-500 to-purple-500",
        "from-pink-500 to-rose-500",
      ];
      const gradient = gradients[course.id % gradients.length];

      html += `
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100 pulse-on-hover course-card-hover">
          <div class="bg-gradient-to-r ${gradient} p-6 relative overflow-hidden">
            <div class="shimmer absolute inset-0"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                  <span class="text-3xl">📚</span>
                </div>
                <div class="flex space-x-2">
                  <button class="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          title="Modifica corso" onclick="openEditCourse(${course.id})">
                    <span class="text-lg">✏️</span>
                  </button>
                  <button class="bg-white/20 hover:bg-red-500/30 backdrop-blur-sm text-white p-3 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                          title="Elimina corso" onclick="deleteCourse(${course.id})">
                    <span class="text-lg">🗑️</span>
                  </button>
                </div>
              </div>
              <h3 class="text-2xl font-bold text-white mb-2 truncate">${course.name}</h3>
            </div>
          </div>

          <div class="p-8">
            <div class="mb-6">
              <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center">
                <span class="mr-2">📝</span>
                Descrizione
              </h4>
              <p class="text-gray-600 leading-relaxed break-words whitespace-normal ${!course.description ? "italic text-gray-400" : ""}">
                ${course.description || "Nessuna descrizione disponibile per questo corso"}
              </p>
            </div>

            <div class="flex space-x-3">
              <button onclick="openEditCourse(${course.id})"
                class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
                <span>✏️</span>
                <span>Modifica</span>
              </button>
              <button onclick="deleteCourse(${course.id})"
                class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center">
                <span>🗑️</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }

  document.getElementById("courses-list").innerHTML = html;
  updateCourseStats();
}

// ------------------------------
// Funzioni per statistiche
// ------------------------------
function updateCourseStats() {
  // Total courses
  const totalCoursesEl = document.getElementById('total-courses');
  if (totalCoursesEl) {
    totalCoursesEl.textContent = allCourses.length;
  }
  
  // Courses with users (need to fetch user data for this)
  fetch("/api/users")
    .then(r => r.json())
    .then(users => {
      const coursesWithUsers = allCourses.filter(course => 
        users.some(user => user.courses && user.courses.some(uc => uc.id === course.id))
      ).length;
      
      const coursesWithUsersEl = document.getElementById('courses-with-users');
      if (coursesWithUsersEl) {
        coursesWithUsersEl.textContent = coursesWithUsers;
      }
      
      const coursesWithoutUsers = allCourses.length - coursesWithUsers;
      const coursesWithoutUsersEl = document.getElementById('courses-without-users');
      if (coursesWithoutUsersEl) {
        coursesWithoutUsersEl.textContent = coursesWithoutUsers;
      }
    })
    .catch(err => {
      console.error('Errore nel caricamento utenti per statistiche:', err);
    });
  
  // Filtered courses (based on current search)
  const searchTerm = document.getElementById('search-course')?.value?.toLowerCase() || '';
  const filteredCourses = allCourses.filter(course => 
    course.name.toLowerCase().includes(searchTerm) ||
    (course.description && course.description.toLowerCase().includes(searchTerm))
  );
  
  const filteredCoursesEl = document.getElementById('filtered-courses');
  if (filteredCoursesEl) {
    filteredCoursesEl.textContent = filteredCourses.length;
  }
}

// Setup refresh button
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchCourses();
    });
  }
  
  // Update stats when search changes
  const searchInput = document.getElementById('search-course');
  if (searchInput) {
    searchInput.addEventListener('input', updateCourseStats);
  }
});
