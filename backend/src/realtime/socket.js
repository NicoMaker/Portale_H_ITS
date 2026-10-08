// Modulo Socket.IO: registrazione sessioni, broadcast e force logout.
// Unico punto del backend che conosce Socket.IO.
const { Server } = require("socket.io");

let io = null;
const sessionSocketMap = {}; // { sid: socketId }

function leggiSid(cookieHeader = "") {
  const m = cookieHeader.match(/(?:^|;\s*)sid=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function init(httpServer) {
  io = new Server(httpServer);

  io.on("connection", (socket) => {
    // Il sid arriva nell'handshake dal cookie httpOnly: il browser non deve
    // più esporlo a JavaScript.
    const sid = leggiSid(socket.handshake.headers.cookie);
    if (sid) {
      sessionSocketMap[sid] = socket.id;
      socket.data.sid = sid;
    }

    socket.on("disconnect", () => {
      const sid = socket.data.sid;
      if (sid && sessionSocketMap[sid] === socket.id) {
        delete sessionSocketMap[sid];
      }
    });
  });

  return io;
}

// Invia update a tutti i client connessi
function broadcast(event, data) {
  if (io) io.emit(event, data);
}

// Forza il logout di una o più sessioni specifiche
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
