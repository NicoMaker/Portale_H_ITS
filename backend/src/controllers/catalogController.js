const catalogService = require("../services/catalogService");

function perTabella(tabella) {
  return {
    async lista(_req, res) {
      res.json(await catalogService.lista(tabella));
    },
    async crea(req, res) {
      const voce = await catalogService.crea(tabella, req.body || {});
      res.status(voce.creato ? 201 : 200).json(voce);
    },
    async aggiorna(req, res) {
      await catalogService.aggiorna(tabella, req.params.id, req.body || {});
      res.send("OK");
    },
    async elimina(req, res) {
      await catalogService.elimina(tabella, req.params.id);
      res.send("OK");
    },
  };
}

module.exports = {
  teachers: perTabella("teachers"),
  rooms: perTabella("rooms"),
  subjects: perTabella("subjects"),
};
