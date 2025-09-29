// API Service - Simple HTTP client for backend communication
import axios from "axios";

// API configuration - determines base URL based on environment
const getApiConfig = () => {
  // In production, use relative URLs to leverage the Netlify proxy
  // In development, use the full URL with the correct port
  const isProduction = process.env.NODE_ENV === 'production';
  const baseURL = isProduction ? '/api' : 'http://localhost:3000/api';
  
  return {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    // Ensure credentials are sent with requests in production
    withCredentials: isProduction
  };
};

// Create axios instance with configuration
const api = axios.create(getApiConfig());

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
    
    // Return the data directly for easier access
    return response.data;
  },
  (error) => {
    // Extract error details
    const errorDetails = {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      response: error.response?.data,
      originalError: error
    };
    
    console.error('API Error:', errorDetails);

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login?session_expired=true";
      }
    }

    // Return a consistent error object
    return Promise.reject({
      message: error.response?.data?.message || 
              error.message || 
              'Something went wrong. Please try again.',
      status: error.response?.status,
      data: error.response?.data,
      isAxiosError: error.isAxiosError
    });
  }
);

export const authAPI = {
  // User registration
  signup: (userData) => api.post("/auth/register", userData),
  
  // User login
  login: (credentials) => api.post("/auth/login", credentials),
  
  // Request password reset
  requestPasswordReset: (emailData) => 
    api.post("/auth/request-password-reset", emailData),
  
  // Reset password with token
  resetPassword: (passwordData) => 
    api.post("/auth/reset-password", passwordData),
    
  // Verify current user session
  getCurrentUser: () => api.get("/auth/me"),
};

// Tickets API calls
export const ticketsAPI = {
  // Get tickets with optional filters
  getTickets: (filters = {}) => api.get("/tickets", { params: filters }),

  // Get single ticket
  getTicket: (id) => api.get(`/tickets/${id}`),

  // Create new ticket
  createTicket: (ticketData) => api.post("/tickets", ticketData),

  // Update ticket
  updateTicket: (id, ticketData) => api.put(`/tickets/${id}`, ticketData),

  // Delete ticket
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
};

// Knowledge Base API calls
export const knowledgeAPI = {
  // Get knowledge articles
  getArticles: (filters = {}) => api.get("/knowledge", { params: filters }),

  // Get single article
  getArticle: (id) => api.get(`/knowledge/${id}`),

  // Create new article
  createArticle: (articleData) => api.post("/knowledge", articleData),

  // Update article
  updateArticle: (id, articleData) => api.put(`/knowledge/${id}`, articleData),

  // Delete article
  deleteArticle: (id) => api.delete(`/knowledge/${id}`),

  // Mark article as helpful
  markHelpful: (id) => api.post(`/knowledge/${id}/helpful`),
};

// User management API calls
export const userAPI = {
  // Get user profile
  getProfile: () => api.get("/users/profile"),

  // Update user profile
  updateProfile: (profileData) => api.put("/users/profile", profileData),

  // Update email preferences
  updatePreferences: (preferences) => api.put("/users/preferences", { preferences }),

  // Get all users (admin only)
  getAllUsers: (filters = {}) => api.get("/users", { params: filters }),

  // Create a new user (admin only)
  createUser: (userData) => api.post("/users", userData),

  // Update a user (admin only)
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),

  // Delete a user (admin only)
  deleteUser: (userId) => api.delete(`/users/${userId}`),
};

export default api;
