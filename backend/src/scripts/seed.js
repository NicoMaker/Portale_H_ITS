// Popolamento del database con dati di esempio.
//
// Uso interattivo:   npm run seed
// Uso non interattivo (qualsiasi parametro omesso viene chiesto a terminale):
//   node src/scripts/seed.js --admins=2 --enrolled=40 --unenrolled=10 \
//        --courses-with=4 --courses-without=2 --per-course=15 [--year=2026]
//   node src/scripts/seed.js --defaults        (valori di default, nessuna domanda)
//
// Docenti, aule e materie vengono scritti nelle rispettive tabelle (teachers, rooms,
// subjects) e gli orari le referenziano per id.
const bcrypt = require("bcryptjs");
const readline = require("readline");
const { db, dbRun, dbAll } = require("../config/database");
const { initDb } = require("../config/schema");

// ── Parametri da riga di comando ──────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const [k, v] = a.slice(2).split("=");
      return [k, v === undefined ? true : v];
    }),
);

const DEFAULTS = {
  admins: 3,
  enrolled: 40,
  unenrolled: 10,
  "courses-with": 4,
  "courses-without": 2,
  "per-course": 15,
};

let rl = null;
function ask(question) {
  rl ??= readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(question, resolve));
}

// Legge un intero: prima dagli argomenti, poi da --defaults, altrimenti chiede
async function leggiNumero(chiave, domanda, min, max) {
  const daArg = args[chiave] !== undefined ? parseInt(args[chiave], 10) : NaN;
  if (!Number.isNaN(daArg) && daArg >= min && daArg <= max) return daArg;
  if (args.defaults) return Math.min(Math.max(DEFAULTS[chiave], min), max);
  let n;
  do {
    n = parseInt(await ask(`${domanda} (${min}-${max}): `), 10);
  } while (Number.isNaN(n) || n < min || n > max);
  return n;
}

// ── Utilità ───────────────────────────────────────────────────────────────────
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Mescola un array (Fisher-Yates)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Rimuove caratteri invisibili e spazi in eccesso
function cleanString(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Lunedì dell'Angelo (Pasquetta) con l'algoritmo gregoriano anonimo
function pasquetta(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDate(new Date(year, month - 1, day + 1));
}

// Giorni festivi italiani dell'anno indicato
function festivi(year) {
  const fissi = ["01-01", "01-06", "04-25", "05-01", "06-02", "08-15", "11-01", "12-08", "12-25", "12-26", "12-31"];
  return new Set([...fissi.map((d) => `${year}-${d}`), pasquetta(year)]);
}

// ── Dati di esempio ───────────────────────────────────────────────────────────
const NOMI = [
"Mario",
"Giulia",
"Luca",
"Sara",
"Marco",
"Elena",
"Francesco",
"Chiara",
"Paolo",
"Laura",
"Giorgio",
"Valentina",
"Andrea",
"Martina",
"Davide",
"Simona",
"Pietro",
"Alice",
"Matteo",
"Isabella",
"Antonio",
"Francesca",
"Giuseppe",
"Anna",
"Alessandro",
"Maria",
"Roberto",
"Giulio",
"Claudia",
"Stefano",
"Silvia",
"Federico",
"Elisabetta",
"Riccardo",
"Cristina",
  ];
const COGNOMI = [
"Rossi",
"Bianchi",
"Verdi",
"Neri",
"Gialli",
"Blu",
"Viola",
"Grigi",
"Marroni",
"Argento",
"Ferrari",
"Conti",
"De Luca",
"Lombardi",
"Moretti",
"Marchetti",
"Serra",
"Gentile",
"Barbieri",
"Santoro",
"Romano",
"Gallo",
"Costa",
"Ricci",
"Fontana",
"Esposito",
"Russo",
"Villa",
"Colombo",
"Marino",
"Greco",
"Bruno",
"Galli",
"Leone",
"Longo",
"Giordano",
"Mancini",
  ];
const ARGOMENTI = [
"Informatica",
"Ingegneria del Software",
"Data Science",
"Cybersecurity",
"Web Development",
"Intelligenza Artificiale",
"Blockchain",
"Cloud Computing",
"UX/UI Design",
"Game Development",
"Big Data Analytics",
"Robotica",
"IoT",
"Bioinformatica",
"Machine Learning",
"DevOps",
"Mobile Development",
"Computer Graphics",
"Networking",
"Database Management",
"Software Testing",
"Computer Vision",
"Natural Language Processing",
"Quantum Computing",
"Algoritmi Avanzati",
"Sicurezza delle Reti",
"Programmazione Web",
"Analisi dei Dati",
"Sistemi Distribuiti",
"Architettura Software",
  ];
const LIVELLI = [
"Base",
"Avanzato",
"Specialistico",
"Master",
"Triennale",
"Magistrale",
"Professionale",
  ];
const DOCENTI = [
"Prof. Smith",
"Prof. Johnson",
"Prof. Garcia",
"Prof. Miller",
"Prof. Davis",
"Prof. Rossi",
"Prof. Bianchi",
"Prof. Verdi",
"Prof. Neri",
"Prof. Bruno",
"Prof. Ferrari",
"Prof. Romano",
"Prof. Gallo",
"Prof. Conti",
"Prof. Ricci",
"Prof. Lombardi",
"Prof. Moretti",
"Prof. Marchetti",
"Prof. Serra",
"Prof. Gentile",
"Prof. Barbieri",
"Prof. Santoro",
"Prof. Costa",
"Prof. Fontana",
"Prof. Esposito",
"Prof. Villa",
"Prof. Colombo",
"Prof. Marino",
"Prof. Greco",
"Prof. Leone",
  ];
const AULE = [
"Aula A101",
"Aula A102",
"Aula A103",
"Aula B201",
"Aula B202",
"Aula B203",
"Lab Informatica 1",
"Lab Informatica 2",
"Lab Informatica 3",
"Aula C301",
"Aula C302",
"Aula C303",
"Lab Software",
"Lab AI",
"Lab Machine Learning",
"Aula D401",
"Aula D402",
"Aula D403",
"Lab Sicurezza",
"Lab Networking",
"Aula E501",
"Aula E502",
"Lab Robotica",
"Lab Database",
"Lab Cloud",
"Aula Magna",
"Sala Conferenze A",
"Sala Conferenze B",
"Aula F601",
"Aula F602",
  ];
const MATERIE = [
  "Programmazione",
  "Algoritmi e Strutture Dati",
  "Database",
  "Machine Learning",
  "Sicurezza Informatica",
  "Frontend Development",
  "Backend Development",
  "Gestione Progetti",
  "Cloud Computing",
  "DevOps",
  "Data Analysis",
  "Computer Graphics",
  "Networking",
  "Software Engineering",
  "AI Ethics",
  "Cybersecurity",
  "Web Design",
  "Mobile Programming",
  "Game Design",
  "Computer Vision",
  "NLP",
  "Blockchain",
  "IoT",
  "Robotica",
  "Big Data",
  "UX Design",
  "System Administration",
  "Software Testing",
  "Quantum Computing",
];

const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const DESCRIZIONE_CORSO =
  "Descrizione del corso generato automaticamente per il sistema di gestione accademico. Include teoria e pratica.";

// Generatori di nomi unici (le colonne username e name hanno vincolo UNIQUE)
function generatoreUnico(creaNome) {
  const usati = new Set();
  return (...a) => {
    for (let tentativi = 0; tentativi < 1000; tentativi++) {
      const nome = creaNome(...a);
      if (!usati.has(nome.toLowerCase())) {
        usati.add(nome.toLowerCase());
        return nome;
      }
    }
    throw new Error("Impossibile generare un nome univoco: riduci le quantità richieste");
  };
}

const randomUsername = generatoreUnico((role) => {
  const cognome = getRandomItem(COGNOMI).toLowerCase().replace(/\s+/g, "");
  const num = Math.floor(Math.random() * 99999) + 1;
  if (role === "admin") return `admin.${cognome}${num}`;
  return `${getRandomItem(NOMI).toLowerCase()}.${cognome}${num}`;
});

const randomCourseName = generatoreUnico(
  () =>
    `${getRandomItem(ARGOMENTI)} ${getRandomItem(LIVELLI)} ${Math.floor(Math.random() * 9999) + 1}`,
);

// Data casuale feriale e non festiva tra agosto e dicembre
function randomDataLavorativa(year) {
  const holidays = festivi(year);
  for (;;) {
    const month = Math.floor(Math.random() * 5) + 8; // 8 = agosto … 12 = dicembre
    const daysInMonth = new Date(year, month, 0).getDate();
    const d = new Date(year, month - 1, Math.floor(Math.random() * daysInMonth) + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6 && !holidays.has(isoDate(d))) {
      return { date: isoDate(d), day: GIORNI[dow] };
    }
  }
}

function randomOrario() {
  const startHour = 8 + Math.floor(Math.random() * 10);
  const endHour = Math.min(startHour + getRandomItem([1, 2, 3]), 20);
  return { start_time: `${pad(startHour)}:00`, end_time: `${pad(endHour)}:00` };
}

// Inserisce una lista di nomi nella tabella indicata e ritorna gli id creati
async function inserisciAnagrafica(tabella, nomi) {
  const ids = [];
  for (const nome of nomi) {
    const r = await dbRun(`INSERT INTO ${tabella} (name) VALUES (?)`, [cleanString(nome)]);
    ids.push(r.lastID);
  }
  return ids;
}

async function contaRighe(tabella, where = "") {
  const [r] = await dbAll(`SELECT COUNT(*) AS count FROM ${tabella} ${where}`);
  return r.count;
}

async function populateDatabase() {
  try {
    console.log("📊 Inizializzazione del database...");
    await initDb();

    const numAdmins = await leggiNumero("admins", "Quanti admin casuali vuoi generare (oltre ad Admin principale)?", 0, 100);
    const numStudentsEnrolled = await leggiNumero("enrolled", "Quanti studenti vuoi iscrivere a un corso?", 0, 1000);
    const numStudentsUnenrolled = await leggiNumero("unenrolled", "Quanti studenti vuoi che NON siano iscritti a un corso?", 0, 1000);
    const numCoursesWithStudents = await leggiNumero("courses-with", "Quanti corsi vuoi che abbiano studenti iscritti?", 0, 500);
    const numCoursesWithoutStudents = await leggiNumero("courses-without", "Quanti corsi vuoi che NON abbiano studenti iscritti?", 0, 500);
    const schedulesPerCourse = await leggiNumero("per-course", "Quanti orari per corso (anche quelli senza studenti)?", 1, 200);
    rl?.close();

    if (numStudentsEnrolled > 0 && numCoursesWithStudents === 0) {
      console.log("   ⚠️  Studenti da iscrivere ma nessun corso con iscritti: nessuna iscrizione verrà creata.");
    }

    const year = parseInt(args.year, 10) || new Date().getFullYear();

    console.log("🗑️  Pulizia database...");
    await dbRun("PRAGMA foreign_keys = ON;");
    for (const t of ["schedules", "user_courses", "courses", "users", "teachers", "rooms", "subjects"]) {
      await dbRun(`DELETE FROM ${t}`);
    }
    await dbRun(
      "DELETE FROM sqlite_sequence WHERE name IN ('schedules','courses','users','teachers','rooms','subjects')",
    );

    // Tutto il popolamento in una sola transazione: molto più veloce e coerente
    await dbRun("BEGIN");

    // Una sola hash per password: bcrypt è lento e per dati di esempio basta
    console.log("🔐 Calcolo hash password...");
    const adminHash = await bcrypt.hash("Admin123!", 10);
    const userHash = await bcrypt.hash("User123!", 10);
    const insUser = (username, hash, role) =>
      dbRun("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role]);

    console.log("👤 Creazione admin...");
    await insUser("Admin", adminHash, "admin");
    for (let i = 0; i < numAdmins; i++) await insUser(randomUsername("admin"), adminHash, "admin");

    console.log("👨‍🎓 Creazione studenti...");
    const studentsEnrolledIds = [];
    for (let i = 0; i < numStudentsEnrolled; i++) {
      studentsEnrolledIds.push((await insUser(randomUsername("user"), userHash, "user")).lastID);
    }
    for (let i = 0; i < numStudentsUnenrolled; i++) await insUser(randomUsername("user"), userHash, "user");

    console.log("📚 Creazione corsi...");
    const coursesWithStudentsIds = [];
    const insCourse = (name) =>
      dbRun("INSERT INTO courses (name, description) VALUES (?, ?)", [name, DESCRIZIONE_CORSO]);
    for (let i = 0; i < numCoursesWithStudents; i++) {
      coursesWithStudentsIds.push((await insCourse(randomCourseName())).lastID);
    }
    for (let i = 0; i < numCoursesWithoutStudents; i++) await insCourse(randomCourseName());

    console.log("🔗 Assegnazione studenti ai corsi (MAX 1 corso per studente)...");
    if (studentsEnrolledIds.length && coursesWithStudentsIds.length) {
      for (let i = 0; i < studentsEnrolledIds.length; i++) {
        await dbRun("INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)", [
          studentsEnrolledIds[i],
          coursesWithStudentsIds[i % coursesWithStudentsIds.length],
        ]);
      }
      console.log("   ✅ Studenti iscritti ai corsi designati.");
    }

    console.log("🏷️  Creazione anagrafiche (docenti, aule, materie)...");
    const teacherIds = await inserisciAnagrafica("teachers", DOCENTI);
    const roomIds = await inserisciAnagrafica("rooms", AULE);
    const subjectIds = await inserisciAnagrafica("subjects", MATERIE);

    console.log("🕒 Creazione orari per TUTTI i corsi...");
    const allCourses = await dbAll("SELECT id FROM courses");
    const materieMescolate = shuffle([...subjectIds]);
    let totale = 0;
    for (const course of allCourses) {
      for (let j = 0; j < schedulesPerCourse; j++) {
        const { date, day } = randomDataLavorativa(year);
        const { start_time, end_time } = randomOrario();
        await dbRun(
          `INSERT INTO schedules (course_id, teacher_id, room_id, subject_id, start_time, end_time, day, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            course.id,
            getRandomItem(teacherIds),
            getRandomItem(roomIds),
            materieMescolate[totale % materieMescolate.length],
            start_time,
            end_time,
            day,
            date,
          ],
        );
        totale++;
        if (totale % 500 === 0) console.log(`   📅 Creati ${totale} orari...`);
      }
    }
    await dbRun("COMMIT");

    const [utenti, admin, studenti, corsi, orari, iscrizioni, docenti, aule, materie] = await Promise.all([
      contaRighe("users"),
      contaRighe("users", "WHERE role = 'admin'"),
      contaRighe("users", "WHERE role = 'user'"),
      contaRighe("courses"),
      contaRighe("schedules"),
      contaRighe("user_courses"),
      contaRighe("teachers"),
      contaRighe("rooms"),
      contaRighe("subjects"),
    ]);

    const distribuzione = await dbAll(`
      SELECT c.name AS course_name, COUNT(uc.user_id) AS students_enrolled
      FROM courses c LEFT JOIN user_courses uc ON c.id = uc.course_id
      GROUP BY c.id, c.name ORDER BY students_enrolled DESC, c.name`);

    console.log("\n✅ Database popolato con successo!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👥 Utenti totali: ${utenti}`);
    console.log(`   • Admin/Docenti: ${admin} (incluso Admin principale)`);
    console.log(`   • Studenti (role 'user'): ${studenti}`);
    console.log(`     - Iscritti a un corso: ${studentsEnrolledIds.length ? numStudentsEnrolled : 0}`);
    console.log(`     - Non iscritti a un corso: ${numStudentsUnenrolled + (studentsEnrolledIds.length ? 0 : numStudentsEnrolled)}`);
    console.log(`📚 Corsi: ${corsi} (con studenti: ${numCoursesWithStudents}, senza: ${numCoursesWithoutStudents})`);
    console.log(`🔗 Iscrizioni totali: ${iscrizioni} (MAX 1 corso per studente)`);
    console.log(`🏷️  Anagrafiche: ${docenti} docenti, ${aule} aule, ${materie} materie`);
    console.log(`🕒 Orari totali: ${orari} (${schedulesPerCourse} per corso)`);
    console.log("\n📊 DISTRIBUZIONE STUDENTI PER CORSO:");
    console.log("─".repeat(50));
    distribuzione.forEach((c, i) => {
      console.log(
        `${String(i + 1).padStart(2, "0")}. ${c.course_name.substring(0, 40).padEnd(40)} [${String(c.students_enrolled).padStart(3)} studenti]`,
      );
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔑 Credenziali predefinite:");
    console.log("   👨‍💼 Admin principale: username='Admin', password='Admin123!'");
    console.log("   👨‍💼 Admin casuali: password='Admin123!'");
    console.log("   👨‍🎓 Studenti (role 'user'): password='User123!'");
    console.log("\n📋 Note importanti:");
    console.log("   • I docenti dell'anagrafica sono nomi, non account: gli account admin gestiscono il portale");
    console.log("   • Gli studenti hanno role 'user' (non 'student')");
    console.log("   • Ogni studente iscritto è assegnato a MASSIMO 1 corso");
    console.log(`   • Orari distribuiti su 5 mesi (Agosto-Dicembre ${year}), solo giorni lavorativi non festivi`);
    console.log("\n🎯 Database pronto per l'uso!");
  } catch (error) {
    console.error("❌ Errore critico durante il popolamento del database:", error.message);
    await dbRun("ROLLBACK").catch(() => {});
    process.exitCode = 1;
  } finally {
    rl?.close();
    db.close();
  }
}

if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase };
