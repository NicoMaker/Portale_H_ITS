/**
 * socket-client.js
 * Logica Socket.IO condivisa tra tutte le pagine.
 * Incluso DOPO /socket.io/socket.io.js in ogni pagina HTML.
 * Espone window.AppSocket
 */
(function () {
  "use strict";

  const socket = io({ transports: ["websocket", "polling"] });

  function getSid() {
    const match = document.cookie.match(/(?:^|;\s*)sid=([^;]+)/);
    return match ? match[1] : null;
  }

  socket.on("connect", () => {
    const sid = getSid();
    if (sid) socket.emit("register", sid);
  });

  // ======================================================
  // FORCE LOGOUT
  // ======================================================
  socket.on("force_logout", ({ reason }) => {
    showForceLogoutBanner(reason);
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 2500);
  });

  function showForceLogoutBanner(reason) {
    const old = document.getElementById("__force_logout_banner");
    if (old) old.remove();
    const msgs = {
      session_invalidated:
        "⚠️ La tua sessione è stata invalidata (credenziali o ruolo modificati). Reindirizzamento al login...",
    };
    const text = msgs[reason] || "⚠️ Sessione terminata. Reindirizzamento...";
    const banner = document.createElement("div");
    banner.id = "__force_logout_banner";
    banner.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;padding:16px 24px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.3);animation:slideDown .3s ease-out;";
    banner.innerHTML =
      "<style>@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}</style>" +
      text;
    document.body.prepend(banner);
  }

  window.AppSocket = {
    socket,
    on: (event, cb) => socket.on(event, cb),
    emit: (event, data) => socket.emit(event, data),
  };
})();
