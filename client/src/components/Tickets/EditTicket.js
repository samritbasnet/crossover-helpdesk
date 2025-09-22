// Edit Ticket Component - For users to edit their own tickets
import { ArrowBack, Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
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

const EditTicket = () => {
  const { user } = useAuth();
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
    title: "",
    description: "",
    priority: "medium",
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

      // Check if user owns this ticket
      if (ticketData.userId !== user?.id) {
        setError("You can only edit your own tickets");
        return;
      }

      // Check if ticket can be edited (only open tickets)
      if (ticketData.status !== "open") {
        setError("You can only edit open tickets");
        return;
      }

      setTicket(ticketData);
      setFormData({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
      });
    } catch (err) {
      console.error("Load ticket error:", err);
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear messages when user makes changes
    if (error) setError("");
    if (success) setSuccess("");
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (formData.title.length < 5) {
      setError("Title must be at least 5 characters long");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (formData.description.length < 10) {
      setError("Description must be at least 10 characters long");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setSaving(false);
      return;
    }

    try {
      const result = await ticketsAPI.updateTicket(id, formData);

      if (result.success) {
        setSuccess("Ticket updated successfully!");
        // Redirect to ticket details after 2 seconds
        setTimeout(() => {
          navigate(`/ticket/${id}`);
        }, 2000);
      } else {
        setError(result.message || "Failed to update ticket");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/ticket/${id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleCancel}
            sx={{ mr: 2 }}
          >
            Back to Ticket
          </Button>
          <Typography variant="h4" component="h1">
            Edit Ticket #{ticket.id}
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Update your support request details
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

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Title Field */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="title"
                  label="Ticket Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Brief description of your issue (5-200 characters)"
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>

              {/* Priority Field */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={saving}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    label="Priority"
                    onChange={handleChange}
                  >
                    <MenuItem value="low">
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
                        Low - General questions
                      </Box>
                    </MenuItem>
                    <MenuItem value="medium">
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
                        Medium - Minor issues
                      </Box>
                    </MenuItem>
                    <MenuItem value="high">
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
                        High - Important issues
                      </Box>
                    </MenuItem>
                    <MenuItem value="urgent">
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: "error.dark",
                            mr: 1,
                          }}
                        />
                        Urgent - Critical issues
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* User Info (Read-only) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Submitted by"
                  value={user?.name || ""}
                  disabled
                  helperText="Your name (automatically filled)"
                />
              </Grid>

              {/* Description Field */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  multiline
                  rows={6}
                  id="description"
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={saving}
                  helperText="Detailed description of your issue (10-2000 characters). Include steps to reproduce, error messages, and any relevant information."
                  inputProps={{ maxLength: 2000 }}
                />
              </Grid>

              {/* Character Count */}
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Description: {formData.description.length}/2000 characters
                </Typography>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button
                variant="outlined"
                onClick={handleCancel}
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

        {/* Help Text */}
        <Paper
          elevation={1}
          sx={{ padding: 3, mt: 3, backgroundColor: "warning.50" }}
        >
          <Typography variant="h6" gutterBottom>
            ⚠️ Important Notes:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              You can only edit tickets that are still "Open"
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Once an agent starts working on your ticket, editing is disabled
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Make sure to provide clear and detailed information
            </Typography>
            <Typography component="li" variant="body2">
              Changes will be visible to support agents immediately
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EditTicket;
