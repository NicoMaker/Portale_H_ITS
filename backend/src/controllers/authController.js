// Controller auth: login/logout/sessione/profilo corrente
const authService = require("../services/authService");
const {
  destroySession,
  SESSION_TTL_MS,
} = require("../services/sessionService");

const authController = {
  async login(req, res) {
    const { username, password } = req.body;
    const esito = await authService.login(username, password);

    if (!esito) {
      return res.send(
        '<div class="hint" style="color:red;text-align:center">Credenziali non valide</div>',
      );
    }

    res.cookie("sid", esito.sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS,
      path: "/",
    });
    res.redirect(
      esito.role === "admin" ? "/admin_dashboard.html" : "/user_dashboard.html",
    );
  },

  logout(req, res) {
    destroySession(req, res);
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
