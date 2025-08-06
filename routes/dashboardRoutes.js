const express = require("express");
const path = require("path");
const router = express.Router();

const { db } = require("../db");
const { requireAdmin, requireUser } = require("../auth");

// Dashboard admin: serve page
router.get("/admin_dashboard.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "admin_dashboard.html"));
});

// Dashboard user: serve page
router.get("/user_dashboard.html", requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "user_dashboard.html"));
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

module.exports = router;
