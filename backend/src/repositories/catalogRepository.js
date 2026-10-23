// Repository anagrafiche: docenti, aule e materie, ciascuno nella propria tabella.
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

  // Elenco con numero di orari che usano ciascuna voce
  trovaTutti(tabella) {
    const t = tabellaValida(tabella);
    const campo = TABELLE[t].campo;
    return dbAll(
      `SELECT x.id, x.name, COUNT(s.id) AS schedules_count
       FROM ${t} x LEFT JOIN schedules s ON s.${campo} = x.id
       GROUP BY x.id ORDER BY x.name COLLATE NOCASE`,
    );
  },

  trovaPerNome(tabella, name) {
    return dbGet(`SELECT id, name FROM ${tabellaValida(tabella)} WHERE name = ?`, [
      name,
    ]);
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
};

module.exports = catalogRepository;
