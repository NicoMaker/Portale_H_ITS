// Route anagrafiche: /api/teachers, /api/rooms, /api/subjects (solo admin)
const express = require("express");
const catalogController = require("../controllers/catalogController");
const { requireAdmin } = require("../middleware/auth");
const { catchErrors } = require("../middleware/errorHandler");

function router(tabella) {
  const r = express.Router();
  r.get("/", requireAdmin, catchErrors(catalogController[tabella].lista));
  r.post("/", requireAdmin, catchErrors(catalogController[tabella].crea));
  r.put("/:id", requireAdmin, catchErrors(catalogController[tabella].aggiorna));
  r.delete("/:id", requireAdmin, catchErrors(catalogController[tabella].elimina));
  return r;
}

module.exports = {
  teachers: router("teachers"),
  rooms: router("rooms"),
  subjects: router("subjects"),
};
