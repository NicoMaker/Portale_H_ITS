const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { db } = require("../configuration/db");
const { createSession, destroySession } = require("../configuration/auth");

// Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) return res.status(500).send("Errore interno del server.");
    if (!user) {
      return res.send(
        '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>'
      );
    }

    bcrypt.compare(password, user.password, (compareErr, result) => {
      if (compareErr) return res.status(500).send("Errore interno del server.");
      if (!result) {
        return res.send(
          '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>'
        );
      }

      const sid = createSession({
        id: user.id,
        username: user.username,
        role: user.role,
      });
      res.cookie("sid", sid, { httpOnly: true, path: "/" });
      res.redirect(
        user.role === "admin" ? "/admin_dashboard.html" : "/user_dashboard.html"
      );
    });
  });
});

// Logout
router.get("/logout", (req, res) => {
  destroySession(req, res);
  res.redirect("/login.html");
});

// API: stato sessione corrente
router.get("/api/session", (req, res) => {
  const sid = req.cookies?.sid;
  const { sessions } = require("../configuration/auth");
  if (sid && sessions[sid]) {
    const s = sessions[sid];
    return res.json({ ok: true, user: { id: s.user.id, username: s.user.username, role: s.user.role } });
  }
  res.json({ ok: false });
});

module.exports = router;
