const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Ticket Model - Defines what a support ticket looks like
const Ticket = sequelize.define(
  "Ticket",
  {
    // Primary key - unique identifier for each ticket
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Ticket title (short description)
    title: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
      validate: {
        len: [1, 200], // Must be between 1 and 200 characters
      },
    },

    // Detailed description of the issue
    description: {
      type: DataTypes.TEXT,
      allowNull: false, // Required field
      validate: {
        len: [1, 2000], // Must be between 1 and 2000 characters
      },
    },

    // How urgent the ticket is
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium", // Default priority
      allowNull: false,
    },

    // Current status of the ticket
    status: {
      type: DataTypes.ENUM("open", "in_progress", "resolved"),
      defaultValue: "open", // New tickets start as open
      allowNull: false,
    },

    // Notes from the agent when resolving the ticket
    resolutionNotes: {
      type: DataTypes.TEXT,
      allowNull: true, // Optional field
    },

    // Who created this ticket (links to users table)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Required field
      references: {
        model: "users", // Links to users table
        key: "id", // Links to user's ID
      },
    },

    // Which agent is handling this ticket (links to users table)
    assignedAgentId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Optional - ticket might not be assigned yet
      references: {
        model: "users", // Links to users table
        key: "id", // Links to agent's ID
      },
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    tableName: "tickets", // Table name in database
  }
);

module.exports = Ticket;
