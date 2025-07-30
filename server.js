const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

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
      role TEXT NOT NULL DEFAULT 'user'
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

    // --- LOGICA MODIFICATA PER LA CREAZIONE DELL'ADMIN ---
    // Controlla se esiste almeno un utente con il ruolo 'admin'
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
          db.run(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            [utenteadmin, passwordadmin, "admin"],
            function (err) {
              if (err) {
                // Potrebbe esserci un errore se 'admin' username esiste già,
                // anche se abbiamo già controllato la presenza di un admin per ruolo.
                // Questo può succedere solo se un utente 'user' si chiama 'admin'.
                console.error(
                  "Errore durante la creazione dell'admin iniziale:",
                  err.message,
                );
              } else {
                console.log(
                  `Utente ${utenteadmin} predefinito creato con successo nome utente ${utenteadmin} e password ${passwordadmin}.`,
                );
              }
            },
          );
        } else {
          // Gestione del messaggio per singolare/plurale
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
    // ---------------------------------------------------
  });
}

initDb();

// ... il resto del tuo codice rimane invariato ...
// Session management (cookie-based, in-memory)
const sessions = {};
function createSession(user) {
  const sid = crypto.randomBytes(16).toString("hex");
  sessions[sid] = { user, created: Date.now() };
  return sid;
}
function getSession(req) {
  const cookies = (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim().split("="));
  const sid = cookies.find(([k]) => k === "sid");
  if (sid && sessions[sid[1]]) return sessions[sid[1]];
  return null;
}
function destroySession(req, res) {
  const cookies = (req.headers.cookie || "")
    .split(";")
    .map((c) => c.trim().split("="));
  const sid = cookies.find(([k]) => k === "sid");
  if (sid) delete sessions[sid[1]];
  res.setHeader("Set-Cookie", "sid=; HttpOnly; Path=/; Max-Age=0");
}

// Serve static files
function serveStatic(req, res) {
  let filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "login.html" : req.url,
  );
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ico": "image/x-icon",
    };
    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

// Main server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  // Static
  if (serveStatic(req, res)) return;

  // Helper per body POST
  function parseBody(cb) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        if (
          req.headers["content-type"] &&
          req.headers["content-type"].includes("application/json")
        ) {
          cb(JSON.parse(body));
        } else {
          // x-www-form-urlencoded
          const params = {};
          body.split("&").forEach((pair) => {
            const [k, v] = pair.split("=");
            if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
          });
          cb(params);
        }
      } catch (e) {
        res.writeHead(400);
        res.end("Bad Request");
      }
    });
  }

  // Auth: login
  if (req.method === "POST" && parsedUrl.pathname === "/login") {
    parseBody(({ username, password }) => {
      db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, user) => {
          if (!user || password !== user.password) {
            res.writeHead(200, { "Content-Type": "text/html" });
            return res.end(
              '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>',
            );
          }
          const sid = createSession({
            id: user.id,
            username: user.username,
            role: user.role,
          });
          res.setHeader("Set-Cookie", `sid=${sid}; HttpOnly; Path=/`);
          res.writeHead(302, {
            Location:
              user.role === "admin"
                ? "/admin_dashboard.html"
                : "/user_dashboard.html",
          });
          res.end();
        },
      );
    });
    return;
  }

  // Auth: register
  if (req.method === "POST" && parsedUrl.pathname === "/register") {
    parseBody(({ username, password, role }) => {
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
      db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, password, userRole],
        function (err) {
          if (err) {
            res.writeHead(400, { "Content-Type": "text/html" });
            return res.end(
              "<script>alert(\"Username già esistente\");window.location='/register.html';</script>",
            );
          }
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("Registrazione avvenuta!");
        },
      );
    });
    return;
  }

  // Auth: logout
  if (req.method === "GET" && parsedUrl.pathname === "/logout") {
    destroySession(req, res);
    res.writeHead(302, { Location: "/login.html" });
    res.end();
    return;
  }

  // API: utenti (admin)
  if (req.url.startsWith("/api/users")) {
    const session = getSession(req);
    if (!session || session.user.role !== "admin") {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    // GET /api/users
    if (req.method === "GET" && parsedUrl.pathname === "/api/users") {
      db.all("SELECT * FROM users", [], (err, users) => {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        // Per ogni utente, prendi i corsi
        let done = 0;
        if (users.length === 0) {
          // Handle case with no users
          res.end(JSON.stringify([]));
          return;
        }
        users.forEach((u) => {
          db.all(
            "SELECT c.* FROM courses c JOIN user_courses uc ON c.id=uc.course_id WHERE uc.user_id=?",
            [u.id],
            (e, courses) => {
              u.courses = courses || [];
              if (++done === users.length) res.end(JSON.stringify(users));
            },
          );
        });
      });
      return;
    }
    // POST /api/users (creazione utente da admin)
    if (req.method === "POST" && parsedUrl.pathname === "/api/users") {
      parseBody(({ username, password, role, course_id }) => {
        let userRole = "user";
        if (
          role === "admin" &&
          session &&
          session.user &&
          session.user.role === "admin"
        ) {
          userRole = "admin";
        }
        db.run(
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          [username, password, userRole],
          function (err) {
            if (err) {
              res.end("Username già esistente");
              return;
            }
            // Se è stato passato un corso e il ruolo è user, associalo
            if (userRole === "user" && course_id) {
              db.run(
                "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
                [this.lastID, course_id],
                function (err2) {
                  if (err2) {
                    res.end("Errore DB");
                    return;
                  }
                  res.end("OK");
                },
              );
            } else {
              res.end("OK");
            }
          },
        );
      });
      return;
    }
    // POST /api/users/:id/promote
    if (
      req.method === "POST" &&
      parsedUrl.pathname.match(/^\/api\/users\/\d+\/promote$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      db.run('UPDATE users SET role="admin" WHERE id=?', [id], function (err) {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        db.run(
          "DELETE FROM user_courses WHERE user_id=?",
          [id],
          function (err2) {
            if (err2) {
              res.writeHead(500);
              res.end("DB error");
              return;
            }
            res.end("OK");
          },
        );
      });
      return;
    }
    // DELETE /api/users/:id
    if (
      req.method === "DELETE" &&
      parsedUrl.pathname.match(/^\/api\/users\/\d+$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      db.get("SELECT * FROM users WHERE id=?", [id], (err, user) => {
        if (user && user.role === "admin") {
          db.get(
            'SELECT COUNT(*) as n FROM users WHERE role="admin"',
            [],
            (e, row) => {
              if (row && row.n <= 1) {
                res.writeHead(400);
                res.end("Non puoi eliminare l'ultimo admin");
                return;
              }
              db.run("DELETE FROM users WHERE id=?", [id], function (err) {
                if (err) {
                  res.writeHead(500);
                  res.end("DB error");
                  return;
                }
                res.end("OK");
              });
            },
          );
        } else {
          db.run("DELETE FROM users WHERE id=?", [id], function (err) {
            if (err) {
              res.writeHead(500);
              res.end("DB error");
              return;
            }
            res.end("OK");
          });
        }
      });
      return;
    }
    // POST /api/users/:id/assign_course (un solo corso per utente)
    if (
      req.method === "POST" &&
      parsedUrl.pathname.match(/^\/api\/users\/\d+\/assign_course$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      parseBody(({ course_id }) => {
        db.run("DELETE FROM user_courses WHERE user_id=?", [id], function () {
          if (!course_id) return res.end("OK"); // Nessun corso selezionato
          db.run(
            "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
            [id, course_id],
            function (err) {
              if (err) {
                res.writeHead(500);
                res.end("DB error");
                return;
              }
              res.end("OK");
            },
          );
        });
      });
      return;
    }
    // POST /api/users/:id/edit (modifica credenziali da admin)
    if (
      req.method === "POST" &&
      parsedUrl.pathname.match(/^\/api\/users\/\d+\/edit$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      parseBody(({ username, password }) => {
        db.get(
          "SELECT * FROM users WHERE username=? AND id!=?",
          [username, id],
          (err, user) => {
            if (user) {
              res.end("Username già esistente");
              return;
            }
            db.run(
              "UPDATE users SET username=?, password=? WHERE id=?",
              [username, password, id],
              function (err) {
                if (err) {
                  res.end("Errore DB");
                  return;
                }
                res.end("OK");
              },
            );
          },
        );
      });
      return;
    }
    // POST /api/users/:id/demote
    if (
      req.method === "POST" &&
      parsedUrl.pathname.match(/^\/api\/users\/\d+\/demote$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      db.get("SELECT * FROM users WHERE id=?", [id], (err, user) => {
        if (!user || user.role !== "admin") {
          res.writeHead(400);
          res.end("Non è un admin");
          return;
        }
        db.get(
          'SELECT COUNT(*) as n FROM users WHERE role="admin"',
          [],
          (e, row) => {
            if (row && row.n <= 1) {
              res.writeHead(400);
              res.end("Non puoi togliere l'ultimo admin");
              return;
            }
            db.run(
              'UPDATE users SET role="user" WHERE id=?',
              [id],
              function (err) {
                if (err) {
                  res.writeHead(500);
                  res.end("DB error");
                  return;
                }
                res.end("OK");
              },
            );
          },
        );
      });
      return;
    }
  }

  // API: corsi (admin)
  if (req.url.startsWith("/api/courses")) {
    const session = getSession(req);
    if (!session || session.user.role !== "admin") {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    // GET /api/courses
    if (req.method === "GET" && parsedUrl.pathname === "/api/courses") {
      db.all("SELECT * FROM courses", [], (err, courses) => {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        res.end(JSON.stringify(courses));
      });
      return;
    }
    // POST /api/courses
    if (req.method === "POST" && parsedUrl.pathname === "/api/courses") {
      parseBody(({ name, description }) => {
        db.run(
          "INSERT INTO courses (name, description) VALUES (?, ?)",
          [name, description],
          function (err) {
            if (err) {
              res.writeHead(400);
              res.end("Nome corso già esistente");
              return;
            }
            res.end("OK");
          },
        );
      });
      return;
    }
    // PUT /api/courses/:id
    if (
      req.method === "PUT" &&
      parsedUrl.pathname.match(/^\/api\/courses\/\d+$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      parseBody(({ name, description }) => {
        db.run(
          "UPDATE courses SET name=?, description=? WHERE id=?",
          [name, description, id],
          function (err) {
            if (err) {
              res.writeHead(400);
              res.end("Errore update corso");
              return;
            }
            res.end("OK");
          },
        );
      });
      return;
    }
    // DELETE /api/courses/:id
    if (
      req.method === "DELETE" &&
      parsedUrl.pathname.match(/^\/api\/courses\/\d+$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      db.run("DELETE FROM courses WHERE id=?", [id], function (err) {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        res.end("OK");
      });
      return;
    }
  }

  // API: orari (admin)
  if (req.url.startsWith("/api/schedules")) {
    const session = getSession(req);
    if (!session || session.user.role !== "admin") {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    // GET /api/schedules + ricerca
    if (req.method === "GET" && parsedUrl.pathname === "/api/schedules") {
      // Filtri: teacher, room, subject
      const { teacher, room, subject } = parsedUrl.query;
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
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        res.end(JSON.stringify(schedules));
      });
      return;
    }
    // POST /api/schedules
    if (req.method === "POST" && parsedUrl.pathname === "/api/schedules") {
      parseBody(
        ({
          course_id,
          teacher,
          room,
          subject,
          day,
          date,
          start_time,
          end_time,
        }) => {
          db.run(
            "INSERT INTO schedules (course_id, teacher, room, subject, day, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              course_id,
              teacher,
              room,
              subject,
              day,
              date,
              start_time,
              end_time,
            ],
            function (err) {
              if (err) {
                res.writeHead(400);
                res.end("Errore inserimento orario");
                return;
              }
              res.end("OK");
            },
          );
        },
      );
      return;
    }
    // PUT /api/schedules/:id
    if (
      req.method === "PUT" &&
      parsedUrl.pathname.match(/^\/api\/schedules\/\d+$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      parseBody(
        ({
          course_id,
          teacher,
          room,
          subject,
          day,
          date,
          start_time,
          end_time,
        }) => {
          db.run(
            "UPDATE schedules SET course_id=?, teacher=?, room=?, subject=?, day=?, date=?, start_time=?, end_time=? WHERE id=?",
            [
              course_id,
              teacher,
              room,
              subject,
              day,
              date,
              start_time,
              end_time,
              id,
            ],
            function (err) {
              if (err) {
                res.writeHead(400);
                res.end("Errore update orario");
                return;
              }
              res.end("OK");
            },
          );
        },
      );
      return;
    }
    // DELETE /api/schedules/:id
    if (
      req.method === "DELETE" &&
      parsedUrl.pathname.match(/^\/api\/schedules\/\d+$/)
    ) {
      const id = parsedUrl.pathname.split("/")[3];
      db.run("DELETE FROM schedules WHERE id=?", [id], function (err) {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        res.end("OK");
      });
      return;
    }
  }

  // Dashboard utente: mostra corsi e orari
  if (req.method === "GET" && parsedUrl.pathname === "/user_dashboard.html") {
    const session = getSession(req);
    if (!session || session.user.role !== "user") {
      res.writeHead(302, { Location: "/login.html" });
      res.end();
      return;
    }
    // Serve la pagina e poi JS farà fetch a /user/courses e /user/schedules
    serveStatic(req, res);
    return;
  }
  // API: corsi utente
  if (req.method === "GET" && parsedUrl.pathname === "/user/courses") {
    const session = getSession(req);
    if (!session || session.user.role !== "user") {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    db.all(
      "SELECT c.* FROM courses c JOIN user_courses uc ON c.id=uc.course_id WHERE uc.user_id=?",
      [session.user.id],
      (err, courses) => {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        res.end(JSON.stringify(courses));
      },
    );
    return;
  }
  // API: orari utente
  if (req.method === "GET" && parsedUrl.pathname === "/user/schedules") {
    const session = getSession(req);
    if (!session || session.user.role !== "user") {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    db.all(
      "SELECT s.*, c.name as course_name FROM schedules s JOIN user_courses uc ON s.course_id=uc.course_id AND uc.user_id=? LEFT JOIN courses c ON s.course_id=c.id",
      [session.user.id],
      (err, schedules) => {
        if (err) {
          res.writeHead(500);
          res.end("DB error");
          return;
        }
        res.end(JSON.stringify(schedules));
      },
    );
    return;
  }

  // Modifica profilo utente
  if (req.method === "POST" && parsedUrl.pathname === "/user/profile") {
    const session = getSession(req);
    if (!session) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    parseBody(({ username, password }) => {
      db.get(
        "SELECT * FROM users WHERE username=? AND id!=?",
        [username, session.user.id],
        (err, user) => {
          if (user) {
            res.end("Username già esistente");
            return;
          }
          db.run(
            "UPDATE users SET username=?, password=? WHERE id=?",
            [username, password, session.user.id],
            function (err) {
              if (err) {
                res.end("Errore DB");
                return;
              }
              // Aggiorna sessione
              session.user.username = username;
              res.end("OK");
            },
          );
        },
      );
    });
    return;
  }

  // Dashboard admin: serve pagina
  if (req.method === "GET" && parsedUrl.pathname === "/admin_dashboard.html") {
    const session = getSession(req);
    if (!session || session.user.role !== "admin") {
      res.writeHead(302, { Location: "/login.html" });
      res.end();
      return;
    }
    serveStatic(req, res);
    return;
  }

  // GET /api/schedules/meta
  if (req.method === "GET" && parsedUrl.pathname === "/api/schedules/meta") {
    const fields = ["teacher", "room", "subject"];
    const results = {};
    let done = 0;

    fields.forEach((field) => {
      db.all(
        `SELECT DISTINCT ${field} FROM schedules ORDER BY ${field}`,
        [],
        (err, rows) => {
          if (err) {
            res.writeHead(500);
            res.end("DB error");
            return;
          }
          results[field] = rows.map((r) => r[field]);
          if (++done === fields.length) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
          }
        },
      );
    });
    return;
  }

  // API: restituisce l'utente loggato
  if (req.method === "GET" && parsedUrl.pathname === "/user/current") {
    const session = getSession(req);
    if (!session) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ username: session.user.username }));
    return;
  }

  // PUT /api/users/:id (modifica credenziali da admin - metodo PUT)
  if (req.method === "PUT" && parsedUrl.pathname.match(/^\/api\/users\/\d+$/)) {
    const id = parsedUrl.pathname.split("/")[3];
    parseBody(({ username, password }) => {
      db.get(
        "SELECT * FROM users WHERE username=? AND id!=?",
        [username, id],
        (err, user) => {
          if (user) {
            res.end("Username già esistente");
            return;
          }
          db.run(
            "UPDATE users SET username=?, password=? WHERE id=?",
            [username, password, id],
            function (err) {
              if (err) {
                res.end("Errore DB");
                return;
              }
              res.end("OK");
            },
          );
        },
      );
    });
    return;
  }

  // PUT /api/courses/:id
  if (
    req.method === "PUT" &&
    parsedUrl.pathname.match(/^\/api\/courses\/\d+$/)
  ) {
    const id = parsedUrl.pathname.split("/")[3];
    parseBody(({ name, description }) => {
      // Check if a course with the new name already exists, excluding the current course being updated
      db.get(
        "SELECT * FROM courses WHERE name = ? AND id != ?",
        [name, id],
        (err, existingCourse) => {
          if (err) {
            res.writeHead(500);
            res.end("DB error");
            return;
          }
          if (existingCourse) {
            res.writeHead(400);
            res.end("Nome corso già esistente"); // Course name already exists
            return;
          }

          // If no existing course with the same name (excluding itself), proceed with the update
          db.run(
            "UPDATE courses SET name=?, description=? WHERE id=?",
            [name, description, id],
            function (err) {
              if (err) {
                res.writeHead(400);
                res.end("Errore update corso"); // Error updating course
                return;
              }
              res.end("OK");
            },
          );
        },
      );
    });
    return;
  }

  // Default: 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
