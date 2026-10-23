// Controller anagrafiche: docenti, aule, materie (stessa logica, tabella diversa)
const catalogService = require("../services/catalogService");

function perTabella(tabella) {
  return {
    async lista(_req, res) {
      res.json(await catalogService.lista(tabella));
    },
    async crea(req, res) {
      const voce = await catalogService.crea(tabella, req.body?.name);
      res.status(voce.creato ? 201 : 200).json(voce);
    },
  };
}

module.exports = {
  teachers: perTabella("teachers"),
  rooms: perTabella("rooms"),
  subjects: perTabella("subjects"),
};
