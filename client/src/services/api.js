// API Service - Simple HTTP client for backend communication
import axios from "axios";

// API configuration - determines base URL based on environment
const getApiConfig = () => {
  // Always use the environment variable if set
  if (process.env.REACT_APP_API_BASE) {
    console.log('Using REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
    return { 
      baseURL: process.env.REACT_APP_API_BASE,
      withCredentials: true
    };
  }

  // Default to local development server
  const baseURL = 'http://localhost:3000/api';
  console.log('Development mode - using:', baseURL);
  return { 
    baseURL,
    withCredentials: true
  };
};

// Create axios instance with configuration
const api = axios.create({
  ...getApiConfig(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullURL: config.baseURL + config.url
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Success:', response.config.url, response.status);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login?session_expired=true";
      }
    }

    // Return user-friendly error
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        'Something went wrong. Please try again.';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Authentication API calls
export const authAPI = {
  // User registration
  signup: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // User login
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Verify current user session
  getCurrentUser: async () => {
    const response = await api.get("/auth/verify");
    return response.data;
  },
};

// Tickets API calls
export const ticketsAPI = {
  // Get tickets with optional filters
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
  // Get knowledge articles
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

// User management API calls
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  },

  // Update email preferences
  updatePreferences: async (preferences) => {
    const response = await api.put("/users/preferences", preferences);
    return response.data;
  },

  // Get all users (admin only)
  getAllUsers: async (filters = {}) => {
    const response = await api.get("/users", { params: filters });
    return response.data;
  },
};

export default api;
