const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const { db } = require("../db");
const { createSession, destroySession, getSession } = require("../auth");

// Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      console.error("Errore DB durante il login:", err.message);
      return res.status(500).send("Errore interno del server.");
    }
    if (!user) {
      return res.send(
        '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>',
      );
    }

    bcrypt.compare(password, user.password, (compareErr, result) => {
      if (compareErr) {
        console.error("Errore bcrypt durante il login:", compareErr.message);
        return res.status(500).send("Errore interno del server.");
      }
      if (!result) {
        return res.send(
          '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>',
        );
      }

      const sid = createSession({
        id: user.id,
        username: user.username,
        role: user.role,
      });
      res.cookie("sid", sid, { httpOnly: true, path: "/" });
      res.redirect(
        user.role === "admin"
          ? "/admin_dashboard.html"
          : "/user_dashboard.html",
      );
    });
  });
});

// Logout
router.get("/logout", (req, res) => {
  destroySession(req, res);
  res.redirect("/login.html");
});

module.exports = router;
