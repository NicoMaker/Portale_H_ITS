// Gestione delle sessioni in-memory: { sid: { user, created } }
const crypto = require("crypto");

const sessions = {};

function createSession(user) {
  const sid = crypto.randomBytes(16).toString("hex");
  sessions[sid] = { user, created: Date.now() };
  return sid;
}

function getSession(req) {
  const sid = req.cookies?.sid;
  if (sid && sessions[sid]) return sessions[sid];
  return null;
}

function getSessionBySid(sid) {
  return sessions[sid] || null;
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
  sessions,
  createSession,
  getSession,
  getSessionBySid,
  destroySession,
  invalidateUserSessions,
  updateSessionUsername,
};
