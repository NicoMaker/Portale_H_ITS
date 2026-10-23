// Controller orari
const schedulesService = require("../services/schedulesService");

const schedulesController = {
  async lista(req, res) {
    const { teacher, room, subject } = req.query;
    res.json(await schedulesService.cerca({ teacher, room, subject }));
  },

  async crea(req, res) {
    await schedulesService.crea(req.body);
    res.send("OK");
  },

  async aggiorna(req, res) {
    await schedulesService.aggiorna(req.params.id, req.body);
    res.send("OK");
  },

  async elimina(req, res) {
    await schedulesService.elimina(req.params.id);
    res.send("OK");
  },

  async metadati(req, res) {
    res.json(await schedulesService.metadati());
  },
};

module.exports = schedulesController;
