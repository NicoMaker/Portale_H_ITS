// Gestione delle sessioni in-memory: { sid: { user, created } }
const crypto = require("crypto");

const sessions = {};

// Durata massima di una sessione (8 ore) e pulizia periodica delle scadute
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const isExpired = (sess) => Date.now() - sess.created > SESSION_TTL_MS;

setInterval(
  () => {
    for (const [sid, sess] of Object.entries(sessions)) {
      if (isExpired(sess)) delete sessions[sid];
    }
  },
  10 * 60 * 1000,
).unref();

function createSession(user) {
  const sid = crypto.randomBytes(16).toString("hex");
  sessions[sid] = { user, created: Date.now() };
  return sid;
}

function getSession(req) {
  const sid = req.cookies?.sid;
  return getSessionBySid(sid);
}

function getSessionBySid(sid) {
  const sess = sid ? sessions[sid] : null;
  if (!sess) return null;
  if (isExpired(sess)) {
    delete sessions[sid];
    return null;
  }
  return sess;
}

function destroySession(req, res) {
  const sid = req.cookies?.sid;
  if (sid) delete sessions[sid];
  res.clearCookie("sid");
}

// Invalida tutte le sessioni di un utente (per id) e ritorna gli sid invalidati
function invalidateUserSessions(userId) {
  const invalidated = [];
  for (const [sid, sess] of Object.entries(sessions)) {
    if (sess.user.id == userId) {
      invalidated.push(sid);
      delete sessions[sid];
    }
  }
  return invalidated;
}

// Aggiorna lo username nelle sessioni attive dell'utente (senza fare logout)
function updateSessionUsername(userId, newUsername) {
  for (const sess of Object.values(sessions)) {
    if (sess.user.id == userId) {
      sess.user.username = newUsername;
    }
  }
}

module.exports = {
  SESSION_TTL_MS,
  sessions,
  createSession,
  getSession,
  getSessionBySid,
  destroySession,
  invalidateUserSessions,
  updateSessionUsername,
};
