// Application constants

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const USER_ROLES = {
  USER: 'user',
  AGENT: 'agent',
  ADMIN: 'admin',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  AGENT_DASHBOARD: '/agent-dashboard',
  CREATE_TICKET: '/create-ticket',
  TICKET_DETAILS: '/ticket/:id',
  EDIT_TICKET: '/edit-ticket/:id',
  KNOWLEDGE: '/knowledge',
  KNOWLEDGE_ARTICLE: '/knowledge/:id',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
  },
  TICKETS: '/tickets',
  USERS: '/users',
  KNOWLEDGE: '/knowledge',
};
