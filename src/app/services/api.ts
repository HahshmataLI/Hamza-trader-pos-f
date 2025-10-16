import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth';
import { catchError, Observable, throwError } from 'rxjs';
import { ApiResponse } from '../interfaces/auth-response.interface';

@Injectable({
  providedIn: 'root'
})
export class Api {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private baseUrl = 'http://localhost:3000/api';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      // Auto logout if 401 response
      this.authService.logout();
    }
    
    // Use the error message from your backend or default message
    const errorMessage = error.error?.error || error.error?.message || 'Something went wrong';
    return throwError(() => errorMessage);
  }

  // GET request
  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // POST request
  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // PUT request
  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, data, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // DELETE request
  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Special method for file uploads
  upload<T>(endpoint: string, formData: FormData): Observable<ApiResponse<T>> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
      // Note: Don't set Content-Type for FormData, let browser set it
    });

    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData, { 
      headers 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}