let allCourses = [];
let users = [];
let courseToDeleteId = null;
let editingCourseId = null;
let activeLetter = "";

// ── Fetch ──
function fetchCourses() {
  fetch("/api/courses")
    .then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then((courses) => {
      allCourses = courses;
      return fetch("/api/users");
    })
    .then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    })
    .then((u) => {
      users = u;
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

// ── Message ──
function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.cssText = `padding:.75rem 1rem;border-radius:10px;font-size:.875rem;font-weight:500;
    background:${type === "success" ? "#f0fdf4" : "#fff5f5"};
    color:${type === "success" ? "#15803d" : "#dc2626"};`;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// ── Highlight helper ──
function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<mark class="highlight">$1</mark>',
  );
}

// ── Get current filter values ──
function getFilters() {
  return {
    search: document.getElementById("search-course")?.value?.trim() || "",
    userFilter: document.getElementById("user-filter")?.value || "all",
    sortOrder: document.getElementById("sort-order")?.value || "name_asc",
    letter: activeLetter,
  };
}

// ── Apply all filters and sort ──
function applyFilters(courses) {
  const { search, userFilter, sortOrder, letter } = getFilters();
  const withUsersIds = new Set(
    users.flatMap((u) => (u.courses || []).map((c) => c.id)),
  );
  const q = search.toLowerCase();

  let filtered = courses
    // Filtro iscrizioni
    .filter((c) => {
      if (userFilter === "with_users") return withUsersIds.has(c.id);
      if (userFilter === "without_users") return !withUsersIds.has(c.id);
      return true;
    })
    // Filtro lettera iniziale
    .filter((c) => !letter || c.name.toUpperCase().startsWith(letter))
    // Filtro testo (nome + descrizione)
    .filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });

  // Ordinamento
  filtered.sort((a, b) => {
    const usersA = users.filter((u) =>
      u.courses?.some((c) => c.id === a.id),
    ).length;
    const usersB = users.filter((u) =>
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

// ── Render ──
function renderCoursesList() {
  const tableBody = document.getElementById("courses-table-body");
  const { search } = getFilters();
  const withUsersIds = new Set(
    users.flatMap((u) => (u.courses || []).map((c) => c.id)),
  );

  const filtered = applyFilters(allCourses);

  // Aggiorna contatori
  updateCourseStats(filtered);
  updateActiveTags();

  // Aggiorna badge risultati
  const countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = filtered.length;

  // Aggiorna icone ordinamento
  updateSortIcons();

  // Subtitolo tabella
  const sub = document.getElementById("table-subtitle");
  if (sub) {
    if (filtered.length === allCourses.length) {
      sub.textContent = `${allCourses.length} corsi totali`;
    } else {
      sub.textContent = `${filtered.length} di ${allCourses.length} corsi`;
    }
  }

  // Render righe
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
    .map((course) => {
      const enrolledUsers = users.filter((u) =>
        u.courses?.some((c) => c.id === course.id),
      );
      const count = enrolledUsers.length;

      // Badge iscritti colorato
      const badge =
        count > 0
          ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:#dcfce7;color:#15803d;">
           <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
           ${count}
         </span>`
          : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;background:#f3f4f6;color:#9ca3af;">
           Nessuno
         </span>`;

      // Tooltip iscritti
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
            <div>
              <div style="font-size:.875rem;font-weight:600;color:#111827;">${nameHighlighted}</div>
            </div>
          </div>
        </td>
        <td style="padding:.875rem 1.25rem;max-width:280px;">
          <span style="font-size:.8rem;color:#6b7280;line-height:1.4;">${descHighlighted}</span>
        </td>
        <td style="padding:.875rem 1.25rem;" ${tooltipUsers}>
          ${badge}
        </td>
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
    })
    .join("");
}

// ── Aggiorna icone sort ──
function updateSortIcons() {
  const sort = document.getElementById("sort-order")?.value || "name_asc";
  document.getElementById("sort-name-icon").textContent =
    sort === "name_asc" ? "↑" : sort === "name_desc" ? "↓" : "↑↓";
  document.getElementById("sort-users-icon").textContent =
    sort === "users_desc" ? "↑" : sort === "users_asc" ? "↓" : "↑↓";
}

// ── Aggiorna tag filtri attivi ──
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

// ── Stats ──
function updateCourseStats(filtered) {
  const withUsersIds = new Set(
    users.flatMap((u) => (u.courses || []).map((c) => c.id)),
  );
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("total-courses", allCourses.length);
  set(
    "courses-with-users",
    allCourses.filter((c) => withUsersIds.has(c.id)).length,
  );
  set(
    "courses-without-users",
    allCourses.filter((c) => !withUsersIds.has(c.id)).length,
  );
  set("filtered-courses", filtered ? filtered.length : allCourses.length);
}

// ── Filtro lettera ──
function setLetter(letter) {
  activeLetter = letter;
  document.querySelectorAll(".letter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.letter === letter);
  });
  renderCoursesList();
}

// ── Reset filtri ──
function clearAllFilters() {
  document.getElementById("search-course").value = "";
  document.getElementById("user-filter").value = "all";
  document.getElementById("sort-order").value = "name_asc";
  document.getElementById("clear-search").classList.add("hidden");
  setLetter("");
  renderCoursesList();
}

// ── Modal apertura/chiusura ──
document.getElementById("add-course-btn").onclick = () => {
  document.getElementById("add-course-modal").style.display = "flex";
  document.getElementById("course-msg").classList.add("hidden");
};
document.getElementById("close-add-course-modal").onclick = () =>
  (document.getElementById("add-course-modal").style.display = "none");
document.getElementById("cancel-add-course").onclick = () =>
  (document.getElementById("add-course-modal").style.display = "none");
document.getElementById("close-edit-course-modal").onclick = () =>
  (document.getElementById("edit-course-modal").style.display = "none");
document.getElementById("cancel-edit-course").onclick = () =>
  (document.getElementById("edit-course-modal").style.display = "none");
document.getElementById("close-delete-confirm-modal").onclick = () =>
  (document.getElementById("delete-confirm-modal").style.display = "none");
document.getElementById("cancel-delete-course").onclick = () =>
  (document.getElementById("delete-confirm-modal").style.display = "none");

window.onclick = (e) => {
  ["edit-course-modal", "add-course-modal", "delete-confirm-modal"].forEach(
    (id) => {
      if (e.target?.id === id)
        document.getElementById(id).style.display = "none";
    },
  );
};

// ── Form aggiungi corso ──
document.getElementById("add-course-form").onsubmit = function (e) {
  e.preventDefault();
  fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("course-name").value,
      description: document.getElementById("course-desc").value,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        fetchCourses();
        showMessage("course-msg", "✅ Corso aggiunto!", "success");
        this.reset();
        setTimeout(
          () =>
            (document.getElementById("add-course-modal").style.display =
              "none"),
          1400,
        );
      } else {
        showMessage("course-msg", msg, "error");
      }
    });
};

// ── Edit course ──
function openEditCourse(id) {
  editingCourseId = id;
  const course = allCourses.find((c) => c.id == id);
  if (course) {
    document.getElementById("edit-course-name").value = course.name;
    document.getElementById("edit-course-desc").value =
      course.description || "";
  }
  document.getElementById("edit-course-msg").classList.add("hidden");
  document.getElementById("edit-course-modal").style.display = "flex";
}

document.getElementById("edit-course-form").onsubmit = function (e) {
  e.preventDefault();
  fetch(`/api/courses/${editingCourseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("edit-course-name").value,
      description: document.getElementById("edit-course-desc").value,
    }),
  })
    .then((r) => r.text())
    .then((msg) => {
      if (msg === "OK") {
        fetchCourses();
        showMessage("edit-course-msg", "✅ Corso aggiornato!", "success");
        setTimeout(
          () =>
            (document.getElementById("edit-course-modal").style.display =
              "none"),
          1400,
        );
      } else {
        showMessage("edit-course-msg", msg, "error");
      }
    });
};

// ── Delete course ──
function deleteCourse(id) {
  courseToDeleteId = id;
  const course = allCourses.find((c) => c.id == id);
  if (course)
    document.getElementById("delete-course-name-display").textContent =
      `"${course.name}"`;
  document.getElementById("delete-confirm-modal").style.display = "flex";
}

document.getElementById("confirm-delete-course").onclick = () => {
  if (!courseToDeleteId) return;
  fetch(`/api/courses/${courseToDeleteId}`, { method: "DELETE" })
    .then(() => {
      fetchCourses();
      document.getElementById("delete-confirm-modal").style.display = "none";
    })
    .catch(
      () =>
        (document.getElementById("delete-confirm-modal").style.display =
          "none"),
    );
};

// ── Init listeners ──
document.addEventListener("DOMContentLoaded", () => {
  fetchCourses();

  // Ricerca testo
  const searchInput = document.getElementById("search-course");
  const clearSearch = document.getElementById("clear-search");
  searchInput.addEventListener("input", () => {
    clearSearch.classList.toggle("hidden", !searchInput.value);
    renderCoursesList();
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.classList.add("hidden");
    renderCoursesList();
  });

  // Filtri select
  document
    .getElementById("user-filter")
    .addEventListener("change", renderCoursesList);
  document
    .getElementById("sort-order")
    .addEventListener("change", renderCoursesList);

  // Reset filtri
  document
    .getElementById("clear-filters-btn")
    .addEventListener("click", clearAllFilters);

  // Filtro lettera
  document.querySelectorAll(".letter-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLetter(btn.dataset.letter));
  });

  // Ordinamento cliccando header tabella
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.dataset.col;
      const select = document.getElementById("sort-order");
      if (col === "name") {
        select.value = select.value === "name_asc" ? "name_desc" : "name_asc";
      } else if (col === "users") {
        select.value =
          select.value === "users_desc" ? "users_asc" : "users_desc";
      }
      renderCoursesList();
    });
  });
});

// ── Real-time ──
document.addEventListener("DOMContentLoaded", () => {
  if (!window.AppSocket) return;
  AppSocket.on("courses_updated", fetchCourses);
  AppSocket.on("users_updated", fetchCourses);
});
