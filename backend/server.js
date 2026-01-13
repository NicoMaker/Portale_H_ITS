const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const os = require("os");
const { initDb } = require("./configuration/db");

const app = express();

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
// 🌍 FUNZIONI PER OTTENERE IP
// ========================================
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Salta IPv6 e localhost
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
              const ip = JSON.parse(data).ip;
              resolve(ip);
            } catch (e) {
              reject(e);
            }
          });
        })
        .on("error", reject);
    });
  } catch (error) {
    console.error("⚠️ Impossibile recuperare IP pubblico:", error.message);
    return null;
  }
}

// ========================================
// 🚀 AVVIO SERVER SU 0.0.0.0 (TUTTE LE INTERFACCE)
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", async () => {
  const localIP = getLocalIP();
  const publicIP = await getPublicIP();

  console.log(`✅ Server avviato`);
  console.log(`🌐 IP Pubblico: http://${publicIP}:${PORT}`);
  console.log(`🏠 IP Locale: http://${localIP}:${PORT}`);
  console.log(`📍 Localhost: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://${publicIP}:${PORT}/api/health`);
});

module.exports = app;
