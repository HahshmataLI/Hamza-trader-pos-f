export const API_URL = 'http://localhost:5000/api';
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  ME: '/auth/me'
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user'
};

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales'
} as const;
// Add to existing constants
export const CATEGORY_LEVELS = {
  MAIN: 1,
  SUB: 2,
  SUB_SUB: 3
} as const;

export const ATTRIBUTE_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  BOOLEAN: 'boolean'
} as const;