import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          // Parse stored user
          const parsedUser = JSON.parse(storedUser);

          // Verify token with backend
          await authAPI.getCurrentUser();

          setUser(parsedUser);
          setToken(storedToken);
        } catch (error) {
          // Token invalid -> clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      // Clear any existing state before login attempt
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const response = await authAPI.login(credentials);
      console.log('Login response:', response);

      const { token: newToken, user: userData } = response;

      if (!newToken || !userData) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial state on error
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return {
        success: false,
        message: error.response?.data?.message || error.message || "Login failed",
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData);
      const { token: newToken, user: newUser } = response; // Fixed: response instead of response.data

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

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

  const logout = () => {
    console.log('Logging out user...');

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear state
    setToken(null);
    setUser(null);

    // Force redirect to login page
    window.location.href = "/login?session_expired=true";
  };

  const isAgent = () => user?.role === "agent";
  const isUser = () => user?.role === "user";

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, isAgent, isUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
