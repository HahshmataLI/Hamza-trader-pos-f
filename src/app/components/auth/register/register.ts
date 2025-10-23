import { Component, inject, signal } from '@angular/core';
import { UtilsModule } from '../../../utils.module';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { Select } from 'primeng/select';

interface RoleOption {
  label: string;
  value: 'admin' | 'manager' | 'sales';
}

@Component({
  selector: 'app-register',
  imports: [RouterLink,UtilsModule , Select],
  templateUrl: './register.html',
  styleUrl: './register.css',
  
})

export class Register{
  private fb = inject(FormBuilder);
  private router = inject(Router);
  authService = inject(AuthService);

  error = signal('');

  // Role options for dropdown
  roleOptions: RoleOption[] = [
    { label: 'Administrator', value: 'admin' },
    { label: 'Manager', value: 'manager' },
    { label: 'Sales Person', value: 'sales' }
  ];

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['sales' as 'admin' | 'manager' | 'sales', [Validators.required]], // Default to 'sales'
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get role() { return this.registerForm.get('role'); }
  get password() { return this.registerForm.get('password'); }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();
    
    if (this.registerForm.valid) {
      this.error.set('');
      
      this.authService.register(this.registerForm.value as any).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err);
        }
      });
    }
  }
}