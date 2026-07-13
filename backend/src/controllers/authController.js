// Controller auth: login/logout/sessione/profilo corrente
const authService = require("../services/authService");
const { destroySession } = require("../services/sessionService");

const authController = {
  async login(req, res) {
    const { username, password } = req.body;
    const esito = await authService.login(username, password);

    if (!esito) {
      return res.send(
        '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>',
      );
    }

    res.cookie("sid", esito.sid, { httpOnly: true, path: "/" });
    // Cookie gemello leggibile da JS: serve solo al client Socket.IO per
    // registrarsi e ricevere il force-logout mirato. Non concede accesso:
    // l'autorizzazione resta legata al cookie httpOnly.
    res.cookie("sid_client", esito.sid, { httpOnly: false, path: "/" });
    res.redirect(
      esito.role === "admin" ? "/admin_dashboard.html" : "/user_dashboard.html",
    );
  },

  logout(req, res) {
    destroySession(req, res);
    res.clearCookie("sid_client");
    res.redirect("/login.html");
  },

  statoSessione(req, res) {
    res.json(authService.statoSessione(req.cookies?.sid));
  },

  // GET /user/current — dati dell'utente loggato
  utenteCorrente(req, res) {
    const { id, username, role } = req.session.user;
    res.json({ id, username, role });
  },

  // POST /user/profile — aggiorna il profilo dell'utente loggato
  async aggiornaProfilo(req, res) {
    const esito = await authService.aggiornaProfiloCorrente(
      req.session.user.id,
      req.body,
    );
    res.json(esito);
  },
};

module.exports = authController;
