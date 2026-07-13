// Card statistiche della dashboard admin
import { statsApi } from "../../shared/api.js";

export async function loadDashboardData() {
  try {
    const stats = await statsApi.admin();
    updateStatsCards(stats);
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
  }
}

function updateStatsCards(stats) {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("total-users", stats.totalUsers || 0);
  set("users-admin", `Admin: ${stats.usersByRole?.admin || 0}`);
  set("users-regular", `Utenti: ${stats.usersByRole?.user || 0}`);
  set("total-courses", stats.totalCourses || 0);
  set("total-schedules", stats.totalSchedules || 0);
}
