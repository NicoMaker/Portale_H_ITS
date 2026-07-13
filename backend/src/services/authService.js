// Service autenticazione: login, logout, stato sessione, profilo corrente
const bcrypt = require("bcryptjs");
const usersRepository = require("../repositories/usersRepository");
const sessionService = require("./sessionService");
const realtime = require("../realtime/socket");

const authService = {
  // Ritorna il sid se le credenziali sono valide, altrimenti null
  async login(username, password) {
    const user = await usersRepository.trovaPerUsername(username);
    if (!user) return null;

    const valida = await bcrypt.compare(password, user.password);
    if (!valida) return null;

    return {
      sid: sessionService.createSession({
        id: user.id,
        username: user.username,
        role: user.role,
      }),
      role: user.role,
    };
  },

  statoSessione(sid) {
    const s = sessionService.getSessionBySid(sid);
    if (!s) return { ok: false };
    return {
      ok: true,
      user: { id: s.user.id, username: s.user.username, role: s.user.role },
    };
  },

  // Aggiorna il profilo dell'utente corrente mantenendo la sessione attiva
  async aggiornaProfiloCorrente(userId, { username, password }) {
    if (username) {
      const esistente = await usersRepository.trovaPerUsernameEsclusoId(
        username,
        userId,
      );
      if (esistente) {
        return { success: false, message: "Username già esistente" };
      }
    }

    const utente = await usersRepository.trovaPerId(userId);
    if (!utente) return { success: false, message: "Utente non trovato" };

    const nuovoUsername = username || utente.username;
    const hashed = password ? await bcrypt.hash(password, 10) : null;
    await usersRepository.aggiornaCredenziali(userId, nuovoUsername, hashed);

    // Mantiene coerente lo username nelle sessioni attive (nessun logout forzato)
    sessionService.updateSessionUsername(userId, nuovoUsername);
    realtime.broadcast("users_updated", {
      action: "profile_updated",
      userId,
    });
    return { success: true };
  },
};

module.exports = authService;
