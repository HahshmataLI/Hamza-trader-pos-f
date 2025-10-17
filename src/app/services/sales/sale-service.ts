import { inject, Injectable } from '@angular/core';
import { API_URL } from '../../utils/constants';
import { CancelSaleRequest, CreateSaleRequest, MultipleSalesResponse, ReturnSaleRequest, ReturnSaleResponse, SaleAnalyticsResponse, SaleFilters, SingleSaleResponse } from '../../interfaces/sale.Interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SaleService  {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/sales`;

  // Get all sales with optional filtering
  getSales(filters?: SaleFilters): Observable<MultipleSalesResponse> {
    let params = new HttpParams();
    
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<MultipleSalesResponse>(this.baseUrl, { params });
  }

  // Get single sale by ID
  getSale(id: string): Observable<SingleSaleResponse> {
    return this.http.get<SingleSaleResponse>(`${this.baseUrl}/${id}`);
  }

  // Create new sale
  createSale(saleData: CreateSaleRequest): Observable<SingleSaleResponse> {
    return this.http.post<SingleSaleResponse>(this.baseUrl, saleData);
  }

  // Get sales analytics
  getSalesAnalytics(days: number = 30): Observable<SaleAnalyticsResponse> {
    return this.http.get<SaleAnalyticsResponse>(`${this.baseUrl}/analytics?days=${days}`);
  }

  // Return sale items
  returnSale(saleId: string, returnData: ReturnSaleRequest): Observable<ReturnSaleResponse> {
    return this.http.post<ReturnSaleResponse>(`${this.baseUrl}/${saleId}/return`, returnData);
  }

  // Cancel sale
  cancelSale(saleId: string, cancelData: CancelSaleRequest): Observable<SingleSaleResponse> {
    return this.http.post<SingleSaleResponse>(`${this.baseUrl}/${saleId}/cancel`, cancelData);
  }
}