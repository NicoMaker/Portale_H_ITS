// Connessione SQLite + helper promisificati (niente callback hell nei layer superiori)
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbDir = path.join(__dirname, "..", "..", "db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dbDir, "database.db"));

// Wrapper Promise attorno alle API callback di sqlite3
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

// Risolve con { lastID, changes }
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { db, dbGet, dbAll, dbRun };
