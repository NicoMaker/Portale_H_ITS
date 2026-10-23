// Schema del database + migrazioni + creazione dell'admin predefinito al primo avvio
//
// Tabelle:
//   users, courses, user_courses      → utenti, corsi, iscrizioni
//   teachers, rooms, subjects         → anagrafiche (una tabella per ciascuna)
//   teacher_subjects                  → quali docenti insegnano quali materie (N:N)
//   schedules                         → orari: riferiscono corso, docente, aula e materia
//                                       tramite chiave esterna; la data vive solo qui
const bcrypt = require("bcryptjs");
const { dbGet, dbAll, dbRun } = require("./database");

const NOME_NON_SPECIFICATO = "Non specificato";

async function creaTabelle() {
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

  // Anagrafiche: nome unico, confronto senza distinzione maiuscole/minuscole
  for (const tabella of ["teachers", "rooms", "subjects"]) {
    await dbRun(`CREATE TABLE IF NOT EXISTS ${tabella} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE
    )`);
  }

  // Relazione docente ↔ materia: chi insegna cosa
  await dbRun(`CREATE TABLE IF NOT EXISTS teacher_subjects (
    teacher_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    PRIMARY KEY (teacher_id, subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  )`);
}

const SQL_CREA_SCHEDULES = (nome) => `CREATE TABLE IF NOT EXISTS ${nome} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    day TEXT NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT
  )`;

// Vecchio schema: schedules aveva teacher/room/subject come testo.
// Le anagrafiche vengono ricavate dai valori esistenti e la tabella ricostruita.
async function migraSchedulesDaTesto() {
  const colonne = await dbAll("PRAGMA table_info(schedules)");
  if (!colonne.some((c) => c.name === "teacher")) return;

  console.log("Migrazione: schedules → anagrafiche docenti/aule/materie...");
  // Le chiavi esterne non si possono cambiare dentro una transazione
  await dbRun("PRAGMA foreign_keys = OFF;");
  try {
    await dbRun("BEGIN");
    const nome = (col) =>
      `COALESCE(NULLIF(TRIM(${col}), ''), '${NOME_NON_SPECIFICATO}')`;
    await dbRun(
      `INSERT OR IGNORE INTO teachers (name) SELECT DISTINCT ${nome("teacher")} FROM schedules`,
    );
    await dbRun(
      `INSERT OR IGNORE INTO rooms (name) SELECT DISTINCT ${nome("room")} FROM schedules`,
    );
    await dbRun(
      `INSERT OR IGNORE INTO subjects (name) SELECT DISTINCT ${nome("subject")} FROM schedules`,
    );
    await dbRun("ALTER TABLE schedules RENAME TO schedules_old");
    await dbRun(SQL_CREA_SCHEDULES("schedules"));
    await dbRun(`INSERT INTO schedules
        (id, course_id, teacher_id, room_id, subject_id, start_time, end_time, day, date)
      SELECT o.id, o.course_id, t.id, r.id, s.id, o.start_time, o.end_time, o.day, o.date
      FROM schedules_old o
      JOIN teachers t ON t.name = ${nome("o.teacher")}
      JOIN rooms r ON r.name = ${nome("o.room")}
      JOIN subjects s ON s.name = ${nome("o.subject")}`);
    await dbRun("DROP TABLE schedules_old");
    await dbRun("COMMIT");
    console.log("Migrazione completata.");
  } catch (err) {
    await dbRun("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await dbRun("PRAGMA foreign_keys = ON;");
  }
}

// Database già esistenti: le coppie docente/materia già presenti negli orari
// diventano "il docente insegna la materia", così nulla risulta incoerente.
async function popolaDocentiMaterieDaOrari() {
  await dbRun(
    `INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id)
     SELECT DISTINCT teacher_id, subject_id FROM schedules`,
  );
}

async function creaIndici() {
  const indici = [
    "CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id)",
    "CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON schedules(teacher_id)",
    "CREATE INDEX IF NOT EXISTS idx_schedules_room ON schedules(room_id)",
    "CREATE INDEX IF NOT EXISTS idx_schedules_subject ON schedules(subject_id)",
    "CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date)",
    "CREATE INDEX IF NOT EXISTS idx_user_courses_course ON user_courses(course_id)",
    "CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject ON teacher_subjects(subject_id)",
  ];
  for (const sql of indici) await dbRun(sql);
}

async function initDb() {
  await dbRun("PRAGMA foreign_keys = ON;");
  console.log("Chiavi esterne abilitate con successo.");

  await creaTabelle();
  await migraSchedulesDaTesto();
  await dbRun(SQL_CREA_SCHEDULES("schedules"));
  await creaIndici();
  await popolaDocentiMaterieDaOrari();

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

module.exports = { initDb, NOME_NON_SPECIFICATO };
