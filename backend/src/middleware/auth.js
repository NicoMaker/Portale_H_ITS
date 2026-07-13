// Middleware di autenticazione/autorizzazione basati sulla sessione
const { getSession } = require("../services/sessionService");

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.user.role !== "admin") {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

function requireUser(req, res, next) {
  const session = getSession(req);
  if (!session || session.user.role !== "user") {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

module.exports = { requireAdmin, requireUser, requireAuth };
