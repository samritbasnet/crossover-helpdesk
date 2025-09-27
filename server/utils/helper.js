// Send a success response
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = {
    success: true,
    message,
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
    message,
  });
};

// Handle database errors
const handleDatabaseError = (error, res) => {
  console.error("Database error:", error);

  // Validation errors (e.g. missing required fields, invalid format)
  if (error.name === "SequelizeValidationError") {
    return sendError(res, "Validation error: " + error.errors[0].message, 400);
  }

  // Unique constraint errors (e.g. email already exists, duplicate id)
  if (error.name === "SequelizeUniqueConstraintError") {
    // Try to get the field name that's causing the error
    const errorField = error.errors && error.errors[0] && error.errors[0].path;
    const message =
      errorField === "email"
        ? "This email is already registered"
        : `Duplicate value for unique field: ${errorField}`;
    return sendError(res, message, 400);
  }

  // Generic database error
  return sendError(res, "Database error occurred", 500);
};

module.exports = {
  sendSuccess,
  sendError,
  handleDatabaseError,
};
