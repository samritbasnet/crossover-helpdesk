// API Service - Simple HTTP client for backend communication
import axios from "axios";

// API configuration - using proxy in development
const getApiConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";

  // For development, use the proxy (defined in package.json)
  // For production, use the REACT_APP_API_URL or fall back to current origin
  let baseURL;

  if (isProduction) {
    baseURL = process.env.REACT_APP_API_URL || window.location.origin;
  } else {
    // In development, use the proxy (defined in package.json)
    baseURL = "";
  }

  console.log(`API Configuration - Base URL: ${baseURL}`);
  console.log("Environment:", {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    isProduction,
  });

  // Headers configuration
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  };

  // Add auth token if it exists
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return {
    baseURL,
    timeout: 30000,
    withCredentials: !isProduction,
    responseType: "json",
    headers,
    maxRedirects: 0,
    validateStatus: function (status) {
      return status >= 200 && status < 300;
    },
  };
};

// Create axios instance with configuration
const api = axios.create(getApiConfig());

// Request interceptor - handles request configuration and logging
api.interceptors.request.use(
  (config) => {
    // Ensure headers exist
    config.headers = config.headers || {};

    // Add auth token if it exists and not already set
    if (!config.headers.Authorization) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log the request details
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      headers: config.headers,
      data: config.data,
      params: config.params,
    });

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles responses and errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(
      `📥 ${response.status} ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`,
      {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      }
    );

    return response;
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.error("Network Error - No response received from server");
      return Promise.reject({
        success: false,
        message:
          "Unable to connect to the server. Please check your internet connection and try again.",
        isNetworkError: true,
      });
    }

    // Handle HTTP errors (response with error status code)
    const { response } = error;
    let errorMessage = "An unexpected error occurred";

    // Extract error message from response
    if (response.data && response.data.message) {
      errorMessage = response.data.message;
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }

    // Log the error
    console.error(`API Error ${response.status}: ${errorMessage}`, {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
    });

    // Handle specific status codes
    if (response.status === 401) {
      // Unauthorized - token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
      errorMessage = "Your session has expired. Please log in again.";
    }

    // Return a consistent error format
    return Promise.reject({
      success: false,
      status: response.status,
      message: errorMessage,
      data: response.data,
      isNetworkError: false,
      isUnauthorized: response.status === 401,
    });
  }
);

// Auth API
export const authAPI = {
  // User registration
  signup: (userData) => api.post("/api/auth/register", userData),

  // User login
  login: (credentials) =>
    api.post("/api/auth/login", credentials, {
      // Explicitly set headers for login to avoid any caching issues
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    }),

  // Request password reset
  requestPasswordReset: (emailData) =>
    api.post("/api/auth/request-password-reset", emailData),

  // Reset password with token
  resetPassword: (passwordData) =>
    api.post("/api/auth/reset-password", passwordData),

  // Verify current user session
  getCurrentUser: () => api.get("/api/auth/verify"),
};

// Tickets API calls
export const ticketsAPI = {
  // Get tickets with optional filters
  getTickets: (filters = {}) => api.get("/api/tickets", { params: filters }),

  // Get single ticket
  getTicket: (id) => api.get(`/api/tickets/${id}`),

  // Create new ticket
  createTicket: (ticketData) => api.post("/api/tickets", ticketData),

  // Update ticket
  updateTicket: (id, ticketData) => api.put(`/api/tickets/${id}`, ticketData),

  // Delete ticket
  deleteTicket: (id) => api.delete(`/api/tickets/${id}`),
};

// Knowledge Base API calls
export const knowledgeAPI = {
  // Get knowledge articles
  getArticles: (filters = {}) =>
    api.get("/api/knowledge-base", { params: filters }),

  // Get single article
  getArticle: (id) => api.get(`/api/knowledge-base/${id}`),

  // Create new article
  createArticle: (articleData) => api.post("/api/knowledge-base", articleData),

  // Update article
  updateArticle: (id, articleData) =>
    api.put(`/api/knowledge-base/${id}`, articleData),

  // Delete article
  deleteArticle: (id) => api.delete(`/api/knowledge-base/${id}`),

  // Mark article as helpful
  markHelpful: (id) => api.post(`/api/knowledge-base/${id}/helpful`),
};

// User management API calls
export const userAPI = {
  // Get user profile
  getProfile: () => api.get("/api/users/me"),

  // Update user profile
  updateProfile: (profileData) => api.put("/api/users/me", profileData),

  // Update email preferences
  updatePreferences: (preferences) =>
    api.put("/api/users/me/preferences", preferences),

  // Get all users (admin only)
  getAllUsers: (filters = {}) => api.get("/api/users", { params: filters }),

  // Create a new user (admin only)
  createUser: (userData) => api.post("/api/users", userData),

  // Update a user (admin only)
  updateUser: (userId, userData) => api.put(`/api/users/${userId}`, userData),

  // Delete a user (admin only)
  deleteUser: (userId) => api.delete(`/api/users/${userId}`),
};
