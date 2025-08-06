const crypto = require("crypto");

// In-memory session store
const sessions = {};

function createSession(user) {
  const sid = crypto.randomBytes(16).toString("hex");
  sessions[sid] = { user, created: Date.now() };
  return sid;
}

function getSession(req) {
  const sid = req.cookies.sid;
  if (sid && sessions[sid]) return sessions[sid];
  return null;
}

function destroySession(req, res) {
  const sid = req.cookies.sid;
  if (sid) delete sessions[sid];
  res.clearCookie("sid");
}

// Middleware for admin authentication
function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.user.role !== "admin") {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

// Middleware for user authentication
function requireUser(req, res, next) {
  const session = getSession(req);
  if (!session || session.user.role !== "user") {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

// Generic authentication middleware
function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.status(403).send("Forbidden");
  }
  req.session = session;
  next();
}

module.exports = {
  createSession,
  getSession,
  destroySession,
  requireAdmin,
  requireUser,
  requireAuth,
};
