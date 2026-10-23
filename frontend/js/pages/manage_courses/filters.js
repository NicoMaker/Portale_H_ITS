// Logica di filtro/ordinamento della pagina Gestione Corsi
import { state } from "./state.js";
import { normalize } from "../../shared/dom.js";

// Prima lettera senza accenti, maiuscola (È → E)
export const inizialeDi = (nome) =>
  normalize(nome.trim()).charAt(0).toUpperCase();

export function getFilters() {
  return {
    search: document.getElementById("search-course")?.value?.trim() || "",
    userFilter: document.getElementById("user-filter")?.value || "all",
    sortOrder: document.getElementById("sort-order")?.value || "name_asc",
    letters: state.letterFilter?.getValue() ?? new Set(),
  };
}

export function applyFilters(courses) {
  const { search, userFilter, sortOrder, letters } = getFilters();
  const withUsersIds = new Set(
    state.users.flatMap((u) => (u.courses || []).map((c) => c.id)),
  );
  const q = search.toLowerCase();

  let filtered = courses
    .filter((c) => {
      if (userFilter === "with_users") return withUsersIds.has(c.id);
      if (userFilter === "without_users") return !withUsersIds.has(c.id);
      return true;
    })
    .filter((c) => !letters.size || letters.has(inizialeDi(c.name)))
    .filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });

  filtered.sort((a, b) => {
    const usersA = state.users.filter((u) =>
      u.courses?.some((c) => c.id === a.id),
    ).length;
    const usersB = state.users.filter((u) =>
      u.courses?.some((c) => c.id === b.id),
    ).length;
    if (sortOrder === "name_asc") return a.name.localeCompare(b.name);
    if (sortOrder === "name_desc") return b.name.localeCompare(a.name);
    if (sortOrder === "users_desc")
      return usersB - usersA || a.name.localeCompare(b.name);
    if (sortOrder === "users_asc")
      return usersA - usersB || a.name.localeCompare(b.name);
    return 0;
  });

  return filtered;
}
