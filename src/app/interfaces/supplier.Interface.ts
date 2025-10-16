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

export interface SupplierResponse {
  success: boolean;
  data: Supplier | Supplier[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalSuppliers: number;
  };
}