// API Service - Simple HTTP client for backend communication
import axios from "axios";

// API configuration - determines base URL based on environment
const getApiConfig = () => {
  // In production, use the full backend URL
  // In development, use the local server
  const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://crossover-helpdesk.onrender.com/api'
    : 'http://localhost:3000/api';
  
  console.log(`API Configuration - Base URL: ${baseURL}`);
  
  return {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // Ensure credentials are sent with requests
    withCredentials: true,
    // Add response type
    responseType: 'json'
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

    // Always log request details for debugging
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    // Log the full error in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          data: error.config?.data
        },
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
    }

    if (error.response) {
      // Server responded with a status code outside 2xx
      const { status, data } = error.response;
      let errorMessage = data?.message || 'An error occurred';
      
      // Handle specific status codes
      if (status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true';
        }
      } else if (status === 403) {
        errorMessage = 'You do not have permission to access this resource.';
      } else if (status === 404) {
        errorMessage = `The requested resource was not found: ${error.config.url}`;
      } else if (status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return Promise.reject({
        message: errorMessage,
        status,
        data,
        url: error.config.url,
        isNetworkError: false
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - No response received from server');
      return Promise.reject({
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        isNetworkError: true
      });
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
      return Promise.reject({
        message: `Request failed: ${error.message}`,
        isNetworkError: false,
        isAxiosError: error.isAxiosError
      });
    }
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
  getCurrentUser: () => api.get("/auth/verify"),  // Changed from /auth/me to /auth/verify to match backend
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
