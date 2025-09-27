// Ticket Details Component - View individual ticket information
import { ArrowBack, Delete, Edit } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ticketsAPI } from "../../services/api";

const TicketDetails = () => {
  const { isAgent } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTicket(id);
      // Handle the response structure from our backend
      // Backend returns: { success: true, ticket: {...} }
      setTicket(response.ticket);
    } catch (err) {
      console.error("Load ticket error:", err);
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  // Load ticket details
  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // Handle delete ticket
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await ticketsAPI.deleteTicket(id);
        navigate("/dashboard");
      } catch (err) {
        setError("Failed to delete ticket");
      }
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!ticket) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Ticket not found</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
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
        mb={3}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>

        {!isAgent() && (
          <Box>
            <Button
              startIcon={<Edit />}
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={() => navigate(`/edit-ticket/${id}`)}
            >
              Edit
            </Button>
            <Button
              startIcon={<Delete />}
              variant="outlined"
              color="error"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      <Paper elevation={3} sx={{ padding: 4 }}>
        {/* Ticket Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
        >
          <Box flex={1}>
            <Typography variant="h4" component="h1" gutterBottom>
              {ticket.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ticket #{ticket.id}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip
              label={ticket.status}
              color={getStatusColor(ticket.status)}
              size="large"
            />
            <Chip
              label={ticket.priority}
              color={getPriorityColor(ticket.priority)}
              size="large"
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Ticket Information Grid */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Ticket Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Created:</strong>{" "}
                {new Date(ticket.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Last Updated:</strong>{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Submitted by:</strong> {ticket.user?.name || "Unknown"}
              </Typography>
              {ticket.assignedAgent && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Assigned to:</strong> {ticket.assignedAgent.name}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Status Information
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Current Status:</strong> {ticket.status}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Priority Level:</strong> {ticket.priority}
              </Typography>
              {ticket.resolutionNotes && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Resolution:</strong> Available
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Description */}
        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Paper
          variant="outlined"
          sx={{ padding: 3, backgroundColor: "grey.50" }}
        >
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {ticket.description}
          </Typography>
        </Paper>

        {/* Resolution Notes (if available) */}
        {ticket.resolutionNotes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Resolution Notes
            </Typography>
            <Paper
              variant="outlined"
              sx={{ padding: 3, backgroundColor: "success.50" }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {ticket.resolutionNotes}
              </Typography>
            </Paper>
          </>
        )}

        {/* Status Timeline */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          Status Timeline
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "success.main",
                mr: 2,
              }}
            />
            <Typography variant="body2">
              <strong>Created</strong> -{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </Typography>
          </Box>

          {ticket.status === "in_progress" && (
            <Box display="flex" alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "warning.main",
                  mr: 2,
                }}
              />
              <Typography variant="body2">
                <strong>In Progress</strong> -{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}

          {ticket.status === "resolved" && (
            <Box display="flex" alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "success.main",
                  mr: 2,
                }}
              />
              <Typography variant="body2">
                <strong>Resolved</strong> -{" "}
                {new Date(ticket.updatedAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TicketDetails;
