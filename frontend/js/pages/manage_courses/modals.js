// Modali della pagina Gestione Corsi
import { coursesApi } from "../../shared/api.js";
import { showMessage } from "../../shared/dom.js";
import { state, fetchCourses } from "./state.js";

const $ = (id) => document.getElementById(id);

export function openEditCourse(id) {
  state.editingCourseId = id;
  const course = state.allCourses.find((c) => c.id == id);
  if (course) {
    $("edit-course-name").value = course.name;
    $("edit-course-desc").value = course.description || "";
  }
  $("edit-course-msg").classList.add("hidden");
  $("edit-course-modal").style.display = "flex";
}

export function deleteCourse(id) {
  state.courseToDeleteId = id;
  const course = state.allCourses.find((c) => c.id == id);
  if (course)
    $("delete-course-name-display").textContent = `"${course.name}"`;
  $("delete-confirm-modal").style.display = "flex";
}

export function initModali() {
  $("add-course-btn").onclick = () => {
    $("add-course-modal").style.display = "flex";
    $("course-msg").classList.add("hidden");
  };
  $("close-add-course-modal").onclick = () =>
    ($("add-course-modal").style.display = "none");
  $("cancel-add-course").onclick = () =>
    ($("add-course-modal").style.display = "none");
  $("close-edit-course-modal").onclick = () =>
    ($("edit-course-modal").style.display = "none");
  $("cancel-edit-course").onclick = () =>
    ($("edit-course-modal").style.display = "none");
  $("close-delete-confirm-modal").onclick = () =>
    ($("delete-confirm-modal").style.display = "none");
  $("cancel-delete-course").onclick = () =>
    ($("delete-confirm-modal").style.display = "none");

  window.onclick = (e) => {
    ["edit-course-modal", "add-course-modal", "delete-confirm-modal"].forEach(
      (id) => {
        if (e.target?.id === id) $(id).style.display = "none";
      },
    );
  };

  // Form aggiungi corso
  $("add-course-form").onsubmit = async function (e) {
    e.preventDefault();
    const msg = await coursesApi.crea({
      name: $("course-name").value,
      description: $("course-desc").value,
    });
    if (msg === "OK") {
      fetchCourses();
      showMessage("course-msg", "✅ Corso aggiunto!", "success");
      this.reset();
      setTimeout(() => ($("add-course-modal").style.display = "none"), 1400);
    } else {
      showMessage("course-msg", msg, "error");
    }
  };

  // Form modifica corso
  $("edit-course-form").onsubmit = async function (e) {
    e.preventDefault();
    const msg = await coursesApi.modifica(state.editingCourseId, {
      name: $("edit-course-name").value,
      description: $("edit-course-desc").value,
    });
    if (msg === "OK") {
      fetchCourses();
      showMessage("edit-course-msg", "✅ Corso aggiornato!", "success");
      setTimeout(() => ($("edit-course-modal").style.display = "none"), 1400);
    } else {
      showMessage("edit-course-msg", msg, "error");
    }
  };

  // Conferma eliminazione
  $("confirm-delete-course").onclick = async () => {
    if (!state.courseToDeleteId) return;
    try {
      await coursesApi.elimina(state.courseToDeleteId);
      fetchCourses();
    } finally {
      $("delete-confirm-modal").style.display = "none";
    }
  };
}
