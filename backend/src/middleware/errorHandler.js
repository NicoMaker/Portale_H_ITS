// Gestione centralizzata degli errori.
// Le risposte d'errore restano testo semplice per compatibilità con il frontend.

class HttpError extends Error {
  constructor(status, messaggio) {
    super(messaggio);
    this.status = status;
  }
}

// Wrapper per handler async: gli errori finiscono nel middleware
function catchErrors(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).send(err.message);
  }
  console.error("Errore non gestito:", err);
  res.status(500).send("DB error");
}

module.exports = { HttpError, catchErrors, errorHandler };
