const express = require("express");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Database setup
const dbDir = path.join(__dirname, "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new sqlite3.Database(path.join(dbDir, "database.db"));

// Inizializzazione DB e admin
function initDb() {
  db.serialize(() => {
    // ABILITA LE CHIAVI ESTERNE QUI ALL'INIZIO DELLA SESSIONE DB
    db.run("PRAGMA foreign_keys = ON;", (err) => {
      if (err) {
        console.error(
          "Errore nell'abilitazione delle chiavi esterne:",
          err.message,
        );
      } else {
        console.log("Chiavi esterne abilitate con successo.");
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS user_courses (
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      teacher TEXT NOT NULL,
      room TEXT NOT NULL,
      subject TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      day TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )`);
    db.get(
      'SELECT COUNT(*) AS count FROM users WHERE role = "admin"',
      [],
      (err, row) => {
        if (err) {
          console.error(
            "Errore nel controllo degli admin esistenti:",
            err.message,
          );
          return;
        }
        if (row.count === 0) {
          // Se non esiste nessun admin, crea l'utente 'admin' predefinito
          const utenteadmin = "Admin";
          const passwordadmin = "Admin123";
          // HASH DELLA PASSWORD DELL'ADMIN
          bcrypt.hash(passwordadmin, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
              console.error(
                "Errore durante l'hashing della password admin:",
                hashErr.message,
              );
              return;
            }
            db.run(
              "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              [utenteadmin, hashedPassword, "admin"], // Salva l'hash
              function (err) {
                if (err) {
                  console.error(
                    "Errore durante la creazione dell'admin iniziale:",
                    err.message,
                  );
                } else {
                  console.log(
                    `Utente ${utenteadmin} predefinito creato con successo (password hashata).`,
                  );
                }
              },
            );
          });
        } else {
          const adminText =
            row.count === 1
              ? "un utente 'admin'"
              : `${row.count} utenti 'admin'`;
          console.log(
            `Esiste già ${adminText}. Nessun nuovo admin predefinito creato.`,
          );
        }
      },
    );
  });
}

initDb();

// Session management (cookie-based, in-memory)
const sessions = {};
function createSession(user) {
  const sid = crypto.randomBytes(16).toString("hex");
  sessions[sid] = { user, created: Date.now() };
  return sid;
}

function getSession(req) {
  const sid = req.cookies.sid;
  if (sid && sessions[sid]) return sessions[sid];
  return null;
}

function destroySession(req, res) {
  const sid = req.cookies.sid;
  if (sid) delete sessions[sid];
  res.clearCookie("sid");
}

// Middleware per autenticazione admin
function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.user.role !== "admin") {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

// Middleware per autenticazione utente
function requireUser(req, res, next) {
  const session = getSession(req);
  if (!session || session.user.role !== "user") {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

// Middleware per autenticazione generica
function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

// Routes

// Redirect root to login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Auth: login
app.post("/login", (req, res) => {
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

    // VERIFICA LA PASSWORD CON BCRYPT
    bcrypt.compare(password, user.password, (compareErr, result) => {
      if (compareErr) {
        console.error("Errore bcrypt durante il login:", compareErr.message);
        return res.status(500).send("Errore interno del server.");
      }
      if (!result) {
        // Password non corrispondente
        return res.send(
          '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>',
        );
      }

      // Password valida, crea sessione
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

// Auth: register
app.post("/register", (req, res) => {
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

  // HASH DELLA PASSWORD PRIMA DI SALVARLA
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
      [username, hashedPassword, userRole], // Salva l'hash
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

// Auth: logout
app.get("/logout", (req, res) => {
  destroySession(req, res);
  res.redirect("/login.html");
});

// API: utenti (admin)
// GET /api/users
app.get("/api/users", requireAdmin, (req, res) => {
  db.all("SELECT id, username, role FROM users", [], (err, users) => {
    if (err) {
      return res.status(500).send("DB error");
    }
    // Per ogni utente, prendi i corsi
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

// POST /api/users (creazione utente da admin)
app.post("/api/users", requireAdmin, (req, res) => {
  const { username, password, role, course_id } = req.body;
  let userRole = "user";
  if (role === "admin" && req.session.user.role === "admin") {
    userRole = "admin";
  }

  // HASH DELLA PASSWORD PRIMA DI SALVARLA
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
      [username, hashedPassword, userRole], // Salva l'hash
      function (err) {
        if (err) {
          return res.send("Username già esistente");
        }
        // Se è stato passato un corso e il ruolo è user, associalo
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
app.post("/api/users/:id/promote", requireAdmin, (req, res) => {
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
app.delete("/api/users/:id", requireAdmin, (req, res) => {
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
app.post("/api/users/:id/assign_course", requireAdmin, (req, res) => {
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
app.post("/api/users/:id/edit", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND id!=?",
    [username, id],
    (err, user) => {
      if (user) {
        return res.send("Username già esistente");
      }
      // Solo se la password è stata fornita, la hash
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
        // Se la password non è stata fornita, aggiorna solo l'username
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

// PUT /api/users/:id (metodo PUT per modifica utente)
app.put("/api/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND id!=?",
    [username, id],
    (err, user) => {
      if (user) {
        return res.send("Username già esistente");
      }
      // Solo se la password è stata fornita, la hash
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
        // Se la password non è stata fornita, aggiorna solo l'username
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
app.post("/api/users/:id/demote", requireAdmin, (req, res) => {
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

// API: corsi (admin)
// GET /api/courses
app.get("/api/courses", requireAdmin, (req, res) => {
  db.all("SELECT * FROM courses", [], (err, courses) => {
    if (err) {
      return res.status(500).send("DB error");
    }
    res.json(courses);
  });
});

// POST /api/courses
app.post("/api/courses", requireAdmin, (req, res) => {
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
app.put("/api/courses/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Check if a course with the new name already exists, excluding the current course being updated
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

      // If no existing course with the same name (excluding itself), proceed with the update
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
app.delete("/api/courses/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM courses WHERE id=?", [id], function (err) {
    if (err) {
      return res.status(500).send("DB error");
    }
    res.send("OK");
  });
});

// API: orari (admin)
// GET /api/schedules + ricerca
app.get("/api/schedules", requireAdmin, (req, res) => {
  // Filtri: teacher, room, subject
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
app.post("/api/schedules", requireAdmin, (req, res) => {
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
app.put("/api/schedules/:id", requireAdmin, (req, res) => {
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
app.delete("/api/schedules/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM schedules WHERE id=?", [id], function (err) {
    if (err) {
      return res.status(500).send("DB error");
    }
    res.send("OK");
  });
});

// GET /api/schedules/meta
app.get("/api/schedules/meta", requireAdmin, (req, res) => {
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

// Dashboard utente: mostra corsi e orari
app.get("/user_dashboard.html", requireUser, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "user_dashboard.html"));
});

// API: corsi utente
app.get("/user/courses", requireUser, (req, res) => {
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

// API: orari utente
app.get("/user/schedules", requireUser, (req, res) => {
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

// Modifica profilo utente
app.post("/user/profile", requireAuth, (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username=? AND id!=?",
    [username, req.session.user.id],
    (err, user) => {
      if (user) {
        return res.send("Username già esistente");
      }
      // Solo se la password è stata fornita, la hash
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
              // Aggiorna sessione
              req.session.user.username = username;
              res.send("OK");
            },
          );
        });
      } else {
        // Se la password non è stata fornita, aggiorna solo l'username
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

// Dashboard admin: serve pagina
app.get("/admin_dashboard.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin_dashboard.html"));
});

// API: restituisce l'utente loggato
app.get("/user/current", requireAuth, (req, res) => {
  res.json({ username: req.session.user.username });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
