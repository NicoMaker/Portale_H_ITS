// Entry point pagina Gestione Corsi
import { state, fetchCourses } from "./state.js";
import { renderCoursesList } from "./render.js";
import { createLetterFilter } from "../../components/LetterFilter.js";
import { initModali, openEditCourse, deleteCourse } from "./modals.js";

const $ = (id) => document.getElementById(id);

// Handler richiamati dagli onclick inline nelle righe generate
window.openEditCourse = openEditCourse;
window.deleteCourse = deleteCourse;

function clearAllFilters() {
  $("search-course").value = "";
  $("user-filter").value = "all";
  $("sort-order").value = "name_asc";
  $("clear-search").classList.add("hidden");
  state.letterFilter.clear({ silent: true });
  renderCoursesList();
}

function initFiltri() {
  const searchInput = $("search-course");
  const clearSearch = $("clear-search");
  searchInput.addEventListener("input", () => {
    clearSearch.classList.toggle("hidden", !searchInput.value);
    renderCoursesList();
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.classList.add("hidden");
    renderCoursesList();
  });

  $("user-filter").addEventListener("change", renderCoursesList);
  $("sort-order").addEventListener("change", renderCoursesList);
  $("clear-filters-btn").addEventListener("click", clearAllFilters);

  state.letterFilter = createLetterFilter($("letter-filter"), {
    onChange: renderCoursesList,
  });

  // Ordinamento cliccando le intestazioni della tabella
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.dataset.col;
      const select = $("sort-order");
      if (col === "name") {
        select.value = select.value === "name_asc" ? "name_desc" : "name_asc";
      } else if (col === "users") {
        select.value =
          select.value === "users_desc" ? "users_asc" : "users_desc";
      }
      renderCoursesList();
    });
  });
}

function initRealtime() {
  if (!window.AppSocket) return;
  AppSocket.on("courses_updated", fetchCourses);
  AppSocket.on("users_updated", fetchCourses);
}

document.addEventListener("DOMContentLoaded", () => {
  initModali();
  initFiltri();
  initRealtime();
  fetchCourses();
});
