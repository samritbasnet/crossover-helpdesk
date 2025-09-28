// API Service - Handles all communication with the backend
import axios from "axios";

// API base URL from environment (CRA: REACT_APP_API_BASE).
// In production, this will be a relative path that goes through Netlify's proxy
// In development, it will point to the local server
const API_BASE = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_BASE || '/api'
  : 'http://localhost:3000/api';

// Log the API base URL for debugging (removed in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('API Base URL:', API_BASE);
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: false, // Disable credentials for proxy
  timeout: 30000, // Increased timeout for production
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

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // You can log successful responses here if needed
    return response;
  },
  (error) => {
    // Log error for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        config: error.config,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
      });
    }

    // Handle specific error statuses
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      switch (error.response.status) {
        case 401: // Unauthorized
          localStorage.removeItem("token");
          // Only redirect if not on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = "/login?session_expired=true";
          }
          break;
        case 403: // Forbidden
          // Handle 403 Forbidden errors
          break;
        case 404: // Not Found
          // Handle 404 Not Found errors
          break;
        case 500: // Internal Server Error
          // Handle 500 errors
          break;
        default:
          // Handle other status codes
          break;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }

    // Return a user-friendly error message
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred. Please try again.';
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Authentication API calls
export const authAPI = {
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
