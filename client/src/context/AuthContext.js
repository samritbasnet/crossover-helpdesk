// AuthContext.js - Simple authentication state management
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

// Create context for authentication
const AuthContext = createContext();

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Main authentication provider component
export const AuthProvider = ({ children }) => {
  // State variables
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Parse stored user data
          const userData = JSON.parse(storedUser);

          // Verify token with server
          await authAPI.getCurrentUser();

          // Token is valid, restore user session
          setUser(userData);
          setToken(storedToken);
        }
      } catch (error) {
        // Token invalid or expired, clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      console.log('Attempting login with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password
      });
      
      // Clear any existing authentication state
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      try {
        // Call login API
        console.log('Calling authAPI.login...');
        const response = await authAPI.login(credentials);
        console.log('Login API response received');

        // Handle different response formats
        const responseData = response.data || response;
        
        if (!responseData) {
          throw new Error('Empty response from server');
        }

        const { token: newToken, user: userData } = responseData;

        // Validate response
        if (!newToken || !userData) {
          console.error('Invalid login response format:', responseData);
          throw new Error("Invalid login response format");
        }

        // Store authentication data
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log('Authentication data stored in localStorage');

        // Update state
        setToken(newToken);
        setUser(userData);
        console.log('Auth state updated');

        return { success: true, user: userData };
      } catch (error) {
        // Handle axios errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Login failed with status:', error.response.status);
          console.error('Response data:', error.response.data);
          throw new Error(error.response.data?.message || 'Login failed');
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          throw new Error('No response from server. Please try again.');
        } else {
          // Something happened in setting up the request
          console.error('Error setting up request:', error.message);
          throw error;
        }
      }
    } catch (error) {
      console.error("Login failed:", error);

      // Clear any partial state on error
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return {
        success: false,
        message: error.response?.data?.message || error.message || "Login failed. Please try again.",
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      
      // The response data is in response.data
      const responseData = response.data || response;
      
      // Extract token and user from response data
      const { token: newToken, user: newUser } = responseData;

      if (!newToken || !newUser) {
        console.error('Invalid signup response structure:', response);
        throw new Error("Invalid signup response from server");
      }

      // Store new user session
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error("Signup failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Signup failed. Please try again.",
      };
    }
  };

  // Logout function
  const logout = () => {
    console.log("User logging out...");

    // Clear stored data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear state
    setToken(null);
    setUser(null);

    // Redirect to login page
    window.location.href = "/login?session_expired=true";
  };

  // Role checking functions
  const isAgent = () => user?.role === "agent";
  const isAdmin = () => user?.role === "admin";
  const isUser = () => user?.role === "user";

  // Context value
  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAgent,
    isAdmin,
    isUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
