// Schema del database + creazione dell'admin predefinito al primo avvio
const bcrypt = require("bcryptjs");
const { dbGet, dbRun } = require("./database");

async function initDb() {
  await dbRun("PRAGMA foreign_keys = ON;");
  console.log("Chiavi esterne abilitate con successo.");

  await dbRun(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )`);
  await dbRun(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
  )`);
  await dbRun(`CREATE TABLE IF NOT EXISTS user_courses (
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  )`);
  await dbRun(`CREATE TABLE IF NOT EXISTS schedules (
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

  await creaAdminPredefinito();
}

async function creaAdminPredefinito() {
  const row = await dbGet(
    'SELECT COUNT(*) AS count FROM users WHERE role = "admin"',
  );
  if (row.count > 0) {
    console.log(
      "Esiste già un utente 'admin'. Nessun nuovo admin predefinito creato.",
    );
    return;
  }
  const defaultAdminUser = "Admin";
  const defaultAdminPassword = "Admin123!";
  const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
  await dbRun("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
    defaultAdminUser,
    hashedPassword,
    "admin",
  ]);
  console.log(
    `Utente ${defaultAdminUser} predefinito creato con successo (password hashata).`,
  );
}

module.exports = { initDb };
