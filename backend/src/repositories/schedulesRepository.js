// Repository orari: unico punto di accesso alla tabella `schedules`
// (con join sulle anagrafiche docenti/aule/materie e sui corsi).
const { dbGet, dbAll, dbRun } = require("../config/database");

// Gli orari escono sempre con i nomi risolti, così il frontend non cambia contratto
const SELECT_ORARI = `
  SELECT s.id, s.course_id, s.teacher_id, s.room_id, s.subject_id,
         t.name AS teacher, r.name AS room, sub.name AS subject,
         s.start_time, s.end_time, s.day, s.date,
         c.name AS course_name
  FROM schedules s
  JOIN teachers t ON t.id = s.teacher_id
  JOIN rooms r ON r.id = s.room_id
  JOIN subjects sub ON sub.id = s.subject_id
  LEFT JOIN courses c ON c.id = s.course_id`;

const schedulesRepository = {
  // Ricerca con filtri LIKE su docente/aula/materia
  cerca({ teacher, room, subject } = {}) {
    let query = `${SELECT_ORARI} WHERE 1=1`;
    const params = [];
    if (teacher) {
      query += " AND t.name LIKE ?";
      params.push(`%${teacher}%`);
    }
    if (room) {
      query += " AND r.name LIKE ?";
      params.push(`%${room}%`);
    }
    if (subject) {
      query += " AND sub.name LIKE ?";
      params.push(`%${subject}%`);
    }
    query += " ORDER BY s.date, s.start_time, s.id";
    return dbAll(query, params);
  },

  trovaPerUtente(userId) {
    return dbAll(
      `${SELECT_ORARI}
       JOIN user_courses uc ON uc.course_id = s.course_id AND uc.user_id = ?
       ORDER BY s.date, s.start_time, s.id`,
      [userId],
    );
  },

  trovaCourseId(scheduleId) {
    return dbGet("SELECT course_id FROM schedules WHERE id=?", [scheduleId]);
  },

  async crea({
    course_id,
    teacher_id,
    room_id,
    subject_id,
    day,
    date,
    start_time,
    end_time,
  }) {
    const r = await dbRun(
      `INSERT INTO schedules
        (course_id, teacher_id, room_id, subject_id, day, date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        teacher_id,
        room_id,
        subject_id,
        day,
        date,
        start_time,
        end_time,
      ],
    );
    return r.lastID;
  },

  aggiorna(
    id,
    {
      course_id,
      teacher_id,
      room_id,
      subject_id,
      day,
      date,
      start_time,
      end_time,
    },
  ) {
    return dbRun(
      `UPDATE schedules SET course_id=?, teacher_id=?, room_id=?, subject_id=?,
         day=?, date=?, start_time=?, end_time=? WHERE id=?`,
      [
        course_id,
        teacher_id,
        room_id,
        subject_id,
        day,
        date,
        start_time,
        end_time,
        id,
      ],
    );
  },

  elimina(id) {
    return dbRun("DELETE FROM schedules WHERE id=?", [id]);
  },
};

module.exports = schedulesRepository;
