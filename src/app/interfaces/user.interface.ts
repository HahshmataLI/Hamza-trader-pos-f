
export interface User {
  _id: string;
  id?: string; // Make id optional for frontend mapping
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales';
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'sales';
}