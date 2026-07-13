// Controller corsi
const coursesService = require("../services/coursesService");

const coursesController = {
  async lista(req, res) {
    res.json(await coursesService.lista());
  },

  async crea(req, res) {
    await coursesService.crea(req.body);
    res.send("OK");
  },

  async aggiorna(req, res) {
    await coursesService.aggiorna(req.params.id, req.body);
    res.send("OK");
  },

  async elimina(req, res) {
    await coursesService.elimina(req.params.id);
    res.send("OK");
  },
};

module.exports = coursesController;
