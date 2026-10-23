// Service anagrafiche (docenti, aule, materie): validazione, relazione
// docente ↔ materia, regole di eliminazione ed eventi realtime
const catalogRepository = require("../repositories/catalogRepository");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const MAX_LUNGHEZZA = 120;

// Articoli italiani per i messaggi d'errore (docente / aula / materia)
const ARTICOLO = {
  docente: { indef: "un", nessun: "Nessun" },
  aula: { indef: "un'", nessun: "Nessuna" },
  materia: { indef: "una", nessun: "Nessuna" },
};

function pulisciNome(valore, etichetta) {
  const nome =
    typeof valore === "string" ? valore.trim().replace(/\s+/g, " ") : "";
  if (!nome) throw new HttpError(400, `Il campo ${etichetta} è obbligatorio`);
  if (nome.length > MAX_LUNGHEZZA)
    throw new HttpError(400, `Il campo ${etichetta} è troppo lungo`);
  return nome;
}

function idValido(valore) {
  const n = Number(valore);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, "ID non valido");
  return n;
}

// Normalizza un array di id ricevuto dal client (senza duplicati)
function elencoId(valore) {
  if (valore === undefined || valore === null) return null;
  if (!Array.isArray(valore)) throw new HttpError(400, "Elenco ID non valido");
  return [...new Set(valore.map(idValido))];
}

function notifica(tabella, azione) {
  realtime.broadcast("catalog_updated", { catalog: tabella, action: azione });
  // Le pagine che mostrano gli orari devono rileggere nomi e relazioni
  realtime.broadcast("schedules_updated", { action: "catalog", catalog: tabella });
}

// Differenza tra coppie attuali e desiderate: prima controlla, poi scrive
async function applicaCoppie(attuali, nuove) {
  const chiave = ([t, s]) => `${t}:${s}`;
  const setAttuali = new Set(attuali.map(chiave));
  const setNuove = new Set(nuove.map(chiave));
  const daTogliere = attuali.filter((c) => !setNuove.has(chiave(c)));
  const daAggiungere = nuove.filter((c) => !setAttuali.has(chiave(c)));

  for (const [t, s] of daTogliere) {
    const n = await catalogRepository.orariDellaCoppia(t, s);
    if (n > 0) {
      throw new HttpError(
        400,
        `Impossibile togliere l'associazione: esistono ${n} ${n === 1 ? "orario" : "orari"} con questo docente e questa materia.`,
      );
    }
  }
  for (const [t, s] of daTogliere) await catalogRepository.scollega(t, s);
  for (const [t, s] of daAggiungere) await catalogRepository.collega(t, s);
}

const catalogService = {
  lista(tabella) {
    return catalogRepository.trovaTutti(tabella);
  },

  // Riusa la voce se esiste già, altrimenti la crea. Ritorna { id, name, creato }.
  async risolvi(tabella, valore) {
    const { etichetta } = catalogRepository.TABELLE[tabella];
    const nome = pulisciNome(valore, etichetta);
    return catalogRepository.trovaOCrea(tabella, nome);
  },

  // Verifica che la voce esista (per id) e la ritorna
  async richiedi(tabella, id) {
    const voce = await catalogRepository.trovaPerId(tabella, idValido(id));
    if (!voce) {
      const { etichetta } = catalogRepository.TABELLE[tabella];
      throw new HttpError(404, `${ARTICOLO[etichetta].nessun} ${etichetta} con questo ID`);
    }
    return voce;
  },

  // Crea una nuova voce; se esiste già con lo stesso nome ritorna quella esistente.
  // `dati` = { name, subject_ids? (docenti), teacher_ids? (materie) }
  async crea(tabella, dati = {}) {
    const voce = await this.risolvi(tabella, dati.name);
    if (tabella === "teachers" && dati.subject_ids !== undefined) {
      await this.impostaMaterieDocente(voce.id, dati.subject_ids, true);
    }
    if (tabella === "subjects" && dati.teacher_ids !== undefined) {
      await this.impostaDocentiMateria(voce.id, dati.teacher_ids, true);
    }
    if (voce.creato) notifica(tabella, "created");
    return voce;
  },

  // Modifica nome ed eventuale relazione
  async aggiorna(tabella, id, dati = {}) {
    const { etichetta } = catalogRepository.TABELLE[tabella];
    const esistente = await this.richiedi(tabella, id);
    const nome = pulisciNome(dati.name, etichetta);

    const omonimo = await catalogRepository.trovaPerNome(tabella, nome);
    if (omonimo && omonimo.id !== esistente.id) {
      throw new HttpError(
        400,
        `Esiste già ${ARTICOLO[etichetta].indef}${etichetta === "aula" ? "" : " "}${etichetta} con questo nome`,
      );
    }
    await catalogRepository.rinomina(tabella, esistente.id, nome);

    if (tabella === "teachers" && dati.subject_ids !== undefined) {
      await this.impostaMaterieDocente(esistente.id, dati.subject_ids, true);
    }
    if (tabella === "subjects" && dati.teacher_ids !== undefined) {
      await this.impostaDocentiMateria(esistente.id, dati.teacher_ids, true);
    }
    notifica(tabella, "updated");
  },

  async elimina(tabella, id) {
    const { etichetta } = catalogRepository.TABELLE[tabella];
    const voce = await this.richiedi(tabella, id);
    const n = await catalogRepository.contaOrari(tabella, voce.id);
    if (n > 0) {
      throw new HttpError(
        400,
        `Impossibile eliminare: ${etichetta} ${etichetta === "docente" ? "usato" : "usata"} in ${n} ${n === 1 ? "orario" : "orari"}. Elimina o modifica prima gli orari.`,
      );
    }
    await catalogRepository.elimina(tabella, voce.id);
    notifica(tabella, "deleted");
  },

  // ── Relazione docente ↔ materia ──

  // Sostituisce l'elenco delle materie insegnate da un docente.
  // Non si può togliere una materia se esistono orari con quel docente e quella materia.
  async impostaMaterieDocente(teacherId, subjectIds, silenzioso = false) {
    await this.richiedi("teachers", teacherId);
    const nuovi = elencoId(subjectIds) || [];
    if ((await catalogRepository.contaEsistenti("subjects", nuovi)) !== nuovi.length) {
      throw new HttpError(400, "Una o più materie non esistono");
    }
    const attuali = await catalogRepository.legamiDocente(teacherId);
    await applicaCoppie(
      attuali.map((s) => [teacherId, s]),
      nuovi.map((s) => [teacherId, s]),
    );
    if (!silenzioso) notifica("teachers", "updated");
  },

  // Sostituisce l'elenco dei docenti che insegnano una materia
  async impostaDocentiMateria(subjectId, teacherIds, silenzioso = false) {
    await this.richiedi("subjects", subjectId);
    const nuovi = elencoId(teacherIds) || [];
    if ((await catalogRepository.contaEsistenti("teachers", nuovi)) !== nuovi.length) {
      throw new HttpError(400, "Uno o più docenti non esistono");
    }
    const attuali = await catalogRepository.legamiMateria(subjectId);
    await applicaCoppie(
      attuali.map((t) => [t, subjectId]),
      nuovi.map((t) => [t, subjectId]),
    );
    if (!silenzioso) notifica("subjects", "updated");
  },
};

module.exports = catalogService;
