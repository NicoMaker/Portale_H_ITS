const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { db } = require("../db");
const { requireAdmin, requireAuth } = require("../auth");

// GET /api/users
router.get("/", requireAdmin, (req, res) => {
  db.all("SELECT id, username, role FROM users", [], (err, users) => {
    if (err) {
      return res.status(500).send("DB error");
    }
    let done = 0;
    if (users.length === 0) {
      return res.json([]);
    }
    users.forEach((u) => {
      db.all(
        "SELECT c.* FROM courses c JOIN user_courses uc ON c.id=uc.course_id WHERE uc.user_id=?",
        [u.id],
        (e, courses) => {
          u.courses = courses || [];
          if (++done === users.length) res.json(users);
        },
      );
    });
  });
});

// POST /api/users
router.post("/", requireAdmin, (req, res) => {
  const { username, password, role, course_id } = req.body;
  let userRole = "user";
  if (role === "admin" && req.session.user.role === "admin") {
    userRole = "admin";
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(
        "Errore hashing password durante creazione utente (admin):",
        err.message,
      );
      return res.status(500).send("Errore interno del server.");
    }

    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, userRole],
      function (err) {
        if (err) {
          return res.send("Username già esistente");
        }
        if (userRole === "user" && course_id) {
          db.run(
            "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
            [this.lastID, course_id],
            function (err2) {
              if (err2) {
                return res.send("Errore nell'associazione del corso");
              }
              res.send("OK");
            },
          );
        } else {
          res.send("OK");
        }
      },
    );
  });
});

// POST /api/users/:id/promote
router.post("/:id/promote", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE users SET role="admin" WHERE id=?', [id], function (err) {
    if (err) {
      return res.status(500).send("DB error");
    }
    db.run("DELETE FROM user_courses WHERE user_id=?", [id], function (err2) {
      if (err2) {
        return res.status(500).send("DB error");
      }
      res.send("OK");
    });
  });
});

// DELETE /api/users/:id
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id=?", [id], (err, user) => {
    if (user && user.role === "admin") {
      db.get(
        'SELECT COUNT(*) as n FROM users WHERE role="admin"',
        [],
        (e, row) => {
          if (row && row.n <= 1) {
            return res.status(400).send("Non puoi eliminare l'ultimo admin");
          }
          db.run("DELETE FROM users WHERE id=?", [id], function (err) {
            if (err) {
              return res.status(500).send("DB error");
            }
            res.send("OK");
          });
        },
      );
    } else {
      db.run("DELETE FROM users WHERE id=?", [id], function (err) {
        if (err) {
          return res.status(500).send("DB error");
        }
        res.send("OK");
      });
    }
  });
});

// POST /api/users/:id/assign_course (un solo corso per utente)
router.post("/:id/assign_course", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { course_id } = req.body;

  db.run("DELETE FROM user_courses WHERE user_id=?", [id], function () {
    if (!course_id) return res.send("OK"); // Nessun corso selezionato
    db.run(
      "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
      [id, course_id],
      function (err) {
        if (err) {
          return res.status(500).send("DB error");
        }
        res.send("OK");
      },
    );
  });
});

// POST /api/users/:id/edit (modifica credenziali da admin)
router.post("/:id/edit", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND id!=?",
    [username, id],
    (err, user) => {
      if (user) {
        return res.send("Username già esistente");
      }
      if (password) {
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error(
              "Errore hashing password durante modifica utente (admin):",
              hashErr.message,
            );
            return res.status(500).send("Errore interno del server.");
          }
          db.run(
            "UPDATE users SET username=?, password=? WHERE id=?",
            [username, hashedPassword, id],
            function (err) {
              if (err) {
                return res.status(500).send("Errore aggiornamento utente.");
              }
              res.send("OK");
            },
          );
        });
      } else {
        db.run(
          "UPDATE users SET username=? WHERE id=?",
          [username, id],
          function (err) {
            if (err) {
              return res.status(500).send("Errore aggiornamento utente.");
            }
            res.send("OK");
          },
        );
      }
    },
  );
});

// PUT /api/users/:id
router.put("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND id!=?",
    [username, id],
    (err, user) => {
      if (user) {
        return res.send("Username già esistente");
      }
      if (password) {
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error(
              "Errore hashing password durante modifica utente (admin PUT):",
              hashErr.message,
            );
            return res.status(500).send("Errore interno del server.");
          }
          db.run(
            "UPDATE users SET username=?, password=? WHERE id=?",
            [username, hashedPassword, id],
            function (err) {
              if (err) {
                return res.status(500).send("Errore aggiornamento utente.");
              }
              res.send("OK");
            },
          );
        });
      } else {
        db.run(
          "UPDATE users SET username=? WHERE id=?",
          [username, id],
          function (err) {
            if (err) {
              return res.status(500).send("Errore aggiornamento utente.");
            }
            res.send("OK");
          },
        );
      }
    },
  );
});

// POST /api/users/:id/demote
router.post("/:id/demote", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id=?", [id], (err, user) => {
    if (!user || user.role !== "admin") {
      return res.status(400).send("Non è un admin");
    }
    db.get(
      'SELECT COUNT(*) as n FROM users WHERE role="admin"',
      [],
      (e, row) => {
        if (row && row.n <= 1) {
          return res.status(400).send("Non puoi togliere l'ultimo admin");
        }
        db.run('UPDATE users SET role="user" WHERE id=?', [id], function (err) {
          if (err) {
            return res.status(500).send("DB error");
          }
          res.send("OK");
        });
      },
    );
  });
});

// User profile update
router.post("/profile", requireAuth, (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=? AND id!=?",
    [username, req.session.user.id],
    (err, user) => {
      if (user) {
        return res.send("Username già esistente");
      }
      if (password) {
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error(
              "Errore hashing password durante modifica profilo utente:",
              hashErr.message,
            );
            return res.status(500).send("Errore interno del server.");
          }
          db.run(
            "UPDATE users SET username=?, password=? WHERE id=?",
            [username, hashedPassword, req.session.user.id],
            function (err) {
              if (err) {
                return res.status(500).send("Errore DB");
              }
              req.session.user.username = username;
              res.send("OK");
            },
          );
        });
      } else {
        db.run(
          "UPDATE users SET username=? WHERE id=?",
          [username, req.session.user.id],
          function (err) {
            if (err) {
              return res.status(500).send("Errore DB");
            }
            req.session.user.username = username;
            res.send("OK");
          },
        );
      }
    },
  );
});

module.exports = router;
