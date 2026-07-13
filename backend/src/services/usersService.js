// Service utenti: regole di business (ultimo admin, force logout, eventi realtime)
const bcrypt = require("bcryptjs");
const usersRepository = require("../repositories/usersRepository");
const sessionService = require("./sessionService");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

// Invalida le sessioni dell'utente e forza il logout via socket
function invalidaEForzaLogout(userId) {
  const sids = sessionService.invalidateUserSessions(Number(userId));
  realtime.forceLogout(sids);
}

const usersService = {
  // Lista utenti con i corsi associati
  async lista() {
    const users = await usersRepository.trovaTutti();
    await Promise.all(
      users.map(async (u) => {
        u.courses = (await usersRepository.corsiDellUtente(u.id)) || [];
      }),
    );
    return users;
  },

  // Crea un utente; ritorna null se ok, o un messaggio d'errore "soft" (HTTP 200)
  async crea({ username, password, role, course_id }, richiedente) {
    const userRole =
      role === "admin" && richiedente.role === "admin" ? "admin" : "user";

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUserId;
    try {
      newUserId = await usersRepository.crea(username, hashedPassword, userRole);
    } catch (err) {
      return "Username già esistente";
    }

    if (userRole === "user" && course_id) {
      try {
        await usersRepository.assegnaCorso(newUserId, course_id);
      } catch (err) {
        return "Errore nell'associazione del corso";
      }
    }

    realtime.broadcast("users_updated", { action: "created", userId: newUserId });
    return null;
  },

  async promuovi(id) {
    await usersRepository.aggiornaRuolo(id, "admin");
    await usersRepository.rimuoviCorsi(id);
    // Forza logout: deve ri-loginare come admin
    invalidaEForzaLogout(id);
    realtime.broadcast("users_updated", {
      action: "promoted",
      userId: Number(id),
    });
  },

  async retrocedi(id) {
    const user = await usersRepository.trovaPerId(id);
    if (!user || user.role !== "admin") {
      throw new HttpError(400, "Non è un admin");
    }
    if ((await usersRepository.contaAdmin()) <= 1) {
      throw new HttpError(400, "Non puoi togliere l'ultimo admin");
    }
    await usersRepository.aggiornaRuolo(id, "user");
    invalidaEForzaLogout(id);
    realtime.broadcast("users_updated", {
      action: "demoted",
      userId: Number(id),
    });
  },

  async elimina(id) {
    const user = await usersRepository.trovaPerId(id);
    if (user && user.role === "admin") {
      if ((await usersRepository.contaAdmin()) <= 1) {
        throw new HttpError(400, "Non puoi eliminare l'ultimo admin");
      }
    }
    invalidaEForzaLogout(id);
    await usersRepository.elimina(id);
    realtime.broadcast("users_updated", {
      action: "deleted",
      userId: Number(id),
    });
  },

  async assegnaCorso(id, course_id) {
    await usersRepository.rimuoviCorsi(id);
    if (course_id) {
      await usersRepository.assegnaCorso(id, course_id);
      // Notifica l'utente interessato in real-time
      realtime.broadcast("schedule_updated", { userId: Number(id) });
    }
    realtime.broadcast("users_updated", {
      action: "course_assigned",
      userId: Number(id),
    });
  },

  // Modifica credenziali (admin su un utente) → forza logout.
  // Ritorna null se ok, o un messaggio d'errore "soft" (HTTP 200)
  async modificaCredenziali(id, { username, password }) {
    const esistente = await usersRepository.trovaPerUsernameEsclusoId(
      username,
      id,
    );
    if (esistente) return "Username già esistente";

    const hashed = password ? await bcrypt.hash(password, 10) : null;
    await usersRepository.aggiornaCredenziali(id, username, hashed);

    // Forza logout: le credenziali sono cambiate
    invalidaEForzaLogout(id);
    realtime.broadcast("users_updated", {
      action: "edited",
      userId: Number(id),
    });
    return null;
  },
};

module.exports = usersService;
