// API Service - Handles all communication with the backend
import axios from "axios";

// API base URL from environment (CRA: REACT_APP_API_BASE). Fallback to local dev.
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Sign up new user
  signup: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get("/auth/verify");
    return response.data;
  },
};

// Tickets API calls
export const ticketsAPI = {
  // Get all tickets (filtered by user role)
  getTickets: async (filters = {}) => {
    const response = await api.get("/tickets", { params: filters });
    return response.data; // Backend returns { success, tickets, pagination, stats }
  },

  // Get single ticket
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data; // Backend returns { success, ticket }
  },

  // Create new ticket
  createTicket: async (ticketData) => {
    const response = await api.post("/tickets", ticketData);
    return response.data; // Backend returns { success, message, ticket }
  },

  // Update ticket
  updateTicket: async (id, ticketData) => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data; // Backend returns { success, message, ticket }
  },

  // Delete ticket
  deleteTicket: async (id) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data; // Backend returns { success, message }
  },
};

// Knowledge Base API calls
export const knowledgeAPI = {
  // Get all knowledge articles
  getArticles: async (filters = {}) => {
    const response = await api.get("/knowledge", { params: filters });
    return response.data; // Backend returns { success, data, pagination }
  },

  // Get single article
  getArticle: async (id) => {
    const response = await api.get(`/knowledge/${id}`);
    return response.data; // Backend returns { success, data }
  },

  // Create new article
  createArticle: async (articleData) => {
    const response = await api.post("/knowledge", articleData);
    return response.data; // Backend returns { success, message, data }
  },

  // Update article
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/knowledge/${id}`, articleData);
    return response.data; // Backend returns { success, message, data }
  },

  // Delete article
  deleteArticle: async (id) => {
    const response = await api.delete(`/knowledge/${id}`);
    return response.data; // Backend returns { success, message }
  },

  // Mark article as helpful
  markHelpful: async (id) => {
    const response = await api.post(`/knowledge/${id}/helpful`);
    return response.data; // Backend returns { success, message, helpful_count }
  },
};

export default api;
