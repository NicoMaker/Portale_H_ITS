// Aggregatore delle route dell'applicazione
const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const courseRoutes = require("./courseRoutes");
const scheduleRoutes = require("./scheduleRoutes");
const dashboardRoutes = require("./dashboardRoutes");

const router = express.Router();

router.use("/", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/courses", courseRoutes);
router.use("/api/schedules", scheduleRoutes);
router.use("/", dashboardRoutes);

module.exports = router;
