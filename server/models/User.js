const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// User Model - Defines what a user looks like in our database
const User = sequelize.define(
  "User",
  {
    // Primary key - unique identifier for each user
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // User's full name
    name: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
    },

    // User's email address
    email: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
      unique: true, // No duplicate emails allowed
      validate: {
        isEmail: true, // Must be a valid email format
      },
    },

    // User's password (will be encrypted)
    password: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
    },

    // User's role: 'user' or 'agent'
    role: {
      type: DataTypes.ENUM("user", "agent"),
      defaultValue: "user", // Default to regular user
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
    tableName: "users", // Table name in database
  }
);

module.exports = User;
