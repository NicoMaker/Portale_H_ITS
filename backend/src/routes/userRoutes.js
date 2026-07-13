const express = require("express");
const usersController = require("../controllers/usersController");
const { requireAdmin } = require("../middleware/auth");
const { catchErrors } = require("../middleware/errorHandler");

const router = express.Router();

router.get("/", requireAdmin, catchErrors(usersController.lista));
router.post("/", requireAdmin, catchErrors(usersController.crea));
router.post("/:id/promote", requireAdmin, catchErrors(usersController.promuovi));
router.post("/:id/demote", requireAdmin, catchErrors(usersController.retrocedi));
router.delete("/:id", requireAdmin, catchErrors(usersController.elimina));
router.post(
  "/:id/assign_course",
  requireAdmin,
  catchErrors(usersController.assegnaCorso),
);
// Due varianti equivalenti mantenute per compatibilità con i client esistenti
router.post("/:id/edit", requireAdmin, catchErrors(usersController.modificaCredenziali));
router.put("/:id", requireAdmin, catchErrors(usersController.modificaCredenziali));

module.exports = router;
