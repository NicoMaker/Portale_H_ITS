const express = require("express");
const path = require("path");
const router = express.Router();

const { db } = require("../configuration/db");
const { requireAdmin, requireUser } = require("../configuration/auth");

// Dashboard admin: serve page
router.get("/admin_dashboard.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/HTML", "admin_dashboard.html"));
});

// Dashboard user: serve page
router.get("/user_dashboard.html", requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/HTML", "user_dashboard.html"));
});

// API: user's courses
router.get("/user/courses", requireUser, (req, res) => {
  db.all(
    "SELECT c.* FROM courses c JOIN user_courses uc ON c.id=uc.course_id WHERE uc.user_id=?",
    [req.session.user.id],
    (err, courses) => {
      if (err) {
        return res.status(500).send("DB error");
      }
      res.json(courses);
    },
  );
});

// API: user's schedules
router.get("/user/schedules", requireUser, (req, res) => {
  db.all(
    "SELECT s.*, c.name as course_name FROM schedules s JOIN user_courses uc ON s.course_id=uc.course_id AND uc.user_id=? LEFT JOIN courses c ON s.course_id=c.id",
    [req.session.user.id],
    (err, schedules) => {
      if (err) {
        return res.status(500).send("DB error");
      }
      res.json(schedules);
    },
  );
});

// API: Dashboard statistics for admin
router.get("/admin/stats", requireAdmin, (req, res) => {
  const stats = {};
  let completed = 0;
  const total = 4;

  // Count users
  db.get("SELECT COUNT(*) as count FROM users", [], (err, result) => {
    if (err) return res.status(500).send("DB error");
    stats.totalUsers = result.count;
    if (++completed === total) res.json(stats);
  });

  // Count courses
  db.get("SELECT COUNT(*) as count FROM courses", [], (err, result) => {
    if (err) return res.status(500).send("DB error");
    stats.totalCourses = result.count;
    if (++completed === total) res.json(stats);
  });

  // Count schedules
  db.get("SELECT COUNT(*) as count FROM schedules", [], (err, result) => {
    if (err) return res.status(500).send("DB error");
    stats.totalSchedules = result.count;
    if (++completed === total) res.json(stats);
  });

  // Count users by role
  db.all("SELECT role, COUNT(*) as count FROM users GROUP BY role", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    stats.usersByRole = results.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {});
    if (++completed === total) res.json(stats);
  });
});

// API: Detailed analytics for admin
router.get("/admin/analytics", requireAdmin, (req, res) => {
  const analytics = {};
  let completed = 0;
  const total = 6;

  // Schedules by day
  db.all("SELECT day, COUNT(*) as count FROM schedules GROUP BY day ORDER BY CASE day WHEN 'Lunedì' THEN 1 WHEN 'Martedì' THEN 2 WHEN 'Mercoledì' THEN 3 WHEN 'Giovedì' THEN 4 WHEN 'Venerdì' THEN 5 WHEN 'Sabato' THEN 6 WHEN 'Domenica' THEN 7 END", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    analytics.schedulesByDay = results;
    if (++completed === total) res.json(analytics);
  });

  // Schedules by teacher
  db.all("SELECT teacher, COUNT(*) as count FROM schedules GROUP BY teacher ORDER BY count DESC LIMIT 10", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    analytics.topTeachers = results;
    if (++completed === total) res.json(analytics);
  });

  // Schedules by room
  db.all("SELECT room, COUNT(*) as count FROM schedules GROUP BY room ORDER BY count DESC LIMIT 10", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    analytics.topRooms = results;
    if (++completed === total) res.json(analytics);
  });

  // Schedules by subject
  db.all("SELECT subject, COUNT(*) as count FROM schedules GROUP BY subject ORDER BY count DESC LIMIT 10", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    analytics.topSubjects = results;
    if (++completed === total) res.json(analytics);
  });

  // Users by course
  db.all("SELECT c.name as course_name, COUNT(uc.user_id) as user_count FROM courses c LEFT JOIN user_courses uc ON c.id = uc.course_id GROUP BY c.id, c.name ORDER BY user_count DESC", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    analytics.usersByCourse = results;
    if (++completed === total) res.json(analytics);
  });

  // Recent activity (last 7 days schedules)
  db.all("SELECT date, COUNT(*) as count FROM schedules WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date DESC", [], (err, results) => {
    if (err) return res.status(500).send("DB error");
    analytics.recentActivity = results;
    if (++completed === total) res.json(analytics);
  });
});

module.exports = router;
