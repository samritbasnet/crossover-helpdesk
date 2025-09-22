// Helper Functions - Makes error handling and responses simpler

// Send a success response
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message: message,
  };

  if (data) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

// Send an error response
const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message: message,
  });
};

// Handle database errors
const handleDatabaseError = (error, res) => {
  console.error("Database error:", error);

  // Check for common database errors
  if (error.name === "SequelizeValidationError") {
    return sendError(res, "Validation error: " + error.errors[0].message, 400);
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return sendError(res, "This email is already registered", 400);
  }

  // Generic database error
  return sendError(res, "Database error occurred", 500);
};

module.exports = {
  sendSuccess,
  sendError,
  handleDatabaseError,
};
