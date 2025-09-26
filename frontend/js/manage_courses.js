let allCourses = [];
let courseToDeleteId = null;
let editingCourseId = null;

const fetchCourses = () => {
  fetch("/api/courses")
    .then((r) => r.json())
    .then((data) => {
      allCourses = data;
      renderCoursesList();
      updateCourseStats();
    })
    .catch((err) => {
      console.error("Errore nel caricamento corsi:", err);
    });
};

const updateCourseStats = () => {
  fetch("/api/users")
    .then((r) => r.json())
    .then((users) => {
      const coursesWithUsersMap = new Map();
      users.forEach(user => {
        if (user.courses && user.courses.length > 0) {
          user.courses.forEach(course => {
            coursesWithUsersMap.set(course.id, true);
          });
        }
      });
      const coursesWithUsers = coursesWithUsersMap.size;
      const coursesWithoutUsers = allCourses.length - coursesWithUsers;

      document.getElementById('total-courses').textContent = allCourses.length;
      document.getElementById('courses-with-users').textContent = coursesWithUsers;
      document.getElementById('courses-without-users').textContent = coursesWithoutUsers;
    })
    .catch(err => {
      console.error('Errore nel caricamento utenti per statistiche:', err);
    });
};

const renderCoursesList = () => {
  const searchTerm = document.getElementById('search-course').value.toLowerCase();
  const filterUsers = document.getElementById('filter-users').value;

  let filteredCourses = allCourses
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  if (searchTerm) {
    filteredCourses = filteredCourses.filter(course =>
      course.name.toLowerCase().includes(searchTerm) ||
      (course.description && course.description.toLowerCase().includes(searchTerm))
    );
  }

  if (filterUsers) {
    fetch("/api/users")
      .then((r) => r.json())
      .then((users) => {
        const coursesWithUsers = new Set(users.flatMap(user => user.courses ? user.courses.map(c => c.id) : []));
        if (filterUsers === 'with-users') {
          filteredCourses = filteredCourses.filter(course => coursesWithUsers.has(course.id));
        } else if (filterUsers === 'without-users') {
          filteredCourses = filteredCourses.filter(course => !coursesWithUsers.has(course.id));
        }
        displayFilteredCourses(filteredCourses);
      });
  } else {
    displayFilteredCourses(filteredCourses);
  }
};

const displayFilteredCourses = (courses) => {
  const coursesListEl = document.getElementById('courses-list');
  const noCoursesFoundEl = document.getElementById('no-courses-found');

  if (courses.length === 0) {
    noCoursesFoundEl.style.display = 'block';
    coursesListEl.innerHTML = '';
  } else {
    noCoursesFoundEl.style.display = 'none';
    const html = courses.map(course => {
      return `
        <tr class="hover:bg-gray-50 transition-colors duration-200">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${course.name}</td>
          <td class="px-6 py-4 text-sm text-gray-500">${course.description || 'Nessuna descrizione'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex justify-end space-x-2">
              <button onclick="openEditCourse(${course.id})" class="text-indigo-600 hover:text-indigo-900 transition-colors" title="Modifica">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
              </button>
              <button onclick="deleteCourse(${course.id})" class="text-red-600 hover:text-red-900 transition-colors" title="Elimina">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    coursesListEl.innerHTML = html;
  }
};

const openEditCourse = (id) => {
  editingCourseId = id;
  const course = allCourses.find((c) => c.id === id);
  if (course) {
    document.getElementById("edit-course-name").value = course.name;
    document.getElementById("edit-course-description").value = course.description || "";
    document.getElementById("edit-course-msg").classList.add("hidden");
    document.getElementById("edit-course-modal").style.display = "flex";
  }
};

const deleteCourse = (id) => {
  courseToDeleteId = id;
  const course = allCourses.find((c) => c.id === id);
  if (course) {
    document.getElementById("delete-course-name-display").textContent = course.name;
    fetch(`/api/users/by_course/${id}`)
      .then((r) => r.json())
      .then((users) => {
        if (users.length > 0) {
          document.getElementById("course-with-users-warning").style.display = "block";
        } else {
          document.getElementById("course-with-users-warning").style.display = "none";
        }
      });
  }
  document.getElementById("delete-course-confirm-modal").style.display = "flex";
};

const showMessage = (elementId, message, type) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.className = `mt-4 p-3 rounded-md text-sm ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`;
    el.classList.remove("hidden");
    setTimeout(() => {
      el.classList.add("hidden");
    }, 3000);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Event Listeners for Filters
  document.getElementById("search-course")?.addEventListener("input", renderCoursesList);
  document.getElementById("filter-users")?.addEventListener("change", renderCoursesList);
  document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
    document.getElementById("search-course").value = "";
    document.getElementById("filter-users").value = "";
    renderCoursesList();
  });
  document.getElementById("refresh-data")?.addEventListener("click", fetchCourses);

  // Add Course Modal
  document.getElementById("add-course-btn")?.addEventListener("click", () => {
    document.getElementById("add-course-modal").style.display = "flex";
    document.getElementById("add-course-form").reset();
    document.getElementById("add-course-msg").classList.add("hidden");
  });
  document.getElementById("close-add-course-modal")?.addEventListener("click", () => document.getElementById("add-course-modal").style.display = "none");
  document.getElementById("cancel-add-course")?.addEventListener("click", () => document.getElementById("add-course-modal").style.display = "none");

  // Edit Course Modal
  document.getElementById("close-edit-course-modal")?.addEventListener("click", () => document.getElementById("edit-course-modal").style.display = "none");
  document.getElementById("cancel-edit-course")?.addEventListener("click", () => document.getElementById("edit-course-modal").style.display = "none");

  // Delete Course Modal
  document.getElementById("close-delete-course-confirm-modal")?.addEventListener("click", () => document.getElementById("delete-course-confirm-modal").style.display = "none");
  document.getElementById("cancel-delete-course")?.addEventListener("click", () => document.getElementById("delete-course-confirm-modal").style.display = "none");
  document.getElementById("confirm-delete-course")?.addEventListener("click", () => {
    if (courseToDeleteId) {
      fetch(`/api/courses/${courseToDeleteId}`, { method: "DELETE" })
        .then((r) => r.text())
        .then((msg) => {
          if (msg === "OK") {
            fetchCourses();
            document.getElementById("delete-course-confirm-modal").style.display = "none";
          } else {
            alert("Errore: " + msg);
          }
        });
    }
  });

  // Form Submissions
  document.getElementById("add-course-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("new-course-name").value,
      description: document.getElementById("new-course-description").value,
    };
    
    fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        showMessage("add-course-msg", "Corso creato con successo!", "success");
        e.target.reset();
        fetchCourses();
        setTimeout(() => document.getElementById("add-course-modal").style.display = "none", 1500);
      } else {
        showMessage("add-course-msg", msg, "error");
      }
    });
  });

  document.getElementById("edit-course-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("edit-course-name").value,
      description: document.getElementById("edit-course-description").value,
    };
    
    fetch(`/api/courses/${editingCourseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        showMessage("edit-course-msg", "Corso aggiornato con successo!", "success");
        fetchCourses();
        setTimeout(() => document.getElementById("edit-course-modal").style.display = "none", 1500);
      } else {
        showMessage("edit-course-msg", msg, "error");
      }
    });
  });

  // Initial Data Fetch
  fetchCourses();
});