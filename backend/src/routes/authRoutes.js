const express = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { catchErrors } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/login", catchErrors(authController.login));
router.get("/logout", authController.logout);
router.get("/api/session", authController.statoSessione);

// Profilo dell'utente corrente (usati dai modali "Modifica profilo")
router.get("/user/current", requireAuth, authController.utenteCorrente);
router.post(
  "/user/profile",
  requireAuth,
  catchErrors(authController.aggiornaProfilo),
);

module.exports = router;
