// Service anagrafiche (docenti, aule, materie): validazione nome + eventi realtime
const catalogRepository = require("../repositories/catalogRepository");
const realtime = require("../realtime/socket");
const { HttpError } = require("../middleware/errorHandler");

const MAX_LUNGHEZZA = 120;

function pulisciNome(valore, etichetta) {
  const nome =
    typeof valore === "string" ? valore.trim().replace(/\s+/g, " ") : "";
  if (!nome) throw new HttpError(400, `Il campo ${etichetta} è obbligatorio`);
  if (nome.length > MAX_LUNGHEZZA)
    throw new HttpError(400, `Il campo ${etichetta} è troppo lungo`);
  return nome;
}

const catalogService = {
  lista(tabella) {
    return catalogRepository.trovaTutti(tabella);
  },

  // Riusa la voce se esiste già, altrimenti la crea. Ritorna { id, name, creato }.
  async risolvi(tabella, valore) {
    const { etichetta } = catalogRepository.TABELLE[tabella];
    const nome = pulisciNome(valore, etichetta);
    return catalogRepository.trovaOCrea(tabella, nome);
  },

  async crea(tabella, valore) {
    const voce = await this.risolvi(tabella, valore);
    if (voce.creato) {
      realtime.broadcast("schedules_updated", {
        action: "catalog",
        catalog: tabella,
      });
    }
    return voce;
  },
};

module.exports = catalogService;
