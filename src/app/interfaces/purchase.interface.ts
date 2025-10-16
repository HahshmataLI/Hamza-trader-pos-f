import { Product } from "./product.interface";
import { Supplier } from "./supplier.Interface";
import { User } from "./user.interface";

export interface PurchaseItem {
  _id?: string;
  product: string | Product;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  _id: string;
  purchaseNumber: string;
  supplier: string | Supplier;
  items: PurchaseItem[];
  totalAmount: number;
  purchaseDate: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  receivedBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  supplier: string;
  items: Omit<PurchaseItem, 'total' | '_id'>[];
  purchaseDate?: string;
  status?: 'Pending' | 'Completed' | 'Cancelled';
}

export interface UpdatePurchaseRequest extends Partial<CreatePurchaseRequest> {}

export interface UpdatePurchaseStatusRequest {
  status: 'Pending' | 'Completed' | 'Cancelled';
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
  status?: string;
  supplier?: string;
}

export interface PurchaseStats {
  _id: string;
  count: number;
  totalAmount: number;
}

export interface SinglePurchaseResponse {
  success: boolean;
  data: Purchase;
  message?: string;
}

export interface MultiplePurchasesResponse {
  success: boolean;
  data: Purchase[];
  stats?: PurchaseStats[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalPurchases: number;
  };
}

export type PurchaseResponse = SinglePurchaseResponse | MultiplePurchasesResponse;