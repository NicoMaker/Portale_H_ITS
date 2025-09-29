const bcrypt = require("bcryptjs");
const { db, initDb } = require("./db");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer))
  );
}

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Funzione per mescolare un array (algoritmo Fisher-Yates)
function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

function randomUsername(role) {
  const firstNames = [
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
  const lastNames = [
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

  const name = getRandomItem(firstNames);
  const surname = getRandomItem(lastNames);
  const randomNum = Math.floor(Math.random() * 9999) + 1;

  if (role === "admin") return `admin.${surname.toLowerCase()}${randomNum}`;
  return `${name.toLowerCase()}.${surname.toLowerCase()}${randomNum}`;
}

function randomCourseName() {
  const topics = [
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
  const levels = [
    "Base",
    "Avanzato",
    "Specialistico",
    "Master",
    "Triennale",
    "Magistrale",
    "Professionale",
  ];
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  return `${getRandomItem(topics)} ${getRandomItem(levels)} ${randomNum}`;
}

function getRandomTimeAndLocation() {
  const teachers = [
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
  const rooms = [
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
  const days = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];

  const startHour = 8 + Math.floor(Math.random() * 10); // 8:00 - 17:00
  const duration = [1, 2, 3][Math.floor(Math.random() * 3)]; // 1, 2 o 3 ore
  const endHour = Math.min(startHour + duration, 20); // Non oltre le 20:00

  // Date casuali distribuite su più mesi
  const month = Math.floor(Math.random() * 5) + 8; // Agosto-Dicembre 2025
  const daysInMonth =
    month === 8
      ? 31
      : month === 9
      ? 30
      : month === 10
      ? 31
      : month === 11
      ? 30
      : 31;
  const day = Math.floor(Math.random() * daysInMonth) + 1;

  return {
    teacher: getRandomItem(teachers),
    room: getRandomItem(rooms),
    start_time: `${String(startHour).padStart(2, "0")}:00`,
    end_time: `${String(endHour).padStart(2, "0")}:00`,
    day: getRandomItem(days),
    date: `2025-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`,
  };
}

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hashed) => {
      if (err) reject(err);
      else resolve(hashed);
    });
  });
}

async function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function getAllQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function populateDatabase() {
  try {
    console.log("📊 Inizializzazione del database...");
    initDb();

    // Parametri da tastiera con validazione
    let numAdmins,
      numStudentsEnrolled,
      numStudentsUnenrolled,
      numCoursesWithStudents,
      numCoursesWithoutStudents,
      schedulesPerCourse;

    do {
      numAdmins = parseInt(
        await ask(
          "Quanti admin casuali vuoi generare (oltre ad Admin principale)? (0-100): "
        )
      );
    } while (isNaN(numAdmins) || numAdmins < 0 || numAdmins > 100);

    do {
      numStudentsEnrolled = parseInt(
        await ask(
          "Quanti studenti vuoi iscrivere a un corso? (0-1000): "
        )
      );
    } while (isNaN(numStudentsEnrolled) || numStudentsEnrolled < 0 || numStudentsEnrolled > 1000);

    do {
      numStudentsUnenrolled = parseInt(
        await ask(
          "Quanti studenti vuoi che NON siano iscritti a un corso? (0-1000): "
        )
      );
    } while (isNaN(numStudentsUnenrolled) || numStudentsUnenrolled < 0 || numStudentsUnenrolled > 1000);

    do {
      numCoursesWithStudents = parseInt(await ask("Quanti corsi vuoi che abbiano studenti iscritti? (0-500): "));
    } while (isNaN(numCoursesWithStudents) || numCoursesWithStudents < 0 || numCoursesWithStudents > 500);

    do {
      numCoursesWithoutStudents = parseInt(await ask("Quanti corsi vuoi che NON abbiano studenti iscritti? (0-500): "));
    } while (isNaN(numCoursesWithoutStudents) || numCoursesWithoutStudents < 0 || numCoursesWithoutStudents > 500);

    do {
      schedulesPerCourse = parseInt(
        await ask("Quanti orari per corso (anche quelli senza studenti)? (1-200): ")
      );
    } while (
      isNaN(schedulesPerCourse) ||
      schedulesPerCourse < 1 ||
      schedulesPerCourse > 200
    );

    rl.close();

    console.log("🗑️  Pulizia database...");

    // Pulizia del database
    await runQuery("DELETE FROM schedules");
    await runQuery("DELETE FROM user_courses");
    await runQuery("DELETE FROM courses");
    await runQuery("DELETE FROM users");

    console.log("👤 Creazione admin...");

    // ADMIN principale con username "Admin" e password "Admin123!"
    const adminHash = await hashPassword("Admin123!");
    await runQuery(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      ["Admin", adminHash, "admin"]
    );

    // Admin casuali (che sono anche docenti con privilegi admin)
    for (let i = 0; i < numAdmins; i++) {
      const uname = randomUsername("admin");
      const hash = await hashPassword("Admin123!");
      await runQuery(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [uname, hash, "admin"]
      );
    }

    console.log("👨‍🎓 Creazione studenti...");

    // Studenti iscritti
    const studentsEnrolledIds = [];
    for (let i = 0; i < numStudentsEnrolled; i++) {
      const uname = randomUsername("user");
      const hash = await hashPassword("User123!");
      const result = await runQuery(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [uname, hash, "user"]
      );
      studentsEnrolledIds.push(result.lastID);
    }

    // Studenti non iscritti
    for (let i = 0; i < numStudentsUnenrolled; i++) {
      const uname = randomUsername("user");
      const hash = await hashPassword("User123!");
      await runQuery(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [uname, hash, "user"]
      );
    }

    console.log("📚 Creazione corsi...");

    // Corsi con studenti
    const coursesWithStudentsIds = [];
    for (let i = 0; i < numCoursesWithStudents; i++) {
      const result = await runQuery("INSERT INTO courses (name, description) VALUES (?, ?)", [
        randomCourseName(),
        "Descrizione del corso generato automaticamente per il sistema di gestione accademico. Include teoria e pratica.",
      ]);
      coursesWithStudentsIds.push(result.lastID);
    }

    // Corsi senza studenti
    for (let i = 0; i < numCoursesWithoutStudents; i++) {
      await runQuery("INSERT INTO courses (name, description) VALUES (?, ?)", [
        randomCourseName(),
        "Descrizione del corso generato automaticamente per il sistema di gestione accademico. Include teoria e pratica.",
      ]);
    }

    console.log("🔗 Assegnazione studenti ai corsi (MAX 1 corso per studente)...");

    // Relazioni studente-corso - DISTRIBUZIONE EQUA solo tra studenti e corsi designati
    if (studentsEnrolledIds.length > 0 && coursesWithStudentsIds.length > 0) {
      for (let i = 0; i < studentsEnrolledIds.length; i++) {
        const courseIndex = i % coursesWithStudentsIds.length; // Distribuzione ciclica
        const selectedCourseId = coursesWithStudentsIds[courseIndex];

        await runQuery(
          "INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)",
          [studentsEnrolledIds[i], selectedCourseId]
        );
      }
      console.log("   ✅ Studenti iscritti ai corsi designati.");
    } else {
      console.log("   ⚠️  Nessun studente o corso designato per l'iscrizione. Nessuna iscrizione creata.");
    }

    console.log("🕒 Creazione orari per TUTTI i corsi...");

    // Lista di materie (ora centralizzata)
    const subjects = [
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
    // Mescola le materie per una distribuzione casuale ma unica
    const shuffledSubjects = shuffle([...subjects]);
    const totalSubjects = shuffledSubjects.length;

    const allCourses = await getAllQuery("SELECT id FROM courses");
    let totalSchedulesCreated = 0;

    for (const course of allCourses) {
      for (let j = 0; j < schedulesPerCourse; j++) {
        const timeAndLocation = getRandomTimeAndLocation();
        const subject = shuffledSubjects[totalSchedulesCreated % totalSubjects];
        
        await runQuery(
          `INSERT INTO schedules (course_id, teacher, room, subject, start_time, end_time, day, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            course.id,
            timeAndLocation.teacher,
            timeAndLocation.room,
            subject,
            timeAndLocation.start_time,
            timeAndLocation.end_time,
            timeAndLocation.day,
            timeAndLocation.date,
          ]
        );
        totalSchedulesCreated++;
        if (totalSchedulesCreated % 500 === 0) {
          console.log(`   📅 Creati ${totalSchedulesCreated} orari...`);
        }
      }
    }

    // Statistiche finali con verifica distribuzione
    const totalUsers = await getAllQuery("SELECT COUNT(*) as count FROM users");
    const totalCourses = await getAllQuery(
      "SELECT COUNT(*) as count FROM courses"
    );
    const totalSchedules = await getAllQuery(
      "SELECT COUNT(*) as count FROM schedules"
    );
    const totalEnrollments = await getAllQuery(
      "SELECT COUNT(*) as count FROM user_courses"
    );
    const studentsCount = await getAllQuery(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    );
    const adminsCount = await getAllQuery(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    );

    // Verifica distribuzione studenti per corso
    const distributionCheck = await getAllQuery(`
      SELECT 
        c.name as course_name,
        c.id as course_id,
        COUNT(uc.user_id) as students_enrolled
      FROM courses c
      LEFT JOIN user_courses uc ON c.id = uc.course_id
      GROUP BY c.id, c.name
      ORDER BY students_enrolled DESC, c.name
    `);

    console.log("\n✅ Database popolato con successo!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👥 Utenti totali: ${totalUsers[0].count}`);
    console.log(
      `   • Admin/Docenti: ${adminsCount[0].count} (incluso Admin principale)`
    );
    console.log(`   • Studenti (role 'user'): ${studentsCount[0].count}`);
    console.log(
      `     - Iscritti a un corso: ${numStudentsEnrolled}`
    );
    console.log(
      `     - Non iscritti a un corso: ${numStudentsUnenrolled}`
    );
    console.log(`📚 Corsi: ${totalCourses[0].count}`);
    console.log(
      `   - Con studenti: ${numCoursesWithStudents}`
    );
    console.log(
      `   - Senza studenti: ${numCoursesWithoutStudents}`
    );
    console.log(
      `🔗 Iscrizioni totali: ${totalEnrollments[0].count} (MAX 1 corso per studente)`
    );
    console.log(
      `🕒 Orari totali: ${totalSchedules[0].count} (${schedulesPerCourse} per corso)`
    );

    // Mostra distribuzione studenti
    console.log("\n📊 DISTRIBUZIONE STUDENTI PER CORSO:");
    console.log("─".repeat(50));
    distributionCheck.forEach((course, index) => {
      const courseNumber = String(index + 1).padStart(2, "0");
      const studentCount = String(course.students_enrolled).padStart(3, " ");
      console.log(
        `${courseNumber}. ${course.course_name
          .substring(0, 40)
          .padEnd(40)} [${studentCount} studenti]`
      );
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🔑 Credenziali predefinite:");
    console.log(
      "   👨‍💼 Admin principale: username='Admin', password='Admin123!'"
    );
    console.log("   👨‍💼 Admin casuali: password='Admin123!'");
    console.log("   👨‍🎓 Studenti (role 'user'): password='User123!'");
    console.log("\n📋 Note importanti:");
    console.log("   • I docenti sono admin con pieni privilegi");
    console.log("   • Gli studenti hanno role 'user' (non 'student')");
    console.log("   • Ogni studente iscritto è assegnato a MASSIMO 1 corso");
    console.log("   • Orari distribuiti su 5 mesi (Agosto-Dicembre 2025)");
    console.log("   • Orari dalle 8:00 alle 20:00, incluso sabato");
    console.log("\n🎯 Database pronto per l'uso!");
  } catch (error) {
    console.error("❌ Errore durante il popolamento del database:", error);
    rl.close();
  }
}

if (require.main === module) {
  populateDatabase();
}