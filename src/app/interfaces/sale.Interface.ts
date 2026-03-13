import { Customer } from "./customer.Interface";
import { Product } from "./product.interface";
import { User } from "./user.interface";


export interface SaleItem {
  _id?: string;
  product: string | Product;
  quantity: number;
  unitMrp: number;
  unitSalePrice: number;
  total: number;
  returnedQuantity: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  saleNumber: string;
  customer?: string | Customer;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Digital' | 'Credit';
  paymentStatus: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded';
  saleDate: string;
  salesPerson: string | User;
  status: 'Completed' | 'Returned' | 'Partially Returned' | 'Cancelled';
  notes?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  customer?: string;
  items: CreateSaleItem[];  // Updated to support barcode
  paymentMethod: 'Cash' | 'Card' | 'Digital' | 'Credit';
  discount?: number;
  taxAmount?: number;
  notes?: string;
}


export interface ReturnSaleRequest {
  returnItems: Array<{
    itemId: string;
    quantity: number;
  }>;
  reason: string;
}

export interface CancelSaleRequest {
  reason: string;
}

export interface SaleFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  customer?: string;
}

export interface SaleAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  averageSale: number;
}

export interface SingleSaleResponse {
  success: boolean;
  data: Sale;
  message?: string;
}

export interface MultipleSalesResponse {
  success: boolean;
  data: Sale[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalSales: number;
  };
}

export interface SaleAnalyticsResponse {
  success: boolean;
  data: SaleAnalytics;
}
export interface CartItem {
  product: Product;        // Full product object
  quantity: number;
  unitSalePrice: number;
  unitMrp: number;
  total: number;
  profit: number;
  isValid: boolean;        // For validation state
  errorMessage?: string;   // For showing errors
}

export interface POSState {
  cart: CartItem[];
  customer?: string;
  paymentMethod: string;
  discount: number;
  taxAmount: number;
  notes: string;
  subtotal: number;
  totalAmount: number;
  totalItems: number;
  totalProfit: number;
}
export interface ReturnSaleResponse {
  success: boolean;
  data: Sale;
  refundAmount: number;
  message: string;
}
export interface CreateSaleItem {
  product?: string;      // Product ID (optional if barcode provided)
  barcode?: string;      // Barcode (optional if product ID provided)
  quantity: number;
  unitSalePrice?: number; // Optional - will use MRP if not provided
}
export type SaleResponse = SingleSaleResponse | MultipleSalesResponse;