// Helper eliminazione multipla: esegue `fn(id)` per ogni id, elimina quelli
// eliminabili e salta gli altri riportando il motivo.
const { HttpError } = require("../middleware/errorHandler");

async function eliminaMultipli(ids, fn, etichette = {}) {
  if (!Array.isArray(ids) || ids.length === 0)
    throw new HttpError(400, "Nessun elemento selezionato");
  const eliminati = [];
  const saltati = [];
  for (const id of [...new Set(ids.map(Number))]) {
    try {
      await fn(id);
      eliminati.push(id);
    } catch (err) {
      saltati.push({ id, nome: etichette[id] || `#${id}`, motivo: err.message });
    }
  }
  return { success: true, eliminati, saltati };
}

module.exports = { eliminaMultipli };
