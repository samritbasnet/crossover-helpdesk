// Edit Ticket Component - For users to edit their own tickets
import { ArrowBack, Save } from "@mui/icons-material";
import {
  Box,
  Button,
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
import ErrorMessage from "../common/ErrorMessage";
import Loading from "../common/Loading";
import { useAuth } from "../../context/AuthContext";
import { ticketsAPI } from "../../services/api";
import { getErrorMessage } from "../../utils/helpers";
import { TICKET_PRIORITY, TICKET_STATUS } from "../../utils/constants";

const EditTicket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  // State management
  const [ticket, setTicket] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: TICKET_PRIORITY.MEDIUM,
    status: TICKET_STATUS.OPEN,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await ticketsAPI.getTicket(id);
        
        if (response.success && response.ticket) {
          const ticketData = response.ticket;
          setTicket(ticketData);
          setFormData({
            title: ticketData.title || "",
            description: ticketData.description || "",
            priority: ticketData.priority || TICKET_PRIORITY.MEDIUM,
            status: ticketData.status || TICKET_STATUS.OPEN,
          });
        } else {
          setError("Failed to load ticket data");
        }
      } catch (err) {
        console.error("Error loading ticket:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTicket();
    }
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (formData.title.trim().length < 3) {
      setError("Title must be at least 3 characters long");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (formData.description.trim().length < 10) {
      setError("Description must be at least 10 characters long");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await ticketsAPI.updateTicket(id, formData);

      if (response.success) {
        setSuccess("Ticket updated successfully!");
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(`/ticket/${id}`);
        }, 2000);
      } else {
        setError(response.message || "Failed to update ticket");
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/ticket/${id}`);
  };

  // Show loading state
  if (loading) {
    return <Loading message="Loading ticket..." />;
  }

  // Show error if ticket not found
  if (!ticket) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <ErrorMessage 
            error="Ticket not found or you don't have permission to edit it"
            title="Access Denied"
          />
          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
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
            Edit Ticket #{id}
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Update your ticket information below.
          </Typography>

          <ErrorMessage error={error} />
          
          {success && (
            <ErrorMessage 
              error={success}
              severity="success"
              title="Success"
            />
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                  helperText="Brief description of your issue (3-100 characters)"
                  inputProps={{ maxLength: 100 }}
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
                    <MenuItem value={TICKET_PRIORITY.LOW}>
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
                    <MenuItem value={TICKET_PRIORITY.MEDIUM}>
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
                    <MenuItem value={TICKET_PRIORITY.HIGH}>
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
                    <MenuItem value={TICKET_PRIORITY.URGENT}>
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

              {/* Status Field */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={saving}>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    <MenuItem value={TICKET_STATUS.OPEN}>Open</MenuItem>
                    <MenuItem value={TICKET_STATUS.IN_PROGRESS}>In Progress</MenuItem>
                    <MenuItem value={TICKET_STATUS.RESOLVED}>Resolved</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Submitted By Field (Read-only) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="submittedBy"
                  label="Submitted by"
                  value={ticket.user_name || user?.name || ""}
                  disabled
                  helperText="Ticket creator (cannot be changed)"
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
                  helperText="Detailed description of your issue (10-2000 characters)"
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
                startIcon={saving ? null : <Save />}
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
          sx={{ p: 3, mt: 3, backgroundColor: "grey.50" }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Need help?</strong> You can update the title, description, 
            and priority of your ticket. If you need to change the status to 
            "Closed", please contact support or wait for an agent to resolve your issue.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default EditTicket;
