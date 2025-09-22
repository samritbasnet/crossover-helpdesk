// API Service - Handles all communication with the backend
import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:3000/api", // Your backend server URL
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
    const response = await api.post("/auth/signup", userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Tickets API calls
export const ticketsAPI = {
  // Get all tickets (filtered by user role)
  getTickets: async (filters = {}) => {
    const response = await api.get("/tickets", { params: filters });
    return response.data;
  },

  // Get single ticket
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Create new ticket
  createTicket: async (ticketData) => {
    const response = await api.post("/tickets", ticketData);
    return response.data;
  },

  // Update ticket
  updateTicket: async (id, ticketData) => {
    const response = await api.put(`/tickets/${id}`, ticketData);
    return response.data;
  },

  // Delete ticket
  deleteTicket: async (id) => {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },
};

// Knowledge Base API calls
export const knowledgeAPI = {
  // Get all knowledge articles
  getArticles: async (filters = {}) => {
    const response = await api.get("/knowledge", { params: filters });
    return response.data;
  },

  // Get single article
  getArticle: async (id) => {
    const response = await api.get(`/knowledge/${id}`);
    return response.data;
  },

  // Create new article
  createArticle: async (articleData) => {
    const response = await api.post("/knowledge", articleData);
    return response.data;
  },

  // Update article
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/knowledge/${id}`, articleData);
    return response.data;
  },

  // Delete article
  deleteArticle: async (id) => {
    const response = await api.delete(`/knowledge/${id}`);
    return response.data;
  },

  // Mark article as helpful
  markHelpful: async (id) => {
    const response = await api.post(`/knowledge/${id}/helpful`);
    return response.data;
  },
};

export default api;
