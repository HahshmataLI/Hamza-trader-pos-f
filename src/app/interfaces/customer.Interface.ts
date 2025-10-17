export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: 'Regular' | 'VIP' | 'Wholesale';
  totalPurchases: number;
  lastPurchaseDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customerType?: 'Regular' | 'VIP' | 'Wholesale';
  isActive?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface SingleCustomerResponse {
  success: boolean;
  data: Customer;
}

export interface MultipleCustomersResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCustomers: number;
  };
}

export type CustomerResponse = SingleCustomerResponse | MultipleCustomersResponse;