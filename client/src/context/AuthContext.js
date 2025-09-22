// Authentication Context - Manages user authentication state
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  // State for user authentication
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getCurrentUser();
          setUser(response.user);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response;

      // Store in localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token: newToken, user: newUser } = response;

      // Store in localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear state
    setToken(null);
    setUser(null);
  };

  // Check if user is an agent
  const isAgent = () => {
    return user && user.role === "agent";
  };

  // Check if user is a regular user
  const isUser = () => {
    return user && user.role === "user";
  };

  // Value object to provide to context consumers
  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAgent,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
