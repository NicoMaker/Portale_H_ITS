// Repository orari: unico punto di accesso alla tabella `schedules`
const { dbGet, dbAll, dbRun } = require("../config/database");

const schedulesRepository = {
  // Ricerca con filtri LIKE su docente/aula/materia
  cerca({ teacher, room, subject } = {}) {
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
    return dbAll(query, params);
  },

  trovaPerUtente(userId) {
    return dbAll(
      "SELECT s.*, c.name as course_name FROM schedules s JOIN user_courses uc ON s.course_id=uc.course_id AND uc.user_id=? LEFT JOIN courses c ON s.course_id=c.id",
      [userId],
    );
  },

  trovaCourseId(scheduleId) {
    return dbGet("SELECT course_id FROM schedules WHERE id=?", [scheduleId]);
  },

  async crea({ course_id, teacher, room, subject, day, date, start_time, end_time }) {
    const r = await dbRun(
      "INSERT INTO schedules (course_id, teacher, room, subject, day, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [course_id, teacher, room, subject, day, date, start_time, end_time],
    );
    return r.lastID;
  },

  aggiorna(id, { course_id, teacher, room, subject, day, date, start_time, end_time }) {
    return dbRun(
      "UPDATE schedules SET course_id=?, teacher=?, room=?, subject=?, day=?, date=?, start_time=?, end_time=? WHERE id=?",
      [course_id, teacher, room, subject, day, date, start_time, end_time, id],
    );
  },

  elimina(id) {
    return dbRun("DELETE FROM schedules WHERE id=?", [id]);
  },

  async valoriDistinti(field) {
    // `field` proviene da una whitelist nel service, mai dall'input utente
    const rows = await dbAll(
      `SELECT DISTINCT ${field} FROM schedules ORDER BY ${field}`,
    );
    return rows.map((r) => r[field]);
  },
};

module.exports = schedulesRepository;
