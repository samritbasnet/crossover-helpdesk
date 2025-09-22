const express = require("express");
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
} = require("../controllers/ticketController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Apply authentication to all ticket routes
// This means users must be logged in to access any ticket endpoint
router.use(authenticateToken);

// Ticket API Endpoints
router.post("/", createTicket); // POST /api/tickets - Create new ticket
router.get("/", getTickets); // GET /api/tickets - Get all tickets (role-based)
router.get("/:id", getTicket); // GET /api/tickets/123 - Get specific ticket
router.put("/:id", updateTicket); // PUT /api/tickets/123 - Update ticket
router.delete("/:id", deleteTicket); // DELETE /api/tickets/123 - Delete ticket

module.exports = router;
