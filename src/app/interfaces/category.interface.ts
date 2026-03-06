export interface CategoryAttribute {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
  };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parent?: string | Category | null; // Allow null for main categories
  level: 1 | 2 | 3; // 1=Main, 2=Sub, 3=Sub-sub
  image?: string;
  attributes: CategoryAttribute[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[]; // For tree structure when populated
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parent?: string | null; // Allow null for main categories
  level?: 1 | 2 | 3;
  attributes?: CategoryAttribute[];
  isActive?: boolean; // Defaults to true on backend
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface CategoryTree {
  _id: string;
  name: string;
  description?: string;
  level: 1 | 2 | 3;
  image?: string;
  attributes: CategoryAttribute[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategories: CategoryTree[];
}

// Better to have separate response interfaces for different endpoints
export interface CategoriesResponse {
  success: boolean;
  data: Category[];
  // Add pagination if your backend supports it
  // pagination?: {
  //   total: number;
  //   page: number;
  //   limit: number;
  //   pages: number;
  // };
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
}

export interface CategoryTreeResponse {
  success: boolean;
  data: CategoryTree[];
}

export interface CategoryAttributesResponse {
  success: boolean;
  data: CategoryAttribute[];
}

// For filtering
export interface CategoryFilters {
  level?: number;
  parent?: string | null;
  // 'type' is used in the getCategoriesByType endpoint
  type?: 'main' | 'sub' | 'sub-sub' | 'all';
}

// For dropdown options
export interface CategoryOption {
  label: string;
  value: string;
  level: number;
  parent?: string | null;
}