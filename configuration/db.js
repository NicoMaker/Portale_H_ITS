const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

// Database setup
const dbDir = path.join(__dirname, "../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new sqlite3.Database(path.join(dbDir, "database.db"));

// Initialize DB and create admin
function initDb() {
  db.serialize(() => {
    // Enable foreign keys
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

    // Create tables
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

    // Check for and create default admin
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
          const defaultAdminUser = "Admin";
          const defaultAdminPassword = "Admin123";
          bcrypt.hash(defaultAdminPassword, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
              console.error(
                "Errore durante l'hashing della password admin:",
                hashErr.message,
              );
              return;
            }
            db.run(
              "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              [defaultAdminUser, hashedPassword, "admin"],
              function (err) {
                if (err) {
                  console.error(
                    "Errore durante la creazione dell'admin iniziale:",
                    err.message,
                  );
                } else {
                  console.log(
                    `Utente ${defaultAdminUser} predefinito creato con successo (password hashata).`,
                  );
                }
              },
            );
          });
        } else {
          console.log(
            `Esiste già un utente 'admin'. Nessun nuovo admin predefinito creato.`,
          );
        }
      },
    );
  });
}

module.exports = {
  db,
  initDb,
};
