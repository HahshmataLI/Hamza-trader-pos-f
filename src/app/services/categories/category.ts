import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../utils/constants';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Category, CategoryAttribute, CategoryFilters, CategoryTree, CreateCategoryRequest, UpdateCategoryRequest } from '../../interfaces/category.interface';
import { ApiResponse } from '../../interfaces/auth-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/categories`;

  // Get all categories with optional filtering
  getCategories(filters?: CategoryFilters): Observable<ApiResponse<Category[]>> {
    let params = new HttpParams();
    
    if (filters?.level) {
      params = params.set('level', filters.level.toString());
    }
    
    if (filters?.parent !== undefined) {
      params = params.set('parent', filters.parent === null ? 'null' : filters.parent);
    }

    return this.http.get<ApiResponse<Category[]>>(this.baseUrl, { params });
  }

  // Get hierarchical category tree
  getCategoryTree(): Observable<ApiResponse<CategoryTree[]>> {
    return this.http.get<ApiResponse<CategoryTree[]>>(`${this.baseUrl}/tree`);
  }

  // Get single category by ID
  getCategory(id: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.baseUrl}/${id}`);
  }

  // Get categories by type (main, sub, sub-sub, all)
  getCategoriesByType(type: 'main' | 'sub' | 'sub-sub' | 'all'): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.baseUrl}/type/${type}`);
  }

  // Get category attributes (including inherited)
  getCategoryAttributes(categoryId: string): Observable<ApiResponse<CategoryAttribute[]>> {
    return this.http.get<ApiResponse<CategoryAttribute[]>>(`${this.baseUrl}/${categoryId}/attributes`);
  }

  // Create new category
  createCategory(categoryData: CreateCategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.baseUrl, categoryData);
  }

  // Update category
  updateCategory(id: string, categoryData: UpdateCategoryRequest): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.baseUrl}/${id}`, categoryData);
  }

  // Delete category (soft delete by setting isActive to false)
  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${id}`, { isActive: false });
  }
}