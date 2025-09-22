// Main App Component - Entry point with routing and authentication
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import UpdateTicket from "./components/Agent/UpdateTicket";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import ArticleDetail from "./components/Knowledge/ArticleDetail";
import Navbar from "./components/Layout/Navbar";
import CreateTicket from "./components/Tickets/CreateTicket";
import EditTicket from "./components/Tickets/EditTicket";
import TicketDetails from "./components/Tickets/TicketDetails";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AgentDashboard from "./pages/AgentDashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import UserDashboard from "./pages/UserDashboard";

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? (
    <Navigate to={user.role === "agent" ? "/agent-dashboard" : "/dashboard"} />
  ) : (
    children
  );
};

// Main App Routes
const AppRoutes = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-ticket"
              element={
                <ProtectedRoute>
                  <CreateTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ticket/:id"
              element={
                <ProtectedRoute>
                  <TicketDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-ticket/:id"
              element={
                <ProtectedRoute>
                  <EditTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent-dashboard"
              element={
                <ProtectedRoute>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/ticket/:id/update"
              element={
                <ProtectedRoute>
                  <UpdateTicket />
                </ProtectedRoute>
              }
            />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/knowledge/:id" element={<ArticleDetail />} />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

function App() {
  return <AppRoutes />;
}

export default App;
