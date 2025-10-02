const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  takeTicket,
  getAgents,
  getDashboardStats,
} = require("../controllers/ticketController");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);

router.post("/", createTicket);
router.get("/stats", getDashboardStats);
router.get("/agents", getAgents);
router.get("/", getTickets);
router.get("/:id", getTicket);
router.put("/:id/assign", assignTicket);
router.put("/:id/take", takeTicket);
router.put("/:id", updateTicket);
router.delete("/:id", deleteTicket);

module.exports = router;
