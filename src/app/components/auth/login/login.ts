import { Component, inject, signal } from '@angular/core';
import { UtilsModule } from '../../../utils.module';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [RouterLink,UtilsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login{
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authService = inject(AuthService);

  error = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    
    if (this.loginForm.valid) {
      this.error.set('');
      
      this.authService.login(this.loginForm.value as any).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          // Fix for [object Object] error - extract the actual message
          const errorMessage = this.extractErrorMessage(err);
          this.error.set(errorMessage);
        }
      });
    }
  }

  private extractErrorMessage(err: any): string {
    console.log('Raw error:', err); // For debugging
    
    // If it's already a string, return it
    if (typeof err === 'string') {
      return err;
    }
    
    // If it's an HttpErrorResponse
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Unable to connect to server. Please check your internet connection.';
      }
      if (err.status === 401) {
        return 'Invalid email or password. Please check your credentials.';
      }
      if (err.status >= 500) {
        return 'Server error. Please try again later.';
      }
      if (err.error?.message) {
        return err.error.message;
      }
      if (typeof err.error === 'string') {
        return err.error;
      }
      if (err.message) {
        return err.message;
      }
    }
    
    // If it's an error object with message property
    if (err?.message) {
      return err.message;
    }
    
    // If it's an object, try to stringify it for debugging
    if (typeof err === 'object') {
      try {
        // Check if it's the common { message: string } pattern
        if (err.message) {
          return err.message;
        }
        // Otherwise return a generic message
        return 'Login failed. Please try again.';
      } catch (e) {
        return 'An unexpected error occurred.';
      }
    }
    
    // Fallback
    return 'Login failed. Please try again.';
  }
}