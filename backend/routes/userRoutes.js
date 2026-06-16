const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { db } = require("../configuration/db");
const {
  requireAdmin,
  requireAuth,
  invalidateUserSessions,
} = require("../configuration/auth");

// Helpers per emettere eventi Socket.IO
function getIO(req) {
  return req.app.get("io");
}
function broadcast(req, event, data) {
  const io = getIO(req);
  if (io) io.emit(event, data);
}
function forceLogout(req, sids) {
  const fn = req.app.get("forceLogout");
  if (fn) sids.forEach((sid) => fn(sid));
}

// GET /api/users
router.get("/", requireAdmin, (req, res) => {
  db.all("SELECT id, username, role FROM users", [], (err, users) => {
    if (err) return res.status(500).send("DB error");
    if (users.length === 0) return res.json([]);
    let done = 0;
    users.forEach((u) => {
      db.all(
        "SELECT c.* FROM courses c JOIN user_courses uc ON c.id=uc.course_id WHERE uc.user_id=?",
        [u.id],
        (e, courses) => {
          u.courses = courses || [];
          if (++done === users.length) res.json(users);
        }
      );
    });
  });
});

// POST /api/users — crea utente
router.post("/", requireAdmin, (req, res) => {
  const { username, password, role, course_id } = req.body;
  const userRole =
    role === "admin" && req.session.user.role === "admin" ? "admin" : "user";

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send("Errore interno del server.");

    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, userRole],
      function (err) {
        if (err) return res.send("Username già esistente");

        const newUserId = this.lastID;
        const afterInsert = () => {
          broadcast(req, "users_updated", { action: "created", userId: newUserId });
          res.send("OK");
        };

        if (userRole === "user" && course_id) {
          db.run(
            "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
            [newUserId, course_id],
            (err2) => {
              if (err2) return res.send("Errore nell'associazione del corso");
              afterInsert();
            }
          );
        } else {
          afterInsert();
        }
      }
    );
  });
});

// POST /api/users/:id/promote — promuove a admin → forza logout
router.post("/:id/promote", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE users SET role="admin" WHERE id=?', [id], function (err) {
    if (err) return res.status(500).send("DB error");
    db.run("DELETE FROM user_courses WHERE user_id=?", [id], function (err2) {
      if (err2) return res.status(500).send("DB error");

      // Forza logout utente promosso (deve ri-loginare come admin)
      const sids = invalidateUserSessions(Number(id));
      forceLogout(req, sids);
      broadcast(req, "users_updated", { action: "promoted", userId: Number(id) });
      res.send("OK");
    });
  });
});

// POST /api/users/:id/demote — retrocede a user → forza logout
router.post("/:id/demote", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id=?", [id], (err, user) => {
    if (!user || user.role !== "admin")
      return res.status(400).send("Non è un admin");
    db.get(
      'SELECT COUNT(*) as n FROM users WHERE role="admin"',
      [],
      (e, row) => {
        if (row && row.n <= 1)
          return res.status(400).send("Non puoi togliere l'ultimo admin");
        db.run('UPDATE users SET role="user" WHERE id=?', [id], function (err) {
          if (err) return res.status(500).send("DB error");

          const sids = invalidateUserSessions(Number(id));
          forceLogout(req, sids);
          broadcast(req, "users_updated", { action: "demoted", userId: Number(id) });
          res.send("OK");
        });
      }
    );
  });
});

// DELETE /api/users/:id — elimina → forza logout
router.delete("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM users WHERE id=?", [id], (err, user) => {
    const doDelete = () => {
      const sids = invalidateUserSessions(Number(id));
      forceLogout(req, sids);
      db.run("DELETE FROM users WHERE id=?", [id], function (err) {
        if (err) return res.status(500).send("DB error");
        broadcast(req, "users_updated", { action: "deleted", userId: Number(id) });
        res.send("OK");
      });
    };

    if (user && user.role === "admin") {
      db.get('SELECT COUNT(*) as n FROM users WHERE role="admin"', [], (e, row) => {
        if (row && row.n <= 1)
          return res.status(400).send("Non puoi eliminare l'ultimo admin");
        doDelete();
      });
    } else {
      doDelete();
    }
  });
});

// POST /api/users/:id/assign_course
router.post("/:id/assign_course", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { course_id } = req.body;

  db.run("DELETE FROM user_courses WHERE user_id=?", [id], function () {
    if (!course_id) {
      broadcast(req, "users_updated", { action: "course_assigned", userId: Number(id) });
      return res.send("OK");
    }
    db.run(
      "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
      [id, course_id],
      function (err) {
        if (err) return res.status(500).send("DB error");
        broadcast(req, "users_updated", { action: "course_assigned", userId: Number(id) });
        // Notifica l'utente interessato in real-time
        const io = getIO(req);
        if (io) io.emit("schedule_updated", { userId: Number(id) });
        res.send("OK");
      }
    );
  });
});

// POST /api/users/:id/edit — modifica credenziali (admin su altro utente) → forza logout
router.post("/:id/edit", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username=? AND id!=?", [username, id], (err, existing) => {
    if (existing) return res.send("Username già esistente");

    const doUpdate = (hashedPassword) => {
      const sql = hashedPassword
        ? "UPDATE users SET username=?, password=? WHERE id=?"
        : "UPDATE users SET username=? WHERE id=?";
      const params = hashedPassword
        ? [username, hashedPassword, id]
        : [username, id];

      db.run(sql, params, function (err) {
        if (err) return res.status(500).send("Errore aggiornamento utente.");

        // Forza logout: le credenziali sono cambiate
        const sids = invalidateUserSessions(Number(id));
        forceLogout(req, sids);
        broadcast(req, "users_updated", { action: "edited", userId: Number(id) });
        res.send("OK");
      });
    };

    if (password) {
      bcrypt.hash(password, 10, (hashErr, hashed) => {
        if (hashErr) return res.status(500).send("Errore interno del server.");
        doUpdate(hashed);
      });
    } else {
      doUpdate(null);
    }
  });
});

// PUT /api/users/:id — modifica credenziali (admin, via PUT) → forza logout
router.put("/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username=? AND id!=?", [username, id], (err, existing) => {
    if (existing) return res.send("Username già esistente");

    const doUpdate = (hashedPassword) => {
      const sql = hashedPassword
        ? "UPDATE users SET username=?, password=? WHERE id=?"
        : "UPDATE users SET username=? WHERE id=?";
      const params = hashedPassword ? [username, hashedPassword, id] : [username, id];

      db.run(sql, params, function (err) {
        if (err) return res.status(500).send("Errore aggiornamento utente.");
        const sids = invalidateUserSessions(Number(id));
        forceLogout(req, sids);
        broadcast(req, "users_updated", { action: "edited", userId: Number(id) });
        res.send("OK");
      });
    };

    if (password) {
      bcrypt.hash(password, 10, (hashErr, hashed) => {
        if (hashErr) return res.status(500).send("Errore interno del server.");
        doUpdate(hashed);
      });
    } else {
      doUpdate(null);
    }
  });
});

// POST /api/users/profile — modifica profilo utente corrente → forza logout
router.post("/profile", requireAuth, (req, res) => {
  const { username, password } = req.body;
  const userId = req.session.user.id;
  const sid = req.cookies?.sid;

  db.get("SELECT * FROM users WHERE username=? AND id!=?", [username, userId], (err, existing) => {
    if (existing) return res.send("Username già esistente");

    const doUpdate = (hashedPassword) => {
      const sql = hashedPassword
        ? "UPDATE users SET username=?, password=? WHERE id=?"
        : "UPDATE users SET username=? WHERE id=?";
      const params = hashedPassword ? [username, hashedPassword, userId] : [username, userId];

      db.run(sql, params, function (err) {
        if (err) return res.status(500).send("Errore DB");

        // Forza logout della sessione corrente (dovranno ri-loginare con le nuove credenziali)
        const { invalidateUserSessions } = require("../configuration/auth");
        const fn = req.app.get("forceLogout");
        const sids = invalidateUserSessions(userId);
        if (fn) sids.forEach((s) => fn(s));

        broadcast(req, "users_updated", { action: "profile_updated", userId });
        res.send("OK");
      });
    };

    if (password) {
      bcrypt.hash(password, 10, (hashErr, hashed) => {
        if (hashErr) return res.status(500).send("Errore interno del server.");
        doUpdate(hashed);
      });
    } else {
      doUpdate(null);
    }
  });
});

module.exports = router;
