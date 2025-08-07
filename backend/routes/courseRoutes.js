const express = require("express");
const router = express.Router();

const { db } = require("../configuration/db");
const { requireAdmin } = require("../configuration/auth");

// GET /api/courses
router.get("/", requireAdmin, (req, res) => {
  db.all("SELECT * FROM courses", [], (err, courses) => {
    if (err) {
      return res.status(500).send("DB error");
    }
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
      if (err) {
        return res.status(400).send("Nome corso già esistente");
      }
      res.send("OK");
    },
  );
});

// PUT /api/courses/:id
router.put("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  db.get(
    "SELECT * FROM courses WHERE name = ? AND id != ?",
    [name, id],
    (err, existingCourse) => {
      if (err) {
        return res.status(500).send("DB error");
      }
      if (existingCourse) {
        return res.status(400).send("Nome corso già esistente");
      }

      db.run(
        "UPDATE courses SET name=?, description=? WHERE id=?",
        [name, description, id],
        function (err) {
          if (err) {
            return res.status(400).send("Errore update corso");
          }
          res.send("OK");
        },
      );
    },
  );
});

// DELETE /api/courses/:id
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM courses WHERE id=?", [id], function (err) {
    if (err) {
      return res.status(500).send("DB error");
    }
    res.send("OK");
  });
});

module.exports = router;
