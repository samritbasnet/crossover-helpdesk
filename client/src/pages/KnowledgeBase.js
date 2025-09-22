// Knowledge Base - Browse and search knowledge articles
import {
  Article,
  Person,
  Schedule,
  Search,
  ThumbUp,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { knowledgeAPI } from "../services/api";

const KnowledgeBase = () => {
  const navigate = useNavigate();

  // State for articles and UI
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for filters
  const [filters, setFilters] = useState({
    search: "",
    category: "",
  });

  // Load knowledge articles
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await knowledgeAPI.getArticles(filters);
      // Handle the response structure from our backend
      // Backend returns: { success: true, data: { articles: [...] } }
      setArticles(response.data?.articles || []);
    } catch (err) {
      console.error("Load articles error:", err);
      setError("Failed to load knowledge articles");
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value,
    });
  };

  // Handle search submission
  const handleSearch = () => {
    loadArticles();
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
    });
    // Reload articles without filters
    setLoading(true);
    knowledgeAPI
      .getArticles({})
      .then((response) => {
        setArticles(response.data?.articles || []);
      })
      .catch((err) => {
        console.error("Load articles error:", err);
        setError("Failed to load knowledge articles");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Mark article as helpful
  const markHelpful = async (articleId) => {
    try {
      await knowledgeAPI.markHelpful(articleId);
      // Reload articles to update helpful count
      loadArticles();
    } catch (err) {
      console.error("Failed to mark article as helpful:", err);
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "general":
        return "default";
      case "technical":
        return "primary";
      case "billing":
        return "success";
      case "account":
        return "warning";
      case "other":
        return "secondary";
      default:
        return "default";
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "general":
        return "📋";
      case "technical":
        return "🔧";
      case "billing":
        return "💳";
      case "account":
        return "👤";
      case "other":
        return "📄";
      default:
        return "📋";
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
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Knowledge Base
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find answers to common questions and solutions to frequent issues
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Search sx={{ mr: 1 }} />
          <Typography variant="h6">Search Knowledge Base</Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search articles"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              placeholder="Search by title, content, or keywords..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) => handleFilterChange("category", e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="billing">Billing</MenuItem>
                <MenuItem value="account">Account</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              onClick={handleSearch}
              fullWidth
              sx={{ height: "56px" }}
              startIcon={<Search />}
            >
              Search
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              onClick={clearFilters}
              fullWidth
              sx={{ height: "56px" }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
          <Article sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No articles found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.search || filters.category
              ? "Try adjusting your search criteria"
              : "No knowledge articles available yet"}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {articles.map((article) => (
            <Grid item xs={12} md={6} key={article.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Article Header */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Box flex={1}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {article.title}
                      </Typography>
                      <Chip
                        icon={<span>{getCategoryIcon(article.category)}</span>}
                        label={article.category}
                        color={getCategoryColor(article.category)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Article Content Preview */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {article.content}
                  </Typography>

                  {/* Article Metadata */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box display="flex" alignItems="center">
                      <Person sx={{ mr: 0.5, fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        {article.creator?.name || "Unknown"}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Schedule sx={{ mr: 0.5, fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Keywords */}
                  {article.keywords && article.keywords.length > 0 && (
                    <Box mb={2}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        gutterBottom
                      >
                        Keywords:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {article.keywords.slice(0, 3).map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))}
                        {article.keywords.length > 3 && (
                          <Chip
                            label={`+${article.keywords.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                {/* Article Actions */}
                <Box sx={{ p: 2, pt: 0 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/knowledge/${article.id}`)}
                    >
                      Read More
                    </Button>
                    <Box display="flex" alignItems="center">
                      <Button
                        size="small"
                        startIcon={<ThumbUp />}
                        onClick={() => markHelpful(article.id)}
                        sx={{ mr: 1 }}
                      >
                        Helpful
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        {article.helpfulCount || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Help Text */}
      <Paper
        elevation={1}
        sx={{ padding: 3, mt: 4, backgroundColor: "info.50" }}
      >
        <Typography variant="h6" gutterBottom>
          💡 Can't find what you're looking for?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          If you can't find the answer to your question in our knowledge base,
          you can:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Create a support ticket for personalized assistance
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Try different search terms or keywords
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Browse different categories
          </Typography>
          <Typography component="li" variant="body2">
            Contact our support team directly
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default KnowledgeBase;
