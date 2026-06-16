const express = require("express");
const router = express.Router();

const { db } = require("../configuration/db");
const { requireAdmin, requireAuth } = require("../configuration/auth");

function broadcast(req, event, data) {
  const io = req.app.get("io");
  if (io) io.emit(event, data);
}

// GET /api/courses — accessibile a tutti gli autenticati
router.get("/", requireAuth, (req, res) => {
  db.all("SELECT * FROM courses ORDER BY name", [], (err, courses) => {
    if (err) return res.status(500).send("DB error");
    res.json(courses);
  });
});

// POST /api/courses
router.post("/", requireAdmin, (req, res) => {
  const { name, description } = req.body;
  db.run(
    "INSERT INTO courses (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) return res.status(400).send("Nome corso già esistente");
      broadcast(req, "courses_updated", { action: "created", courseId: this.lastID });
      res.send("OK");
    }
  );
});

// PUT /api/courses/:id
router.put("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  db.get("SELECT * FROM courses WHERE name = ? AND id != ?", [name, id], (err, existing) => {
    if (err) return res.status(500).send("DB error");
    if (existing) return res.status(400).send("Nome corso già esistente");

    db.run(
      "UPDATE courses SET name=?, description=? WHERE id=?",
      [name, description, id],
      function (err) {
        if (err) return res.status(400).send("Errore update corso");
        broadcast(req, "courses_updated", { action: "updated", courseId: Number(id) });
        // Aggiorna anche gli orari degli utenti che potrebbero essere connessi
        broadcast(req, "schedule_updated", { courseId: Number(id) });
        res.send("OK");
      }
    );
  });
});

// DELETE /api/courses/:id
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM courses WHERE id=?", [id], function (err) {
    if (err) return res.status(500).send("DB error");
    broadcast(req, "courses_updated", { action: "deleted", courseId: Number(id) });
    broadcast(req, "schedule_updated", { courseId: Number(id) });
    res.send("OK");
  });
});

module.exports = router;
