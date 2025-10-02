// Main App Component - Entry point with routing and authentication
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
import ResetPassword from "./components/Auth/ResetPassword";
import Signup from "./components/Auth/Signup";
import Loading from "./components/common/Loading";
import ArticleDetail from "./components/Knowledge/ArticleDetail";
import Navbar from "./components/Layout/Navbar";
import CreateTicket from "./components/Tickets/CreateTicket";
import EditTicket from "./components/Tickets/EditTicket";
import TicketDetails from "./components/Tickets/TicketDetails";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AgentDashboard from "./pages/AgentDashboard";
import KnowledgeBase from "./pages/KnowledgeBase";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SupportManagement from "./pages/SupportManagement";
import UserDashboard from "./pages/UserDashboard";
import { USER_ROLES } from "./utils/constants";

// Import the API test page
import ApiTest from "./pages/ApiTest";

// Public routes configuration
const publicRoutes = [
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/knowledge", element: <KnowledgeBase /> },
  { path: "/knowledge/:id", element: <ArticleDetail /> },
  { path: "/api-test", element: <ApiTest /> },
];

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
    return <Loading message="Checking authentication..." />;
  }

  return user ? children : <Navigate to="/login" />;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking authentication..." />;
  }

  const dashboardRoute =
    user?.role === USER_ROLES.AGENT || user?.role === USER_ROLES.ADMIN
      ? "/agent-dashboard"
      : "/dashboard";

  return user ? <Navigate to={dashboardRoute} /> : children;
};

// Main App Routes
const AppRoutes = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Default route redirects to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public routes */}
            {publicRoutes.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={<PublicRoute>{element}</PublicRoute>}
              />
            ))}

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
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support-management"
              element={
                <ProtectedRoute>
                  <SupportManagement />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* 404 Route - Must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

function App() {
  return <AppRoutes />;
}

export default App;
