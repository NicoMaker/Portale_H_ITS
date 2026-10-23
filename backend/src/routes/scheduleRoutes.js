const express = require("express");
const schedulesController = require("../controllers/schedulesController");
const { requireAdmin } = require("../middleware/auth");
const { catchErrors } = require("../middleware/errorHandler");

const router = express.Router();

router.get("/", requireAdmin, catchErrors(schedulesController.lista));
router.get("/meta", requireAdmin, catchErrors(schedulesController.metadati));
router.post("/", requireAdmin, catchErrors(schedulesController.crea));
router.put("/:id", requireAdmin, catchErrors(schedulesController.aggiorna));
router.delete("/:id", requireAdmin, catchErrors(schedulesController.elimina));

module.exports = router;
