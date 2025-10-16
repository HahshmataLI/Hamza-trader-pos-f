export interface Supplier {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  isActive?: boolean;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {}

export interface SupplierFilters {
  search?: string;
  page?: number;
  limit?: number;
}

// Separate response interfaces for single vs multiple suppliers
export interface SingleSupplierResponse {
  success: boolean;
  data: Supplier;
}

export interface MultipleSuppliersResponse {
  success: boolean;
  data: Supplier[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalSuppliers: number;
  };
}

// Union type for general use
export type SupplierResponse = SingleSupplierResponse | MultipleSuppliersResponse;