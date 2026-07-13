const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { requireAdmin, requireUser } = require("../middleware/auth");
const { catchErrors } = require("../middleware/errorHandler");

const router = express.Router();

// Pagine protette
router.get("/admin_dashboard.html", requireAdmin, dashboardController.paginaAdmin);
router.get("/user_dashboard.html", requireUser, dashboardController.paginaUser);

// Dati per la dashboard utente
router.get("/user/courses", requireUser, catchErrors(dashboardController.corsiUtente));
router.get("/user/schedules", requireUser, catchErrors(dashboardController.orariUtente));

// Statistiche admin
router.get("/admin/stats", requireAdmin, catchErrors(dashboardController.statistiche));
router.get("/admin/analytics", requireAdmin, catchErrors(dashboardController.analytics));

module.exports = router;
