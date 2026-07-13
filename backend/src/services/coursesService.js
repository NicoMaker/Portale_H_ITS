// Service corsi: validazione unicità nome + eventi realtime
const coursesRepository = require("../repositories/coursesRepository");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const coursesService = {
  lista() {
    return coursesRepository.trovaTutti();
  },

  async crea({ name, description }) {
    let courseId;
    try {
      courseId = await coursesRepository.crea(name, description);
    } catch (err) {
      throw new HttpError(400, "Nome corso già esistente");
    }
    realtime.broadcast("courses_updated", { action: "created", courseId });
  },

  async aggiorna(id, { name, description }) {
    const esistente = await coursesRepository.trovaPerNomeEsclusoId(name, id);
    if (esistente) throw new HttpError(400, "Nome corso già esistente");

    try {
      await coursesRepository.aggiorna(id, name, description);
    } catch (err) {
      throw new HttpError(400, "Errore update corso");
    }
    realtime.broadcast("courses_updated", {
      action: "updated",
      courseId: Number(id),
    });
    // Aggiorna anche gli orari degli utenti che potrebbero essere connessi
    realtime.broadcast("schedule_updated", { courseId: Number(id) });
  },

  async elimina(id) {
    await coursesRepository.elimina(id);
    realtime.broadcast("courses_updated", {
      action: "deleted",
      courseId: Number(id),
    });
    realtime.broadcast("schedule_updated", { courseId: Number(id) });
  },
};

module.exports = coursesService;
