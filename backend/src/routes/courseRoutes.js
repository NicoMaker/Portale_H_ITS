const express = require("express");
const coursesController = require("../controllers/coursesController");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const { catchErrors } = require("../middleware/errorHandler");

const router = express.Router();

// GET accessibile a tutti gli autenticati; scrittura solo admin
router.get("/", requireAuth, catchErrors(coursesController.lista));
router.post("/", requireAdmin, catchErrors(coursesController.crea));
router.put("/:id", requireAdmin, catchErrors(coursesController.aggiorna));
router.delete("/:id", requireAdmin, catchErrors(coursesController.elimina));

module.exports = router;
