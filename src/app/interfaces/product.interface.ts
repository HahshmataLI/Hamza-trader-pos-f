import { Category } from "./category.interface";

export interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: Category | string;
  costPrice: number;
  mrp: number;
  minSalePrice: number;
  stock: number;
  minStockLevel: number;
  description?: string;
  images: string[];
  isActive: boolean;
  attributes: { [key: string]: any };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  costPrice: number;
  mrp: number;
  minSalePrice: number;
  stock: number;
  minStockLevel: number;
  description?: string;
  images: string[];
  attributes: { [key: string]: any };
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface StockUpdateRequest {
  quantity: number;
  operation: 'set' | 'increment' | 'decrement';
  reason?: string;
}