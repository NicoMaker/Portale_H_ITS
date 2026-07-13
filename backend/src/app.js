// Composizione dell'app Express: middleware, static, route, error handling
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const { errorHandler } = require("./middleware/errorHandler");
const { getLocalIP, getPublicIP } = require("./utils/network");

function creaApp({ port } = {}) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Static files
  app.use(express.static(path.join(__dirname, "..", "..", "frontend")));
  app.use(express.static(path.join(__dirname, "..", "..", "frontend", "HTML")));

  app.use("/", routes);

  // Health check
  app.get("/api/health", async (req, res) => {
    const publicIP = await getPublicIP();
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      publicIP,
      localIP: getLocalIP(),
      port,
    });
  });

  // Root redirect
  app.get("/", (req, res) => {
    res.redirect("/login.html");
  });

  app.use(errorHandler);

  return app;
}

module.exports = creaApp;
