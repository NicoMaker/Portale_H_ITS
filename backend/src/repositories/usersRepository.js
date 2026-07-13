// Repository utenti: unico punto di accesso alle tabelle `users` e `user_courses`
const { dbGet, dbAll, dbRun } = require("../config/database");

const usersRepository = {
  trovaTutti() {
    return dbAll("SELECT id, username, role FROM users");
  },

  trovaPerId(id) {
    return dbGet("SELECT * FROM users WHERE id=?", [id]);
  },

  trovaPerUsername(username) {
    return dbGet("SELECT * FROM users WHERE username = ?", [username]);
  },

  trovaPerUsernameEsclusoId(username, id) {
    return dbGet("SELECT * FROM users WHERE username=? AND id!=?", [
      username,
      id,
    ]);
  },

  corsiDellUtente(userId) {
    return dbAll(
      "SELECT c.* FROM courses c JOIN user_courses uc ON c.id=uc.course_id WHERE uc.user_id=?",
      [userId],
    );
  },

  async crea(username, hashedPassword, role) {
    const r = await dbRun(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, role],
    );
    return r.lastID;
  },

  aggiornaRuolo(id, role) {
    return dbRun("UPDATE users SET role=? WHERE id=?", [role, id]);
  },

  aggiornaCredenziali(id, username, hashedPassword) {
    if (hashedPassword) {
      return dbRun("UPDATE users SET username=?, password=? WHERE id=?", [
        username,
        hashedPassword,
        id,
      ]);
    }
    return dbRun("UPDATE users SET username=? WHERE id=?", [username, id]);
  },

  elimina(id) {
    return dbRun("DELETE FROM users WHERE id=?", [id]);
  },

  async contaAdmin() {
    const row = await dbGet('SELECT COUNT(*) as n FROM users WHERE role="admin"');
    return row.n;
  },

  rimuoviCorsi(userId) {
    return dbRun("DELETE FROM user_courses WHERE user_id=?", [userId]);
  },

  assegnaCorso(userId, courseId) {
    return dbRun(
      "INSERT OR IGNORE INTO user_courses (user_id, course_id) VALUES (?, ?)",
      [userId, courseId],
    );
  },
};

module.exports = usersRepository;
