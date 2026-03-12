import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateProductRequest, Product, ProductResponse, ProductsResponse, StockUpdateRequest, UpdateProductRequest } from '../../interfaces/product.interface';
import { Observable } from 'rxjs';
import { API_URL } from '../../utils/constants';

@Injectable({
  providedIn: 'root'
})

export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${API_URL}/products`;

getProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  lowStock?: boolean;
  sortField?: string;
  sortOrder?: number;
}): Observable<ProductsResponse> {
  let httpParams = new HttpParams();
  
  if (params?.category && params.category !== 'all') {
    httpParams = httpParams.set('category', params.category);
  }
  if (params?.search && params.search.length >= 2) {
    httpParams = httpParams.set('search', params.search);
  }
  if (params?.page) httpParams = httpParams.set('page', params.page.toString());
  if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
  if (params?.lowStock) httpParams = httpParams.set('lowStock', params.lowStock.toString());
  if (params?.sortField) httpParams = httpParams.set('sortField', params.sortField);
  if (params?.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder.toString());

  return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
}

  getProduct(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  getProductByBarcode(barcode: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/barcode/${barcode}`);
  }

createProduct(formData: FormData): Observable<ProductResponse> {
  return this.http.post<ProductResponse>(this.apiUrl, formData);
}

updateProduct(id: string, formData: FormData): Observable<ProductResponse> {
  return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, formData);
}

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  getLowStockProducts(): Observable<{ success: boolean; data: Product[] }> {
    return this.http.get<{ success: boolean; data: Product[] }>(`${this.apiUrl}/low-stock`);
  }

  getProductsByCategory(categoryId: string, page?: number, limit?: number): Observable<ProductsResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get<ProductsResponse>(`${this.apiUrl}/category/${categoryId}`, { params });
  }

  updateStock(id: string, stockData: StockUpdateRequest): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.apiUrl}/${id}/stock`, stockData);
  }

  bulkUpdateStock(updates: Array<{ productId: string; quantity: number }>): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-stock-update`, { updates });
  }

  private createFormData(data: any): FormData {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (key === 'images' && Array.isArray(data[key])) {
        // Handle image files
        data[key].forEach((file: File, index: number) => {
          formData.append('images', file);
        });
      } else if (key === 'attributes' && typeof data[key] === 'object') {
        // Handle attributes as JSON string
        formData.append(key, JSON.stringify(data[key]));
      } else if (data[key] !== undefined && data[key] !== null) {
        // Handle other fields
        formData.append(key, data[key]);
      }
    });
    
    return formData;
  }
}