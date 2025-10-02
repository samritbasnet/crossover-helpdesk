// User Dashboard - Main page for regular users
import {
  Add,
  Assignment,
  CheckCircle,
  Support,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";
import TicketCard from "../components/common/TicketCard";
import { useAuth } from "../context/AuthContext";
import { ticketsAPI } from "../services/api";
import { getErrorMessage } from "../utils/helpers";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load user's tickets and stats
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ticketsResponse, statsResponse] = await Promise.all([
        ticketsAPI.getTickets(),
        ticketsAPI.getDashboardStats(),
      ]);

      if (ticketsResponse.data && ticketsResponse.data.success) {
        setTickets(ticketsResponse.data.tickets || []);
      } else {
        setError("Failed to load tickets");
      }

      if (statsResponse.data && statsResponse.data.success) {
        setStats(statsResponse.data.stats || {});
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Statistics cards for users
  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Loading message="Loading your tickets..." />
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

      {/* User Statistics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="My Tickets"
            value={stats.myTickets || 0}
            icon={<Assignment fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Open Tickets"
            value={stats.myOpenTickets || 0}
            icon={<TrendingUp fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Resolved"
            value={stats.myResolvedTickets || 0}
            icon={<CheckCircle fontSize="large" />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Recent Tickets */}
      <Typography variant="h5" component="h2" gutterBottom>
        Your Recent Tickets
      </Typography>

      <ErrorMessage error={error} />

      {tickets.length === 0 ? (
        <EmptyState
          icon={Support}
          title="No tickets yet"
          description="Create your first support ticket to get started"
          actionLabel="Create Ticket"
          onAction={() => navigate("/create-ticket")}
        />
      ) : (
        <Grid container spacing={2}>
          {tickets.slice(0, 6).map((ticket) => (
            <Grid item xs={12} md={6} key={ticket.id}>
              <TicketCard ticket={ticket} />
            </Grid>
          ))}
        </Grid>
      )}

    </Container>
  );
};

export default UserDashboard;
