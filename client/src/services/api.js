// API Service - Simple HTTP client
import axios from "axios";

// Simple API configuration
const getApiConfig = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const baseURL = isProduction
    ? process.env.REACT_APP_API_URL || window.location.origin
    : "http://localhost:3000"; // Direct connection to server

  return {
    baseURL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
};

// Create axios instance
const api = axios.create(getApiConfig());

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Return consistent error format
    return Promise.reject({
      success: false,
      message:
        error.response?.data?.message || error.message || "An error occurred",
      status: error.response?.status,
    });
  }
);

// API Methods - Clean and simple
export const authAPI = {
  signup: (userData) => api.post("/api/auth/register", userData),
  login: (credentials) => api.post("/api/auth/login", credentials),
  requestPasswordReset: (emailData) =>
    api.post("/api/auth/request-password-reset", emailData),
  resetPassword: (passwordData) =>
    api.post("/api/auth/reset-password", passwordData),
  getCurrentUser: () => api.get("/api/auth/verify"),
};

export const ticketsAPI = {
  getTickets: (filters = {}) => api.get("/api/tickets", { params: filters }),
  getTicket: (id) => api.get(`/api/tickets/${id}`),
  createTicket: (ticketData) => api.post("/api/tickets", ticketData),
  updateTicket: (id, ticketData) => api.put(`/api/tickets/${id}`, ticketData),
  deleteTicket: (id) => api.delete(`/api/tickets/${id}`),
  assignTicket: (id, assignedTo) =>
    api.put(`/api/tickets/${id}/assign`, { assignedTo }),
  takeTicket: (id) => api.put(`/api/tickets/${id}/take`),
  getAgents: () => api.get("/api/tickets/agents"),
  getDashboardStats: () => api.get("/api/tickets/stats"),
};

export const knowledgeAPI = {
  getArticles: (filters = {}) => api.get("/api/knowledge", { params: filters }),
  getArticle: (id) => api.get(`/api/knowledge/${id}`),
  createArticle: (articleData) => api.post("/api/knowledge", articleData),
  updateArticle: (id, articleData) =>
    api.put(`/api/knowledge/${id}`, articleData),
  deleteArticle: (id) => api.delete(`/api/knowledge/${id}`),
  markHelpful: (id) => api.post(`/api/knowledge/${id}/helpful`),
};

export const userAPI = {
  getProfile: () => api.get("/api/users/profile"),
  updateProfile: (profileData) => api.put("/api/users/profile", profileData),
  updatePreferences: (preferences) =>
    api.put("/api/users/preferences", preferences),
  getAllUsers: (filters = {}) => api.get("/api/users", { params: filters }),
  createUser: (userData) => api.post("/api/users", userData),
  updateUser: (userId, userData) => api.put(`/api/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/api/users/${userId}`),
};
