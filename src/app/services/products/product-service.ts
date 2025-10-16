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
  private apiUrl = `${API_URL}/products`; // Fix the API URL

  getProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    lowStock?: boolean;
  }): Observable<ProductsResponse> {
    let httpParams = new HttpParams();
    
    if (params?.category && params.category !== 'all') {
      httpParams = httpParams.set('category', params.category);
    }
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.lowStock) httpParams = httpParams.set('lowStock', params.lowStock.toString());

    return this.http.get<ProductsResponse>(this.apiUrl, { params: httpParams });
  }

  getProduct(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
  }

  createProduct(productData: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.apiUrl, productData);
  }

  updateProduct(id: string, productData: UpdateProductRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, productData);
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
}