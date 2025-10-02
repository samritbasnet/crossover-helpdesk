// Create Ticket Component - Form for users to submit new support tickets
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
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ticketsAPI } from "../../services/api";
import { TICKET_PRIORITY } from "../../utils/constants";
import { getErrorMessage } from "../../utils/helpers";
import ErrorMessage from "../common/ErrorMessage";

const CreateTicket = () => {
  // State for form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: TICKET_PRIORITY.MEDIUM,
  });

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Hooks
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess(false);
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
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const result = await ticketsAPI.createTicket(formData);

      if (result.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          title: "",
          description: "",
          priority: TICKET_PRIORITY.MEDIUM,
        });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(result.data.message || "Failed to create ticket");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate("/dashboard");
  };

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
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Create New Ticket
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Submit a support request and our team will help you resolve it.
          </Typography>

          <ErrorMessage error={error} />

          {success && (
            <ErrorMessage
              error="Ticket created successfully! Redirecting to dashboard..."
              severity="success"
              title="Success"
            />
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
                  disabled={loading}
                  helperText="Brief description of your issue (5-200 characters)"
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>

              {/* Priority Field */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={loading}>
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
                  disabled={loading}
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
                disabled={loading}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? null : <Save />}
                disabled={loading}
                size="large"
              >
                {loading ? "Creating..." : "Create Ticket"}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Help Text */}
        <Paper
          elevation={1}
          sx={{ padding: 3, mt: 3, backgroundColor: "grey.50" }}
        >
          <Typography variant="h6" gutterBottom>
            💡 Tips for a better support experience:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Be specific about the problem you're experiencing
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Include any error messages you see
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Describe the steps that led to the issue
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Mention your browser/device if relevant
            </Typography>
            <Typography component="li" variant="body2">
              Check our Knowledge Base first for quick solutions
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateTicket;
