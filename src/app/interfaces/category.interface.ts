export interface CategoryAttribute {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parent?: string | Category;
  level: 1 | 2 | 3; // 1=Main, 2=Sub, 3=Sub-sub
  image?: string;
  attributes: CategoryAttribute[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[]; // For tree structure
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parent?: string;
  level?: 1 | 2 | 3;
  attributes?: CategoryAttribute[];
  isActive?: boolean;
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
  subcategories: CategoryTree[]; // This should exist based on your service
}
export interface CategoryResponse {
  success: boolean;
  data: Category | Category[] | CategoryTree[];
}

export interface CategoryFilters {
  level?: number;
  parent?: string | null;
  type?: 'main' | 'sub' | 'sub-sub' | 'all';
}
