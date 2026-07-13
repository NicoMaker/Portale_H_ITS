// Stato e caricamento dati della pagina Gestione Corsi
import { coursesApi, usersApi } from "../../shared/api.js";
import { renderCoursesList } from "./render.js";

export const state = {
  allCourses: [],
  users: [],
  courseToDeleteId: null,
  editingCourseId: null,
  activeLetter: "",
};

export function fetchCourses() {
  return coursesApi
    .lista()
    .then((courses) => {
      state.allCourses = courses;
      return usersApi.lista();
    })
    .then((u) => {
      state.users = u;
      renderCoursesList();
    })
    .catch((err) => {
      const tb = document.getElementById("courses-table-body");
      if (tb)
        tb.innerHTML = `
        <tr><td colspan="4" style="padding:3rem;text-align:center;color:#ef4444;font-weight:500;">
          ⚠️ Errore nel caricamento: ${err.message}
        </td></tr>`;
    });
}
