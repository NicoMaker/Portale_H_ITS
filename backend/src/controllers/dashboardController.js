// Controller dashboard: pagine protette, dati utente, statistiche admin
const path = require("path");
const usersRepository = require("../repositories/usersRepository");
const schedulesRepository = require("../repositories/schedulesRepository");
const statsRepository = require("../repositories/statsRepository");

const HTML_DIR = path.join(__dirname, "..", "..", "..", "frontend", "HTML");

const dashboardController = {
  paginaAdmin(req, res) {
    res.sendFile(path.join(HTML_DIR, "admin_dashboard.html"));
  },

  paginaUser(req, res) {
    res.sendFile(path.join(HTML_DIR, "user_dashboard.html"));
  },

  async corsiUtente(req, res) {
    res.json(await usersRepository.corsiDellUtente(req.session.user.id));
  },

  async orariUtente(req, res) {
    res.json(await schedulesRepository.trovaPerUtente(req.session.user.id));
  },

  async statistiche(req, res) {
    res.json(await statsRepository.statisticheBase());
  },

  async analytics(req, res) {
    res.json(await statsRepository.analyticsDettagliate());
  },
};

module.exports = dashboardController;
