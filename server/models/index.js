const User = require("./User");
const Ticket = require("./Ticket");
const Knowledge = require("./Knowledge");

// Define model relationships
// User can have many tickets
User.hasMany(Ticket, {
  foreignKey: "userId",
  as: "tickets",
});

// Ticket belongs to a user
Ticket.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// User can be assigned to many tickets as an agent
User.hasMany(Ticket, {
  foreignKey: "assignedAgentId",
  as: "assignedTickets",
});

// Ticket can be assigned to an agent
Ticket.belongsTo(User, {
  foreignKey: "assignedAgentId",
  as: "assignedAgent",
});

// User can create many knowledge articles
User.hasMany(Knowledge, {
  foreignKey: "createdBy",
  as: "knowledgeArticles",
});

// Knowledge article belongs to a user
Knowledge.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

module.exports = {
  User,
  Ticket,
  Knowledge,
};
