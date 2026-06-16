const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cookieParser = require("cookie-parser");
const os = require("os");
const { initDb } = require("./configuration/db");
const { getSession } = require("./configuration/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Esporta io per uso nelle route
app.set("io", io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../frontend/HTML")));

// Initialize database
initDb();

// Load routes
app.use("/", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/schedules", require("./routes/scheduleRoutes"));
app.use("/", require("./routes/dashboardRoutes"));

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const publicIP = await getPublicIP();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    publicIP: publicIP,
    localIP: getLocalIP(),
    port: PORT,
  });
});

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ========================================
// 🔌 SOCKET.IO — Real-time
// ========================================
// Mappa sessionId -> socketId per forzare logout
const sessionSocketMap = {}; // { sid: socketId }

io.on("connection", (socket) => {
  // Il client si registra inviando il proprio sid (letto dal cookie)
  socket.on("register", (sid) => {
    if (sid) {
      sessionSocketMap[sid] = socket.id;
      socket.data.sid = sid;
    }
  });

  socket.on("disconnect", () => {
    const sid = socket.data.sid;
    if (sid && sessionSocketMap[sid] === socket.id) {
      delete sessionSocketMap[sid];
    }
  });
});

// Utility: forza logout di una sessione specifica
function forceLogout(sid) {
  const socketId = sessionSocketMap[sid];
  if (socketId) {
    io.to(socketId).emit("force_logout", { reason: "session_invalidated" });
    delete sessionSocketMap[sid];
  }
}

// Utility: invia update a tutti i client connessi
function broadcastUpdate(event, data) {
  io.emit(event, data);
}

app.set("forceLogout", forceLogout);
app.set("broadcastUpdate", broadcastUpdate);

// ========================================
// 🌍 IP UTILS
// ========================================
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

async function getPublicIP() {
  try {
    const https = require("https");
    return new Promise((resolve, reject) => {
      https
        .get("https://api.ipify.org?format=json", (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data).ip);
            } catch (e) {
              reject(e);
            }
          });
        })
        .on("error", reject);
    });
  } catch (error) {
    return null;
  }
}

// ========================================
// 🚀 AVVIO SERVER
// ========================================
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", async () => {
  const localIP = getLocalIP();
  const publicIP = await getPublicIP();
  console.log(`✅ Server avviato con Socket.IO`);
  console.log(`🌐 IP Pubblico: http://${publicIP}:${PORT}`);
  console.log(`🏠 IP Locale:   http://${localIP}:${PORT}`);
  console.log(`📍 Localhost:   http://localhost:${PORT}`);
});

module.exports = app;
