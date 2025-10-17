import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateCustomerRequest, CustomerFilters, MultipleCustomersResponse, SingleCustomerResponse, UpdateCustomerRequest } from '../../interfaces/customer.Interface';
import { API_URL } from '../../utils/constants';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/customers`;

  // Get all customers with optional filtering and pagination
  getCustomers(filters?: CustomerFilters): Observable<MultipleCustomersResponse> {
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

    return this.http.get<MultipleCustomersResponse>(this.baseUrl, { params });
  }

  // Get single customer by ID
  getCustomer(id: string): Observable<SingleCustomerResponse> {
    return this.http.get<SingleCustomerResponse>(`${this.baseUrl}/${id}`);
  }

  // Create new customer
  createCustomer(customerData: CreateCustomerRequest): Observable<SingleCustomerResponse> {
    return this.http.post<SingleCustomerResponse>(this.baseUrl, customerData);
  }

  // Update customer
  updateCustomer(id: string, customerData: UpdateCustomerRequest): Observable<SingleCustomerResponse> {
    return this.http.put<SingleCustomerResponse>(`${this.baseUrl}/${id}`, customerData);
  }
}