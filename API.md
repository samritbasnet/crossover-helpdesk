# 📚 Crossover Helpdesk API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user" // Optional: "user", "agent", "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Verify Token
```http
GET /auth/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

## 🎫 Ticket Endpoints

### Get All Tickets
```http
GET /tickets?status=open&priority=high&page=1&limit=10
```

**Query Parameters:**
- `status` (optional): open, in-progress, resolved, closed
- `priority` (optional): low, medium, high, urgent
- `category` (optional): general, technical, billing, etc.
- `search` (optional): Search in title and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "tickets": [
    {
      "id": 1,
      "title": "Login Issue",
      "description": "Cannot log into the system",
      "status": "open",
      "priority": "high",
      "category": "technical",
      "user_id": 1,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "assigned_to": null,
      "assigned_to_name": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "stats": {
    "open": 10,
    "in-progress": 8,
    "resolved": 5,
    "closed": 2
  }
}
```

### Get Single Ticket
```http
GET /tickets/:id
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": 1,
    "title": "Login Issue",
    "description": "Cannot log into the system",
    "status": "open",
    "priority": "high",
    "category": "technical",
    "user_id": 1,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "assigned_to": 2,
    "assigned_to_name": "Jane Agent",
    "assigned_to_email": "jane@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:00:00Z",
    "comments": [
      {
        "id": 1,
        "ticket_id": 1,
        "user_id": 2,
        "user_name": "Jane Agent",
        "user_role": "agent",
        "comment": "I'm looking into this issue now.",
        "created_at": "2024-01-15T11:00:00Z"
      }
    ]
  }
}
```

### Create Ticket
```http
POST /tickets
```

**Request Body:**
```json
{
  "title": "New Issue",
  "description": "Detailed description of the problem",
  "priority": "medium", // low, medium, high, urgent
  "category": "technical" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "id": 2,
    "title": "New Issue",
    "description": "Detailed description of the problem",
    "status": "open",
    "priority": "medium",
    "category": "technical",
    "user_id": 1,
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

### Update Ticket
```http
PUT /tickets/:id
```

**Request Body:**
```json
{
  "title": "Updated Title", // Optional
  "description": "Updated description", // Optional
  "status": "in-progress", // Optional: open, in-progress, resolved, closed
  "priority": "high", // Optional: low, medium, high, urgent
  "category": "billing", // Optional
  "assigned_to": 2 // Optional: Agent ID (admin only)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "ticket": {
    "id": 1,
    "title": "Updated Title",
    "description": "Updated description",
    "status": "in-progress",
    "priority": "high",
    "category": "billing",
    "assigned_to": 2,
    "updated_at": "2024-01-15T13:00:00Z"
  }
}
```

### Delete Ticket
```http
DELETE /tickets/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket and associated comments deleted successfully"
}
```

---

## 📚 Knowledge Base Endpoints

### Get All Articles
```http
GET /knowledge?search=password&category=howto&page=1&limit=10
```

**Query Parameters:**
- `search` (optional): Search in title, content, and keywords
- `category` (optional): Filter by category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "How to Reset Password",
      "content": "Step-by-step guide to reset your password...",
      "keywords": "password,reset,login",
      "category": "howto",
      "helpful_count": 15,
      "created_by": 2,
      "created_by_name": "Jane Agent",
      "created_by_email": "jane@example.com",
      "created_at": "2024-01-10T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### Get Single Article
```http
GET /knowledge/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "How to Reset Password",
    "content": "Step-by-step guide to reset your password...",
    "keywords": "password,reset,login",
    "category": "howto",
    "helpful_count": 15,
    "created_by": 2,
    "created_by_name": "Jane Agent",
    "created_by_email": "jane@example.com",
    "created_at": "2024-01-10T09:00:00Z"
  }
}
```

### Create Article (Protected)
```http
POST /knowledge
```

**Request Body:**
```json
{
  "title": "New Help Article",
  "content": "Detailed content of the article...",
  "keywords": "help,guide,tutorial", // Optional
  "category": "howto" // Optional, default: "general"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Article created",
  "data": {
    "id": 2,
    "title": "New Help Article",
    "content": "Detailed content of the article...",
    "keywords": "help,guide,tutorial",
    "category": "howto",
    "helpful_count": 0,
    "created_by": 1,
    "created_at": "2024-01-15T14:00:00Z"
  }
}
```

### Update Article (Protected)
```http
PUT /knowledge/:id
```

**Request Body:**
```json
{
  "title": "Updated Article Title", // Optional
  "content": "Updated content...", // Optional
  "keywords": "updated,keywords", // Optional
  "category": "faq" // Optional
}
```

### Delete Article (Protected)
```http
DELETE /knowledge/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Article deleted"
}
```

### Mark Article as Helpful (Public)
```http
POST /knowledge/:id/helpful
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!",
  "helpful_count": 16
}
```

---

## 👥 User Management Endpoints

### Get Current User Profile
```http
GET /users/profile
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "ticketStats": {
      "total_tickets": 5,
      "open_tickets": 2,
      "in_progress_tickets": 1,
      "resolved_tickets": 2,
      "closed_tickets": 0
    }
  }
}
```

### Update Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### Change Password
```http
PUT /users/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456!"
}
```

---

## 🚨 Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## 🔒 Permission Levels

### User Roles:
- **user**: Can create and manage their own tickets, view knowledge base
- **agent**: Can manage all tickets, create knowledge articles
- **admin**: Full access to all features including user management

### Endpoint Permissions:
- 🟢 **Public**: No authentication required
- 🟡 **Protected**: Requires valid JWT token
- 🔴 **Admin Only**: Requires admin role
- 🟠 **Agent/Admin**: Requires agent or admin role

---

## 📝 Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API**: 100 requests per minute per user
- **File uploads**: 10 requests per minute per user

---

## 🚀 Quick Start Examples

### JavaScript/Axios Example:
```javascript
// Login
const loginResponse = await axios.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

const token = loginResponse.data.token;

// Create ticket with auth
const ticketResponse = await axios.post('/api/tickets', {
  title: 'Help needed',
  description: 'I need assistance with...',
  priority: 'medium'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL Examples:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'

# Get tickets
curl -X GET "http://localhost:3000/api/tickets?status=open" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Development Notes

- All timestamps are in ISO 8601 format (UTC)
- Passwords must be at least 6 characters
- Email addresses are validated and must be unique
- Ticket titles must be at least 3 characters
- Ticket descriptions must be at least 10 characters
- Knowledge article content supports Markdown formatting
