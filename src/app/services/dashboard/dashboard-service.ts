// services/dashboard/dashboard-service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../utils/constants';
import { 
  DashboardResponse, 
  SalesChartResponse, 
  SummaryCardsResponse 
} from '../../interfaces/dashboard.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${API_URL}/dashboard`;

  constructor(private http: HttpClient) { }

  // Get complete dashboard data
  getDashboardData(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiUrl);
  }

  // Get sales chart data for specific period
  getSalesChartData(period: 'week' | 'month' | 'year' = 'week'): Observable<SalesChartResponse> {
    return this.http.get<SalesChartResponse>(`${this.apiUrl}/chart?period=${period}`);
  }

  // Get summary cards for quick overview
  getSummaryCards(): Observable<SummaryCardsResponse> {
    return this.http.get<SummaryCardsResponse>(`${this.apiUrl}/summary`);
  }

  // Format currency helper (can be used in templates)
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format number with commas
  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-PK').format(amount);
  }
}