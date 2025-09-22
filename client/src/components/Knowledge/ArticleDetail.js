// Article Detail Component - View individual knowledge article
import {
  ArrowBack,
  Category,
  Person,
  Schedule,
  ThumbUp,
} from "@mui/icons-material";
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
import { knowledgeAPI } from "../../services/api";

const ArticleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [helpfulLoading, setHelpfulLoading] = useState(false);

  // Load article details
  useEffect(() => {
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await knowledgeAPI.getArticle(id);
      // Handle the response structure from our backend
      // Backend returns: { success: true, article: {...} }
      setArticle(response.article);
    } catch (err) {
      console.error("Load article error:", err);
      setError("Failed to load article");
    } finally {
      setLoading(false);
    }
  };

  // Mark article as helpful
  const markHelpful = async () => {
    try {
      setHelpfulLoading(true);
      await knowledgeAPI.markHelpful(id);
      // Reload article to update helpful count
      await loadArticle();
    } catch (err) {
      console.error("Failed to mark article as helpful:", err);
    } finally {
      setHelpfulLoading(false);
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/knowledge")}
          sx={{ mt: 2 }}
        >
          Back to Knowledge Base
        </Button>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Article not found</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/knowledge")}
          sx={{ mt: 2 }}
        >
          Back to Knowledge Base
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
          onClick={() => navigate("/knowledge")}
        >
          Back to Knowledge Base
        </Button>
        <Button
          variant="contained"
          startIcon={
            helpfulLoading ? <CircularProgress size={20} /> : <ThumbUp />
          }
          onClick={markHelpful}
          disabled={helpfulLoading}
        >
          {helpfulLoading ? "Marking..." : "Mark as Helpful"}
        </Button>
      </Box>

      <Paper elevation={3} sx={{ padding: 4 }}>
        {/* Article Header */}
        <Box mb={3}>
          <Typography variant="h3" component="h1" gutterBottom>
            {article.title}
          </Typography>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Chip
              icon={<span>{getCategoryIcon(article.category)}</span>}
              label={article.category}
              color={getCategoryColor(article.category)}
              size="medium"
            />
            <Box display="flex" alignItems="center">
              <ThumbUp sx={{ mr: 0.5, fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                {article.helpfulCount || 0} found this helpful
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Article Metadata */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Person sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Created by:</strong>{" "}
                {article.creator?.name || "Unknown"}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Schedule sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Published:</strong>{" "}
                {new Date(article.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <Category sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Category:</strong> {article.category}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Last updated:</strong>{" "}
              {new Date(article.updatedAt).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Article Content */}
        <Typography variant="h6" gutterBottom>
          Article Content
        </Typography>
        <Paper
          variant="outlined"
          sx={{ padding: 3, backgroundColor: "grey.50" }}
        >
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
          >
            {article.content}
          </Typography>
        </Paper>

        {/* Keywords */}
        {article.keywords && article.keywords.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Related Keywords
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {article.keywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </>
        )}

        {/* Helpful Section */}
        <Divider sx={{ my: 3 }} />
        <Box textAlign="center" py={2}>
          <Typography variant="h6" gutterBottom>
            Was this article helpful?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Let us know if this article helped you solve your problem
          </Typography>
          <Button
            variant="contained"
            startIcon={
              helpfulLoading ? <CircularProgress size={20} /> : <ThumbUp />
            }
            onClick={markHelpful}
            disabled={helpfulLoading}
            size="large"
          >
            {helpfulLoading ? "Marking..." : "Yes, it was helpful"}
          </Button>
        </Box>
      </Paper>

      {/* Related Actions */}
      <Paper
        elevation={1}
        sx={{ padding: 3, mt: 3, backgroundColor: "info.50" }}
      >
        <Typography variant="h6" gutterBottom>
          Still need help?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          If this article didn't solve your problem, you can:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Create a support ticket for personalized assistance
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Browse other articles in the same category
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            Search for different keywords
          </Typography>
          <Typography component="li" variant="body2">
            Contact our support team directly
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ArticleDetail;
