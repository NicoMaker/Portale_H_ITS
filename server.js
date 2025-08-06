const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const { initDb } = require("./db");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Initialize database
initDb();

// Load routes
app.use("/", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/schedules", require("./routes/scheduleRoutes"));
app.use("/", require("./routes/dashboardRoutes"));

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
