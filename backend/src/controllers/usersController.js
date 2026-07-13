// Controller utenti: traduce HTTP ⇄ usersService
const usersService = require("../services/usersService");

const usersController = {
  async lista(req, res) {
    res.json(await usersService.lista());
  },

  async crea(req, res) {
    const errore = await usersService.crea(req.body, req.session.user);
    // Comportamento originale: errori "soft" con HTTP 200
    res.send(errore || "OK");
  },

  async promuovi(req, res) {
    await usersService.promuovi(req.params.id);
    res.send("OK");
  },

  async retrocedi(req, res) {
    await usersService.retrocedi(req.params.id);
    res.send("OK");
  },

  async elimina(req, res) {
    await usersService.elimina(req.params.id);
    res.send("OK");
  },

  async assegnaCorso(req, res) {
    await usersService.assegnaCorso(req.params.id, req.body.course_id);
    res.send("OK");
  },

  async modificaCredenziali(req, res) {
    const errore = await usersService.modificaCredenziali(
      req.params.id,
      req.body,
    );
    res.send(errore || "OK");
  },
};

module.exports = usersController;
