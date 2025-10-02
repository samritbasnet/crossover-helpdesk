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
      // Clear existing auth state
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Call login API
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response.data;

      // Validate response
      if (!newToken || !userData) {
        throw new Error("Invalid login response");
      }

      // Store auth data
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      // Clear state on error
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token: newToken, user: newUser } = response.data;

      if (!newToken || !newUser) {
        throw new Error("Invalid signup response");
      }

      // Store new user session
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message || error.message || "Signup failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
