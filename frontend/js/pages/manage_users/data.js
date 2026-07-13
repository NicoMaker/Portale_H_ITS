// Caricamento dati e popolamento delle select corso
import { usersApi, coursesApi } from "../../shared/api.js";
import { state } from "./state.js";
import { renderUsersList } from "./render.js";

export async function fetchCourses() {
  state.courses = await coursesApi.lista();
  updateNewCourseSelect();
  updateFilterCourseSelect();
}

export async function fetchUsers() {
  state.users = await usersApi.lista();
  renderUsersList();
}

export function updateNewCourseSelect() {
  const select = document.getElementById("new-course");
  const label = document.getElementById("new-course-label");
  const role = document.getElementById("new-role").value;
  if (role === "user") {
    select.style.display = "";
    label.style.display = "";
    const sorted = [...state.courses].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    select.innerHTML =
      '<option value="">Nessun corso</option>' +
      sorted.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  } else {
    select.style.display = "none";
    label.style.display = "none";
    select.innerHTML = "";
  }
}

export function updateFilterCourseSelect() {
  const select = document.getElementById("filter-course");
  const sorted = [...state.courses].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  select.innerHTML =
    '<option value="">Tutti i corsi</option>' +
    '<option value="_no_course_">Senza corso</option>' +
    sorted.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}
