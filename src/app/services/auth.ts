import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

import {  catchError, Observable, tap, throwError } from 'rxjs';
import { LoginRequest, RegisterRequest,User } from '../interfaces/user.interface';
import {  AuthResponse } from '../interfaces/auth-response.interface';
import { Router } from '@angular/router';
import { API_URL, AUTH_ENDPOINTS, ROLES, STORAGE_KEYS } from '../utils/constants';



@Injectable({
  providedIn: 'root'
})
export class AuthService  {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Use signals for reactive state
  currentUser = signal<User | null>(null);
  isLoading = signal(false);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (token && userData) {
      try {
        this.currentUser.set(JSON.parse(userData));
      } catch (e) {
        this.logout();
      }
    }
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${API_URL}${AUTH_ENDPOINTS.REGISTER}`, userData)
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
          this.isLoading.set(false);
        }),
        catchError((error: HttpErrorResponse) => {
          this.isLoading.set(false);
          return throwError(() => this.extractAuthErrorMessage(error));
        })
      );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${API_URL}${AUTH_ENDPOINTS.LOGIN}`, credentials)
      .pipe(
        tap((response) => {
          this.handleAuthSuccess(response);
          this.isLoading.set(false);
        }),
        catchError((error: HttpErrorResponse) => {
          this.isLoading.set(false);
          // Return a user-friendly error message
          return throwError(() => this.extractAuthErrorMessage(error));
        })
      );
  }

  private extractAuthErrorMessage(error: HttpErrorResponse): string {
    console.log('Auth Error:', error); // For debugging
    
    if (error.status === 401) {
      return 'Invalid email or password. Please check your credentials.';
    }
    
    if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    // Try to extract specific error message from backend
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (typeof error.error === 'string') {
      return error.error;
    }
    
    return 'Login failed. Please try again.';
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // Store token and user data
    localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    this.currentUser.set(response.data as User);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.role === role;
  }

  // Check if user has any of the required roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Convenience methods for specific roles
  isAdmin(): boolean {
    return this.hasRole(ROLES.ADMIN);
  }

  isManager(): boolean {
    return this.hasRole(ROLES.MANAGER);
  }

  isSales(): boolean {
    return this.hasRole(ROLES.SALES);
  }

  // Role hierarchy check (admin > manager > sales)
  canAccess(requiredRole: string): boolean {
    const userRole = this.currentUser()?.role;
    if (!userRole) return false;

    const roleHierarchy = {
      [ROLES.ADMIN]: 3,
      [ROLES.MANAGER]: 2,
      [ROLES.SALES]: 1
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy];
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy];
    
    return userLevel >= requiredLevel;
  }
}