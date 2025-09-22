// Update Ticket Component - For agents to update ticket status and add resolution notes
import { ArrowBack, Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ticketsAPI } from "../../services/api";

const UpdateTicket = () => {
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  // State for ticket data
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for form data
  const [formData, setFormData] = useState({
    status: "open",
    resolutionNotes: "",
  });

  // Load ticket details
  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketsAPI.getTicket(id);
      // Handle the response structure from our backend
      // Backend returns: { success: true, ticket: {...} }
      const ticketData = response.ticket;
      setTicket(ticketData);
      setFormData({
        status: ticketData.status,
        resolutionNotes: ticketData.resolutionNotes || "",
      });
    } catch (err) {
      console.error("Load ticket error:", err);
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear messages when user makes changes
    if (error) setError("");
    if (success) setSuccess("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await ticketsAPI.updateTicket(id, formData);

      if (result.success) {
        setSuccess("Ticket updated successfully!");
        // Reload ticket data
        await loadTicket();
      } else {
        setError(result.message || "Failed to update ticket");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "error";
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

  // Redirect if not an agent
  if (!isAgent()) {
    navigate("/dashboard");
    return null;
  }

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

  if (error && !ticket) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/agent-dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Agent Dashboard
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
          onClick={() => navigate("/agent-dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Agent Dashboard
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
          onClick={() => navigate("/agent-dashboard")}
        >
          Back to Agent Dashboard
        </Button>
        <Typography variant="h4" component="h1">
          Update Ticket #{ticket.id}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Ticket Information */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ticket Information
            </Typography>

            <Box mb={2}>
              <Typography variant="h5" gutterBottom>
                {ticket.title}
              </Typography>
              <Box display="flex" gap={1} mb={2}>
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

            <Divider sx={{ my: 2 }} />

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

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Paper
              variant="outlined"
              sx={{ padding: 2, backgroundColor: "grey.50" }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </Typography>
            </Paper>
          </Paper>
        </Grid>

        {/* Update Form */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Ticket Status
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Status Update */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      label="Status"
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <MenuItem value="open">
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: "error.main",
                              mr: 1,
                            }}
                          />
                          Open - New ticket awaiting attention
                        </Box>
                      </MenuItem>
                      <MenuItem value="in_progress">
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: "warning.main",
                              mr: 1,
                            }}
                          />
                          In Progress - Currently being worked on
                        </Box>
                      </MenuItem>
                      <MenuItem value="resolved">
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: "success.main",
                              mr: 1,
                            }}
                          />
                          Resolved - Issue has been fixed
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Resolution Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    name="resolutionNotes"
                    label="Resolution Notes"
                    value={formData.resolutionNotes}
                    onChange={handleChange}
                    disabled={saving}
                    helperText="Add notes about how the issue was resolved, steps taken, or any additional information for the user."
                    placeholder="Describe the resolution steps, provide solutions, or add any relevant information..."
                  />
                </Grid>

                {/* Current Agent Info */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Updated by"
                    value={user?.name || ""}
                    disabled
                    helperText="Your name (automatically filled)"
                  />
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box display="flex" justifyContent="space-between" mt={4}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/agent-dashboard")}
                  disabled={saving}
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving}
                  size="large"
                >
                  {saving ? "Updating..." : "Update Ticket"}
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Status Guidelines */}
          <Paper
            elevation={1}
            sx={{ padding: 3, mt: 3, backgroundColor: "info.50" }}
          >
            <Typography variant="h6" gutterBottom>
              📋 Status Guidelines:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Open:</strong> New ticket, needs initial review
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>In Progress:</strong> You're actively working on this
                ticket
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Resolved:</strong> Issue is fixed, include resolution
                notes
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UpdateTicket;
