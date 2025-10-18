import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../utils/constants';


export interface DashboardData {
  today: {
    revenue: number;
    salesCount: number;
  };
  monthly: {
    revenue: number;
    salesCount: number;
  };
  inventory: {
    lowStockCount: number;
  };
  customers: {
    total: number;
  };
  products: {
    total: number;
  };
  recentSales: any[];
}
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${API_URL}/dashboard`;

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<{ success: boolean; data: DashboardData }> {
    return this.http.get<{ success: boolean; data: DashboardData }>(this.apiUrl);
  }

}
