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
      // Clear any existing authentication state
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Call login API
      const response = await authAPI.login(credentials);

      // Extract token and user data
      const { token: newToken, user: userData } = response;

      // Validate response
      if (!newToken || !userData) {
        throw new Error("Invalid login response");
      }

      // Store authentication data
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error("Login failed:", error.message);

      // Clear any partial state on error
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return {
        success: false,
        message: error.message || "Login failed. Please try again.",
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token: newToken, user: newUser } = response;

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
      console.error("Signup failed:", error.message);
      return {
        success: false,
        message: error.message || "Signup failed. Please try again.",
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
