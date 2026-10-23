// Service orari: CRUD con anagrafiche, giorno derivato dalla data, eventi realtime
const schedulesRepository = require("../repositories/schedulesRepository");
const catalogService = require("./catalogService");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const GIORNI = [
  "Domenica",
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
];

// Il giorno è sempre ricavato dalla data (formato ISO yyyy-mm-dd)
function giornoDaData(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, "Data non valida");
  }
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, "Data non valida");
  return GIORNI[d.getDay()];
}

// Traduce i nomi ricevuti dal frontend negli id delle anagrafiche (creandole se mancano)
async function preparaDati(dati = {}) {
  const [teacher, room, subject] = await Promise.all([
    catalogService.risolvi("teachers", dati.teacher),
    catalogService.risolvi("rooms", dati.room),
    catalogService.risolvi("subjects", dati.subject),
  ]);
  return {
    course_id: dati.course_id,
    teacher_id: teacher.id,
    room_id: room.id,
    subject_id: subject.id,
    day: giornoDaData(dati.date),
    date: dati.date,
    start_time: dati.start_time,
    end_time: dati.end_time,
    nuoveAnagrafiche: teacher.creato || room.creato || subject.creato,
  };
}

const schedulesService = {
  cerca(filtri) {
    return schedulesRepository.cerca(filtri);
  },

  async crea(dati) {
    const pronti = await preparaDati(dati);
    let scheduleId;
    try {
      scheduleId = await schedulesRepository.crea(pronti);
    } catch (err) {
      throw new HttpError(400, "Errore inserimento orario");
    }
    realtime.broadcast("schedules_updated", {
      action: "created",
      scheduleId,
      course_id: Number(dati.course_id),
    });
    realtime.broadcast("schedule_updated", {
      courseId: Number(dati.course_id),
    });
  },

  async aggiorna(id, dati) {
    const pronti = await preparaDati(dati);
    try {
      await schedulesRepository.aggiorna(id, pronti);
    } catch (err) {
      throw new HttpError(400, "Errore update orario");
    }
    realtime.broadcast("schedules_updated", {
      action: "updated",
      scheduleId: Number(id),
      course_id: Number(dati.course_id),
    });
    realtime.broadcast("schedule_updated", {
      courseId: Number(dati.course_id),
    });
  },

  async elimina(id) {
    // Prima recupera il course_id per l'evento
    const row = await schedulesRepository.trovaCourseId(id);
    await schedulesRepository.elimina(id);
    const courseId = row?.course_id;
    realtime.broadcast("schedules_updated", {
      action: "deleted",
      scheduleId: Number(id),
    });
    if (courseId) {
      realtime.broadcast("schedule_updated", { courseId: Number(courseId) });
    }
  },

  // Valori disponibili per i selettori: leggono direttamente le anagrafiche
  // (quindi includono anche docenti/aule/materie non ancora usati in un orario)
  async metadati() {
    const [teachers, rooms, subjects] = await Promise.all([
      catalogService.lista("teachers"),
      catalogService.lista("rooms"),
      catalogService.lista("subjects"),
    ]);
    const nomi = (righe) => righe.map((r) => r.name);
    return {
      teacher: nomi(teachers),
      room: nomi(rooms),
      subject: nomi(subjects),
    };
  },
};

module.exports = schedulesService;
