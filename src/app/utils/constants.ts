//export const API_URL = 'http://localhost:5000/api';
 export const API_URL = 'https://hamza-trader-12399c3f50ff.herokuapp.com/api';


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
// Customer Constants
export const CUSTOMER_TYPES = {
  REGULAR: 'Regular',
  VIP: 'VIP',
  WHOLESALE: 'Wholesale'
} as const;

// Fix: Use proper PrimeNG severity values
export const CUSTOMER_TYPE_SEVERITY: { 
  [key: string]: "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined 
} = {
  [CUSTOMER_TYPES.REGULAR]: 'secondary',
  [CUSTOMER_TYPES.VIP]: 'success',
  [CUSTOMER_TYPES.WHOLESALE]: 'warn' // Changed from 'warning' to 'warn'
} as const;

// Sales Constants
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  DIGITAL: 'Digital',
  CREDIT: 'Credit'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially Paid',
  REFUNDED: 'Refunded'
} as const;

export const SALE_STATUS = {
  COMPLETED: 'Completed',
  RETURNED: 'Returned',
  PARTIALLY_RETURNED: 'Partially Returned',
  CANCELLED: 'Cancelled'
} as const;

export const PAYMENT_STATUS_SEVERITY = {
  [PAYMENT_STATUS.PAID]: 'success',
  [PAYMENT_STATUS.PENDING]: 'warn',
  [PAYMENT_STATUS.PARTIALLY_PAID]: 'info',
  [PAYMENT_STATUS.REFUNDED]: 'danger'
} as const;

export const SALE_STATUS_SEVERITY = {
  [SALE_STATUS.COMPLETED]: 'success',
  [SALE_STATUS.RETURNED]: 'danger',
  [SALE_STATUS.PARTIALLY_RETURNED]: 'warn',
  [SALE_STATUS.CANCELLED]: 'danger'
} as const;
