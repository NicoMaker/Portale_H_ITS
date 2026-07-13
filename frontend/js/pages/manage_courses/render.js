// Rendering della tabella corsi, statistiche, tag filtri e icone di ordinamento
import { highlight } from "../../shared/dom.js";
import { state } from "./state.js";
import { getFilters, applyFilters } from "./filters.js";

export function renderCoursesList() {
  const tableBody = document.getElementById("courses-table-body");
  const { search } = getFilters();

  const filtered = applyFilters(state.allCourses);

  updateCourseStats(filtered);
  updateActiveTags();

  const countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = filtered.length;

  updateSortIcons();

  const sub = document.getElementById("table-subtitle");
  if (sub) {
    sub.textContent =
      filtered.length === state.allCourses.length
        ? `${state.allCourses.length} corsi totali`
        : `${filtered.length} di ${state.allCourses.length} corsi`;
  }

  if (!filtered.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="padding:3rem;text-align:center;">
          <div style="font-size:2.5rem;margin-bottom:.75rem;">🔍</div>
          <p style="font-weight:700;font-size:.9rem;color:#374151;margin:0 0 .25rem;">Nessun corso trovato</p>
          <p style="font-size:.8rem;color:#9ca3af;margin:0;">Modifica i filtri o la ricerca per vedere altri risultati.</p>
        </td>
      </tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((course) => rigaCorso(course, search))
    .join("");
}

function rigaCorso(course, search) {
  const enrolledUsers = state.users.filter((u) =>
    u.courses?.some((c) => c.id === course.id),
  );
  const count = enrolledUsers.length;

  const badge =
    count > 0
      ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:#dcfce7;color:#15803d;">
         <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
         ${count}
       </span>`
      : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:#f3f4f6;color:#9ca3af;">Nessuno</span>`;

  const tooltipUsers =
    count > 0
      ? `title="${enrolledUsers.map((u) => u.username).join(", ")}"`
      : "";

  const nameHighlighted = highlight(course.name, search);
  const descText = course.description || "";
  const descHighlighted = highlight(
    descText ||
      '<span style="font-style:italic;color:#9ca3af;">Nessuna descrizione</span>',
    search,
  );

  return `
    <tr style="border-bottom:1px solid #f3f4f6;transition:background .15s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
      <td style="padding:.875rem 1.25rem;">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">📚</div>
          <div><div style="font-size:.875rem;font-weight:600;color:#111827;">${nameHighlighted}</div></div>
        </div>
      </td>
      <td style="padding:.875rem 1.25rem;max-width:280px;">
        <span style="font-size:.8rem;color:#6b7280;line-height:1.4;">${descHighlighted}</span>
      </td>
      <td style="padding:.875rem 1.25rem;" ${tooltipUsers}>${badge}</td>
      <td style="padding:.875rem 1.25rem;">
        <div style="display:flex;gap:.4rem;">
          <button onclick="openEditCourse(${course.id})" title="Modifica"
            style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;background:#eff6ff;color:#2563eb;transition:all .15s;font-size:.9rem;"
            onmouseover="this.style.background='#2563eb';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#2563eb'">✏️</button>
          <button onclick="deleteCourse(${course.id})" title="Elimina"
            style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;background:#fff5f5;color:#ef4444;transition:all .15s;font-size:.9rem;"
            onmouseover="this.style.background='#ef4444';this.style.color='#fff'" onmouseout="this.style.background='#fff5f5';this.style.color='#ef4444'">🗑️</button>
        </div>
      </td>
    </tr>`;
}

function updateSortIcons() {
  const sort = document.getElementById("sort-order")?.value || "name_asc";
  document.getElementById("sort-name-icon").textContent =
    sort === "name_asc" ? "↑" : sort === "name_desc" ? "↓" : "↑↓";
  document.getElementById("sort-users-icon").textContent =
    sort === "users_desc" ? "↑" : sort === "users_asc" ? "↓" : "↑↓";
}

function updateActiveTags() {
  const { search, userFilter, letter } = getFilters();
  const container = document.getElementById("active-filters-tags");
  if (!container) return;
  const tags = [];
  if (search)
    tags.push(
      `<span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">🔍 "${search}"</span>`,
    );
  if (userFilter === "with_users")
    tags.push(
      `<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">👥 Con iscritti</span>`,
    );
  if (userFilter === "without_users")
    tags.push(
      `<span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">🚫 Senza iscritti</span>`,
    );
  if (letter)
    tags.push(
      `<span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">🔤 "${letter}"</span>`,
    );
  container.innerHTML = tags.join("");
}

function updateCourseStats(filtered) {
  const withUsersIds = new Set(
    state.users.flatMap((u) => (u.courses || []).map((c) => c.id)),
  );
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("total-courses", state.allCourses.length);
  set(
    "courses-with-users",
    state.allCourses.filter((c) => withUsersIds.has(c.id)).length,
  );
  set(
    "courses-without-users",
    state.allCourses.filter((c) => !withUsersIds.has(c.id)).length,
  );
  set("filtered-courses", filtered ? filtered.length : state.allCourses.length);
}
