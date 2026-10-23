// Repository corsi: unico punto di accesso alla tabella `courses`
const { dbGet, dbAll, dbRun } = require("../config/database");

const coursesRepository = {
  trovaTutti() {
    return dbAll("SELECT * FROM courses ORDER BY name");
  },

  trovaPerNomeEsclusoId(name, id) {
    return dbGet("SELECT * FROM courses WHERE name = ? AND id != ?", [
      name,
      id,
    ]);
  },

  async crea(name, description) {
    const r = await dbRun(
      "INSERT INTO courses (name, description) VALUES (?, ?)",
      [name, description],
    );
    return r.lastID;
  },

  aggiorna(id, name, description) {
    return dbRun("UPDATE courses SET name=?, description=? WHERE id=?", [
      name,
      description,
      id,
    ]);
  },

  elimina(id) {
    return dbRun("DELETE FROM courses WHERE id=?", [id]);
  },
};

module.exports = coursesRepository;
