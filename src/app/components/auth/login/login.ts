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
export class Login {
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
        error: (err: string) => { // Now err is a string from the service
          this.error.set(err);
        }
      });
    }
  }
}