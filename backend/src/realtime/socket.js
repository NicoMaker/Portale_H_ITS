// Modulo Socket.IO: registrazione sessioni, broadcast e force logout.
const { Server } = require("socket.io");

let io = null;
const sessionSocketMap = {};

function leggiSid(cookieHeader = "") {
  const m = cookieHeader.match(/(?:^|;\s*)sid=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function init(httpServer) {
  io = new Server(httpServer);

  io.on("connection", (socket) => {
    const sid = leggiSid(socket.handshake.headers.cookie);
    if (sid) {
      sessionSocketMap[sid] = socket.id;
      socket.data.sid = sid;
    }
    socket.on("disconnect", () => {
      const sid = socket.data.sid;
      if (sid && sessionSocketMap[sid] === socket.id)
        delete sessionSocketMap[sid];
    });
  });

  return io;
}

function broadcast(event, data) {
  if (io) io.emit(event, data);
}

function forceLogout(sids) {
  if (!io) return;
  const lista = Array.isArray(sids) ? sids : [sids];
  for (const sid of lista) {
    const socketId = sessionSocketMap[sid];
    if (socketId) {
      io.to(socketId).emit("force_logout", { reason: "session_invalidated" });
      delete sessionSocketMap[sid];
    }
  }
}

module.exports = { init, broadcast, forceLogout };
