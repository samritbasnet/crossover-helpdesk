// API Service - Handles all communication with the backend
import axios from "axios";

// API base URL configuration
const getApiConfig = () => {
  // Check if we have the Netlify environment variable set
  if (process.env.REACT_APP_API_BASE === '/api') {
    console.log('🚀 NETLIFY PRODUCTION - Using proxy at /api');
    return {
      baseURL: '/api',
      withCredentials: false,
      timeout: 30000
    };
  }
  
  // Check if we're in production mode
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 PRODUCTION MODE - Using Netlify proxy');
    return {
      baseURL: '/api',
      withCredentials: false,
      timeout: 30000
    };
  }
  
  // In development, use the local server
  console.log('🔧 DEVELOPMENT MODE - Using local server');
  return {
    baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:3000/api',
    withCredentials: true,
    timeout: 10000
  };
};

const { baseURL, withCredentials, timeout } = getApiConfig();

// Log the API configuration for debugging (always log in production for now)
console.log('🔍 API Configuration Debug:', {
  baseURL,
  withCredentials,
  timeout,
  nodeEnv: process.env.NODE_ENV,
  apiBase: process.env.REACT_APP_API_BASE,
  location: window.location.href,
  hostname: window.location.hostname,
  isNetlify: window.location.hostname.includes('netlify'),
  allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});

// Create axios instance with base configuration
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials,
  timeout
});

// Add token to requests if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the actual request being made
    console.log('Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Success:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: process.env.NODE_ENV !== 'production' ? error.config : undefined,
    });

    // Handle specific error statuses
    if (error.response) {
      switch (error.response.status) {
        case 401: // Unauthorized
          localStorage.removeItem("token");
          // Only redirect if not on login page and not already redirecting
          if (!window.location.pathname.includes('/login') &&
              !window.location.search.includes('session_expired=true')) {
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
