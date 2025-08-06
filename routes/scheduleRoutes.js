const express = require("express");
const router = express.Router();

const { db } = require("../db");
const { requireAdmin } = require("../auth");

// GET /api/schedules + search
router.get("/", requireAdmin, (req, res) => {
  const { teacher, room, subject } = req.query;
  let query =
    "SELECT s.*, c.name as course_name FROM schedules s LEFT JOIN courses c ON s.course_id=c.id WHERE 1=1";
  const params = [];
  if (teacher) {
    query += " AND s.teacher LIKE ?";
    params.push(`%${teacher}%`);
  }
  if (room) {
    query += " AND s.room LIKE ?";
    params.push(`%${room}%`);
  }
  if (subject) {
    query += " AND s.subject LIKE ?";
    params.push(`%${subject}%`);
  }
  db.all(query, params, (err, schedules) => {
    if (err) {
      return res.status(500).send("DB error");
    }
    res.json(schedules);
  });
});

// POST /api/schedules
router.post("/", requireAdmin, (req, res) => {
  const { course_id, teacher, room, subject, day, date, start_time, end_time } =
    req.body;

  db.run(
    "INSERT INTO schedules (course_id, teacher, room, subject, day, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [course_id, teacher, room, subject, day, date, start_time, end_time],
    function (err) {
      if (err) {
        return res.status(400).send("Errore inserimento orario");
      }
      res.send("OK");
    },
  );
});

// PUT /api/schedules/:id
router.put("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { course_id, teacher, room, subject, day, date, start_time, end_time } =
    req.body;

  db.run(
    "UPDATE schedules SET course_id=?, teacher=?, room=?, subject=?, day=?, date=?, start_time=?, end_time=? WHERE id=?",
    [course_id, teacher, room, subject, day, date, start_time, end_time, id],
    function (err) {
      if (err) {
        return res.status(400).send("Errore update orario");
      }
      res.send("OK");
    },
  );
});

// DELETE /api/schedules/:id
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM schedules WHERE id=?", [id], function (err) {
    if (err) {
      return res.status(500).send("DB error");
    }
    res.send("OK");
  });
});

// GET /api/schedules/meta
router.get("/meta", requireAdmin, (req, res) => {
  const fields = ["teacher", "room", "subject"];
  const results = {};
  let done = 0;

  fields.forEach((field) => {
    db.all(
      `SELECT DISTINCT ${field} FROM schedules ORDER BY ${field}`,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).send("DB error");
        }
        results[field] = rows.map((r) => r[field]);
        if (++done === fields.length) {
          res.json(results);
        }
      },
    );
  });
});

module.exports = router;
