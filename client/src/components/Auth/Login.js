// Login Component - User login form
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  // State for form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(""); // clear error on typing
  };

  // Validate form
  const validateForm = () => {
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Invalid email format");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting login form...');
      const result = await login(formData);
      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, redirecting...');
        // Use the user data from the login result
        const user = result.user || JSON.parse(localStorage.getItem("user") || '{}');
        console.log('User role:', user.role);
        
        // Redirect based on user role
        if (user.role === "agent" || user.role === "admin") {
          console.log('Redirecting to agent dashboard');
          navigate("/agent-dashboard");
        } else {
          console.log('Redirecting to user dashboard');
          navigate("/dashboard");
        }
      } else {
        console.error('Login failed:', result.message);
        setError(result.message || "Invalid credentials, please try again.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || "An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            HelpDesk Login
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Sign in to access your support tickets
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 1 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box textAlign="center" mt={1}>
              <Button 
                component={Link}
                to="/reset-password"
                color="primary" 
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Forgot Password?
              </Button>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2">
                Don’t have an account?{" "}
                <Link to="/signup" style={{ textDecoration: "none" }}>
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
