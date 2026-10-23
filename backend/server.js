// Entry point: crea l'app, inizializza DB e Socket.IO, avvia il server HTTP
const http = require("http");
const creaApp = require("./src/app");
const { initDb } = require("./src/config/schema");
const realtime = require("./src/realtime/socket");
const { getLocalIP, getPublicIP } = require("./src/utils/network");

const PORT = process.env.PORT || 3000;

async function avvia() {
  await initDb();

  const app = creaApp({ port: PORT });
  const server = http.createServer(app);
  realtime.init(server);

  const chiudi = (segnale) => {
    console.log(`\n${segnale} ricevuto: chiusura del server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGINT", () => chiudi("SIGINT"));
  process.on("SIGTERM", () => chiudi("SIGTERM"));

  server.listen(PORT, "0.0.0.0", async () => {
    const localIP = getLocalIP();
    const publicIP = await getPublicIP();
    console.log(`✅ Server avviato con Socket.IO`);
    console.log(`🌐 IP Pubblico: http://${publicIP}:${PORT}`);
    console.log(`🏠 IP Locale:   http://${localIP}:${PORT}`);
    console.log(`📍 Localhost:   http://localhost:${PORT}`);
  });
}

avvia().catch((err) => {
  console.error("Avvio fallito:", err);
  process.exit(1);
});
