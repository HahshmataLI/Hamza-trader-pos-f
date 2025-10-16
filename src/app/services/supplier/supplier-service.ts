import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateSupplierRequest, SupplierFilters, SupplierResponse, UpdateSupplierRequest } from '../../interfaces/supplier.Interface';
import { Observable } from 'rxjs';
import { API_URL } from '../../utils/constants';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/suppliers`;

  // Get all suppliers with optional filtering and pagination
  getSuppliers(filters?: SupplierFilters): Observable<SupplierResponse> {
    let params = new HttpParams();
    
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<SupplierResponse>(this.baseUrl, { params });
  }

  // Get single supplier by ID
  getSupplier(id: string): Observable<SupplierResponse> {
    return this.http.get<SupplierResponse>(`${this.baseUrl}/${id}`);
  }

  // Create new supplier
  createSupplier(supplierData: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.http.post<SupplierResponse>(this.baseUrl, supplierData);
  }

  // Update supplier
  updateSupplier(id: string, supplierData: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.http.put<SupplierResponse>(`${this.baseUrl}/${id}`, supplierData);
  }

  // Delete supplier (soft delete by setting isActive to false)
  deleteSupplier(id: string): Observable<SupplierResponse> {
    return this.http.delete<SupplierResponse>(`${this.baseUrl}/${id}`);
  }
}