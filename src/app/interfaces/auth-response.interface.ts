export interface AuthResponse {
  success: boolean;
  token: string;
  data: {
    id: string; // Backend returns 'id'
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'sales';
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}