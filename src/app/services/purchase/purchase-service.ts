import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../utils/constants';
import { CreatePurchaseRequest, MultiplePurchasesResponse, PurchaseFilters, SinglePurchaseResponse, UpdatePurchaseRequest, UpdatePurchaseStatusRequest } from '../../interfaces/purchase.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/purchases`;

  // Get all purchases with optional filtering and pagination
  getPurchases(filters?: PurchaseFilters): Observable<MultiplePurchasesResponse> {
    let params = new HttpParams();
    
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    
    if (filters?.supplier) {
      params = params.set('supplier', filters.supplier);
    }
    
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<MultiplePurchasesResponse>(this.baseUrl, { params });
  }

  // Get single purchase by ID
  getPurchase(id: string): Observable<SinglePurchaseResponse> {
    return this.http.get<SinglePurchaseResponse>(`${this.baseUrl}/${id}`);
  }

  // Create new purchase
  createPurchase(purchaseData: CreatePurchaseRequest): Observable<SinglePurchaseResponse> {
    return this.http.post<SinglePurchaseResponse>(this.baseUrl, purchaseData);
  }

  // Update purchase
  updatePurchase(id: string, purchaseData: UpdatePurchaseRequest): Observable<SinglePurchaseResponse> {
    return this.http.put<SinglePurchaseResponse>(`${this.baseUrl}/${id}`, purchaseData);
  }

  // Update purchase status
  updatePurchaseStatus(id: string, statusData: UpdatePurchaseStatusRequest): Observable<SinglePurchaseResponse> {
    return this.http.patch<SinglePurchaseResponse>(`${this.baseUrl}/${id}/status`, statusData);
  }

  // Delete purchase
  deletePurchase(id: string): Observable<SinglePurchaseResponse> {
    return this.http.delete<SinglePurchaseResponse>(`${this.baseUrl}/${id}`);
  }

  // Debug stock
  debugStock(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/debug-stock`);
  }
}