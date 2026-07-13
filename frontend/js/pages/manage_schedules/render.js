// Rendering della tabella orari e delle statistiche (Gestione Orari)
import { formatDate } from "../../shared/dom.js";
import { state } from "./state.js";
import { getFilteredSchedules } from "./filters.js";

export function renderSchedules() {
  const filtered = getFilteredSchedules()
    .slice()
    .sort((a, b) =>
      a.date === b.date
        ? a.start_time.localeCompare(b.start_time)
        : a.date.localeCompare(b.date),
    );

  const container = document.getElementById("schedules-list");
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML = `
      <div style="padding:3rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:.75rem;">📅</div>
        <p style="font-weight:700;font-size:1rem;color:#374151;margin:0 0 .25rem;">Nessun orario trovato</p>
        <p style="font-size:.875rem;color:#9ca3af;margin:0;">Modifica i filtri per visualizzare altri risultati.</p>
      </div>`;
    updateScheduleStats();
    return;
  }

  const th = (t, align = "left") =>
    `<th style="padding:.75rem 1rem;text-align:${align};font-size:.75rem;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;">${t}</th>`;

  let html = `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:linear-gradient(135deg,#f8f7ff,#f0f9ff);border-bottom:2px solid #e0e7ff;">
            ${th("📚 Corso")}${th("🕐 Orario")}${th("📅 Giorno")}${th("📆 Data")}${th("👨‍🏫 Docente")}${th("🏫 Aula")}${th("📖 Materia")}${th("⚙️ Azioni", "center")}
          </tr>
        </thead>
        <tbody>`;

  filtered.forEach((s) => {
    const course = state.courses.find((c) => c.id == s.course_id);
    html += `
      <tr style="border-bottom:1px solid #f3f4f6;transition:background .15s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
        <td style="padding:.75rem 1rem;">
          <span style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;padding:3px 10px;border-radius:9999px;font-size:.75rem;font-weight:600;">${course ? course.name : "-"}</span>
        </td>
        <td style="padding:.75rem 1rem;">
          <div style="display:flex;align-items:center;gap:.4rem;">
            <span style="background:#f0fdf4;color:#15803d;padding:3px 8px;border-radius:9999px;font-size:.75rem;font-weight:700;font-family:monospace;">${s.start_time}</span>
            <span style="color:#9ca3af;font-size:.7rem;">→</span>
            <span style="background:#fff5f5;color:#dc2626;padding:3px 8px;border-radius:9999px;font-size:.75rem;font-weight:700;font-family:monospace;">${s.end_time}</span>
          </div>
        </td>
        <td style="padding:.75rem 1rem;font-size:.875rem;font-weight:600;color:#374151;">${s.day || "-"}</td>
        <td style="padding:.75rem 1rem;"><span style="background:#fefce8;color:#854d0e;padding:3px 8px;border-radius:6px;font-size:.75rem;font-family:monospace;font-weight:500;">${formatDate(s.date)}</span></td>
        <td style="padding:.75rem 1rem;font-size:.875rem;font-weight:500;color:#111827;">${s.teacher || "-"}</td>
        <td style="padding:.75rem 1rem;"><code style="background:#f3f4f6;color:#374151;padding:2px 7px;border-radius:5px;font-size:.75rem;">${s.room || "-"}</code></td>
        <td style="padding:.75rem 1rem;font-size:.875rem;color:#6b7280;font-style:italic;">${s.subject || "-"}</td>
        <td style="padding:.75rem 1rem;text-align:center;">
          <div style="display:flex;justify-content:center;gap:.4rem;">
            <button title="Modifica" onclick="openEditSchedule(${s.id})"
              style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;background:#eff6ff;color:#2563eb;transition:all .15s;"
              onmouseover="this.style.background='#2563eb';this.style.color='#fff'" onmouseout="this.style.background='#eff6ff';this.style.color='#2563eb'">✏️</button>
            <button title="Elimina" onclick="openDeleteScheduleModal(${s.id})"
              style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;cursor:pointer;background:#fff5f5;color:#ef4444;transition:all .15s;"
              onmouseover="this.style.background='#ef4444';this.style.color='#fff'" onmouseout="this.style.background='#fff5f5';this.style.color='#ef4444'">🗑️</button>
          </div>
        </td>
      </tr>`;
  });
  html += "</tbody></table></div>";
  container.innerHTML = html;
  updateScheduleStats();
}

export function updateScheduleStats() {
  const { schedules } = state;
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  set("total-schedules", schedules.length);

  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  const weekSchedules = schedules.filter((s) => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  }).length;
  set("week-schedules", weekSchedules);

  set("unique-teachers", new Set(schedules.map((s) => s.teacher)).size);
  set("unique-subjects", new Set(schedules.map((s) => s.subject)).size);
  set("unique-classrooms", new Set(schedules.map((s) => s.room)).size);
  set("filtered-schedules", getFilteredSchedules().length);
}
