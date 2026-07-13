// Entry point della dashboard admin
import { loadDashboardData } from "./stats.js";
import { initEditProfile } from "./editProfile.js";
import { initUiEffects } from "./uiEffects.js";

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();
  initEditProfile();
  initUiEffects();

  // Pulsante refresh
  document
    .getElementById("refresh-data")
    ?.addEventListener("click", loadDashboardData);

  // Realtime: qualsiasi cambiamento aggiorna le statistiche
  if (window.AppSocket) {
    ["users_updated", "courses_updated", "schedules_updated"].forEach((ev) =>
      AppSocket.on(ev, loadDashboardData),
    );
  }
});
