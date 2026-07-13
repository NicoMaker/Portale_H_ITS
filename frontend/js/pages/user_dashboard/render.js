// Rendering della dashboard utente: badge corsi, tabella orari, statistiche
import { formatDate } from "../../shared/dom.js";
import { state } from "./state.js";
import { getFilteredUserSchedules } from "./filters.js";

export function renderCoursesBadges() {
  const container = document.getElementById("user-courses");
  if (!container) return;
  const courses = state.allCourses;
  if (!courses.length) {
    container.innerHTML =
      '<div style="text-align:center;padding:2rem;color:#9ca3af;font-size:.875rem;">Nessun corso assegnato.</div>';
    return;
  }
  container.innerHTML = courses
    .map(
      (c) => `
    <span style="display:inline-flex;align-items:center;gap:.4rem;padding:.4rem 1rem;border-radius:9999px;font-size:.8rem;font-weight:600;background:linear-gradient(135deg,#eef2ff,#f0f9ff);color:#4f46e5;border:1.5px solid #c7d2fe;transition:all .15s;cursor:default;"
      onmouseover="this.style.background='linear-gradient(135deg,#e0e7ff,#dbeafe)';this.style.transform='scale(1.04)'"
      onmouseout="this.style.background='linear-gradient(135deg,#eef2ff,#f0f9ff)';this.style.transform='scale(1)'">
      📚 ${c.name}
    </span>`,
    )
    .join("");
}

export function renderSchedulesTable() {
  const filtered = getFilteredUserSchedules();
  const container = document.getElementById("user-schedules-table");
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML =
      '<div style="padding:3rem;text-align:center;"><div style="font-size:3rem;margin-bottom:.75rem;">📅</div><p style="font-weight:700;color:#374151;margin:0 0 .25rem;">Nessun orario trovato</p><p style="font-size:.875rem;color:#9ca3af;margin:0;">Modifica i filtri per vedere altri risultati.</p></div>';
    updateUserStats();
    return;
  }

  const intestazioni = [
    "🕐 Orario",
    "📅 Giorno",
    "📆 Data",
    "👨‍🏫 Docente",
    "🏫 Aula",
    "📖 Materia",
  ];

  let html = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:linear-gradient(135deg,#4f46e5,#7c3aed);">
            ${intestazioni
              .map(
                (t) =>
                  `<th style="padding:.75rem 1rem;text-align:left;font-size:.75rem;font-weight:600;color:#fff;white-space:nowrap;">${t}</th>`,
              )
              .join("")}
          </tr>
        </thead>
        <tbody>`;

  for (const s of filtered) {
    html += `
      <tr style="border-bottom:1px solid #f3f4f6;transition:background .15s;" onmouseover="this.style.background='#f9f8ff'" onmouseout="this.style.background=''">
        <td style="padding:.75rem 1rem;">
          <div style="display:flex;align-items:center;gap:.4rem;">
            <span style="background:#f0fdf4;color:#15803d;padding:3px 8px;border-radius:9999px;font-size:.75rem;font-weight:700;font-family:monospace;">${s.start_time}</span>
            <span style="color:#9ca3af;font-size:.7rem;">→</span>
            <span style="background:#fff5f5;color:#dc2626;padding:3px 8px;border-radius:9999px;font-size:.75rem;font-weight:700;font-family:monospace;">${s.end_time}</span>
          </div>
        </td>
        <td style="padding:.75rem 1rem;font-size:.875rem;color:#374151;">${s.day}</td>
        <td style="padding:.75rem 1rem;font-size:.875rem;color:#374151;">${formatDate(s.date)}</td>
        <td style="padding:.75rem 1rem;font-size:.875rem;font-weight:600;color:#111827;">${s.teacher}</td>
        <td style="padding:.75rem 1rem;font-size:.875rem;color:#374151;">${s.room}</td>
        <td style="padding:.75rem 1rem;font-size:.875rem;color:#6b7280;font-style:italic;">${s.subject}</td>
      </tr>`;
  }
  html += "</tbody></table></div>";
  container.innerHTML = html;
  updateUserStats();
}

export function updateUserStats() {
  const { allSchedules } = state;
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  set("total-lessons", allSchedules.length);

  // Lezioni della settimana corrente
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  const weekLessons = allSchedules.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }).length;
  set("week-lessons", weekLessons);

  // Prossima lezione
  const now = new Date();
  const upcoming = allSchedules
    .filter((s) => new Date(s.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextEl = document.getElementById("next-lesson");
  if (nextEl) {
    if (upcoming.length > 0) {
      const next = upcoming[0];
      nextEl.textContent = `${new Date(next.date).toLocaleDateString("it-IT")} alle ${next.start_time}`;
    } else {
      nextEl.textContent = "Nessuna lezione programmata";
    }
  }

  set("filtered-lessons", getFilteredUserSchedules().length);
}
