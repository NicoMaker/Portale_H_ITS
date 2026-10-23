const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const courseRoutes = require("./courseRoutes");
const scheduleRoutes = require("./scheduleRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const catalogRoutes = require("./catalogRoutes");

const router = express.Router();

router.use("/", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/courses", courseRoutes);
router.use("/api/schedules", scheduleRoutes);
router.use("/api/teachers", catalogRoutes.teachers);
router.use("/api/rooms", catalogRoutes.rooms);
router.use("/api/subjects", catalogRoutes.subjects);
router.use("/", dashboardRoutes);

module.exports = router;