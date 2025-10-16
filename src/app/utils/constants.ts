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
// Purchase Constants
export const PURCHASE_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
} as const;

// Type for PrimeNG severity
export type PrimeSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined;

// Type-safe mapping
export const PURCHASE_STATUS_SEVERITY: Record<string, PrimeSeverity> = {
  [PURCHASE_STATUS.PENDING]: 'warn',
  [PURCHASE_STATUS.COMPLETED]: 'success',
  [PURCHASE_STATUS.CANCELLED]: 'danger'
};