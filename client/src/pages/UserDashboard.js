// User Dashboard - Main page for regular users
import { Add, Support } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ticketsAPI } from "../services/api";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user's tickets
  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTickets();
      // Handle the response structure from our backend
      // Backend returns: { success: true, data: { tickets: [...], total: X, page: Y, totalPages: Z } }
      setTickets(response.data?.tickets || []);
    } catch (err) {
      console.error("Load tickets error:", err);
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "urgent":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your support tickets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/create-ticket")}
          size="large"
        >
          New Ticket
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Support color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{tickets.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tickets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Support color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {tickets.filter((t) => t.status === "open").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open Tickets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Support color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {tickets.filter((t) => t.status === "in_progress").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Support color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {tickets.filter((t) => t.status === "resolved").length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Tickets */}
      <Typography variant="h5" component="h2" gutterBottom>
        Your Recent Tickets
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tickets.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Support sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tickets yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Create your first support ticket to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate("/create-ticket")}
              >
                Create Ticket
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {tickets.slice(0, 6).map((ticket) => (
            <Grid item xs={12} md={6} key={ticket.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  "&:hover": { boxShadow: 3 },
                }}
                onClick={() => navigate(`/ticket/${ticket.id}`)}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Typography variant="h6" component="h3" noWrap>
                      {ticket.title}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                      <Chip
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {ticket.description}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(ticket.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tickets.length > 6 && (
        <Box textAlign="center" mt={3}>
          <Button variant="outlined" onClick={() => navigate("/tickets")}>
            View All Tickets
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default UserDashboard;
