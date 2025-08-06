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

// Register
router.post("/register", (req, res) => {
  const { username, password, role } = req.body;
  let userRole = "user";
  const session = getSession(req);
  if (
    role === "admin" &&
    session &&
    session.user &&
    session.user.role === "admin"
  ) {
    userRole = "admin";
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(
        "Errore hashing password durante la registrazione:",
        err.message,
      );
      return res.status(500).send("Errore interno del server.");
    }

    db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, userRole],
      function (err) {
        if (err) {
          return res.send(
            "<script>alert(\"Username già esistente\");window.location='/register.html';</script>",
          );
        }
        res.send("Registrazione avvenuta!");
      },
    );
  });
});

// Logout
router.get("/logout", (req, res) => {
  destroySession(req, res);
  res.redirect("/login.html");
});

module.exports = router;
