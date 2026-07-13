// Service orari: CRUD con eventi realtime e metadati per i filtri
const schedulesRepository = require("../repositories/schedulesRepository");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const CAMPI_META = ["teacher", "room", "subject"]; // whitelist per valoriDistinti

const schedulesService = {
  cerca(filtri) {
    return schedulesRepository.cerca(filtri);
  },

  async crea(dati) {
    let scheduleId;
    try {
      scheduleId = await schedulesRepository.crea(dati);
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
    try {
      await schedulesRepository.aggiorna(id, dati);
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

  async metadati() {
    const results = {};
    await Promise.all(
      CAMPI_META.map(async (field) => {
        results[field] = await schedulesRepository.valoriDistinti(field);
      }),
    );
    return results;
  },
};

module.exports = schedulesService;
