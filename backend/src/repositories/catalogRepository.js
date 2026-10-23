// Repository anagrafiche: docenti, aule e materie, ciascuno nella propria tabella,
// più la relazione docente ↔ materia (teacher_subjects).
// Il nome della tabella proviene sempre da questa whitelist, mai dall'input utente.
const { dbGet, dbAll, dbRun } = require("../config/database");

const TABELLE = {
  teachers: { etichetta: "docente", campo: "teacher_id" },
  rooms: { etichetta: "aula", campo: "room_id" },
  subjects: { etichetta: "materia", campo: "subject_id" },
};

function tabellaValida(tabella) {
  if (!TABELLE[tabella]) throw new Error(`Anagrafica sconosciuta: ${tabella}`);
  return tabella;
}

const catalogRepository = {
  TABELLE,

  // Elenco con numero di orari che usano ciascuna voce.
  // Docenti e materie includono anche la relazione (subject_ids/teacher_ids).
  async trovaTutti(tabella) {
    const t = tabellaValida(tabella);
    const campo = TABELLE[t].campo;
    const righe = await dbAll(
      `SELECT x.id, x.name, COUNT(s.id) AS schedules_count
       FROM ${t} x LEFT JOIN schedules s ON s.${campo} = x.id
       GROUP BY x.id ORDER BY x.name COLLATE NOCASE`,
    );
    if (t === "rooms") return righe;

    const [chiave, altra] =
      t === "teachers"
        ? ["teacher_id", "subject_id"]
        : ["subject_id", "teacher_id"];
    const nomeAltra = t === "teachers" ? "subjects" : "teachers";
    const legami = await dbAll(
      `SELECT ts.teacher_id, ts.subject_id, o.name AS altro_nome
       FROM teacher_subjects ts JOIN ${nomeAltra} o ON o.id = ts.${altra}
       ORDER BY o.name COLLATE NOCASE`,
    );
    const perId = new Map(righe.map((r) => [r.id, []]));
    for (const l of legami) perId.get(l[chiave])?.push(l);
    const campoIds = t === "teachers" ? "subject_ids" : "teacher_ids";
    const campoNomi = t === "teachers" ? "subject_names" : "teacher_names";
    return righe.map((r) => ({
      ...r,
      [campoIds]: perId.get(r.id).map((l) => l[altra]),
      [campoNomi]: perId.get(r.id).map((l) => l.altro_nome),
    }));
  },

  trovaPerId(tabella, id) {
    return dbGet(`SELECT id, name FROM ${tabellaValida(tabella)} WHERE id = ?`, [
      id,
    ]);
  },

  trovaPerNome(tabella, name) {
    return dbGet(
      `SELECT id, name FROM ${tabellaValida(tabella)} WHERE name = ?`,
      [name],
    );
  },

  // Ritorna { id, name, creato }: riusa la voce esistente (nome senza maiuscole/minuscole)
  async trovaOCrea(tabella, name) {
    const t = tabellaValida(tabella);
    const esistente = await dbGet(`SELECT id, name FROM ${t} WHERE name = ?`, [
      name,
    ]);
    if (esistente) return { ...esistente, creato: false };
    const r = await dbRun(`INSERT INTO ${t} (name) VALUES (?)`, [name]);
    return { id: r.lastID, name, creato: true };
  },

  async rinomina(tabella, id, name) {
    const r = await dbRun(
      `UPDATE ${tabellaValida(tabella)} SET name = ? WHERE id = ?`,
      [name, id],
    );
    return r.changes;
  },

  async elimina(tabella, id) {
    const r = await dbRun(
      `DELETE FROM ${tabellaValida(tabella)} WHERE id = ?`,
      [id],
    );
    return r.changes;
  },

  async contaOrari(tabella, id) {
    const t = tabellaValida(tabella);
    const r = await dbGet(
      `SELECT COUNT(*) AS n FROM schedules WHERE ${TABELLE[t].campo} = ?`,
      [id],
    );
    return r.n;
  },

  // ── Relazione docente ↔ materia ──
  legamiDocente(teacherId) {
    return dbAll(
      "SELECT subject_id FROM teacher_subjects WHERE teacher_id = ?",
      [teacherId],
    ).then((r) => r.map((x) => x.subject_id));
  },

  legamiMateria(subjectId) {
    return dbAll(
      "SELECT teacher_id FROM teacher_subjects WHERE subject_id = ?",
      [subjectId],
    ).then((r) => r.map((x) => x.teacher_id));
  },

  async insegna(teacherId, subjectId) {
    const r = await dbGet(
      "SELECT 1 AS ok FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?",
      [teacherId, subjectId],
    );
    return !!r;
  },

  collega(teacherId, subjectId) {
    return dbRun(
      "INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)",
      [teacherId, subjectId],
    );
  },

  scollega(teacherId, subjectId) {
    return dbRun(
      "DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?",
      [teacherId, subjectId],
    );
  },

  async orariDellaCoppia(teacherId, subjectId) {
    const r = await dbGet(
      "SELECT COUNT(*) AS n FROM schedules WHERE teacher_id = ? AND subject_id = ?",
      [teacherId, subjectId],
    );
    return r.n;
  },

  async contaEsistenti(tabella, ids) {
    if (!ids.length) return 0;
    const r = await dbGet(
      `SELECT COUNT(*) AS n FROM ${tabellaValida(tabella)}
       WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    return r.n;
  },
};

module.exports = catalogRepository;
