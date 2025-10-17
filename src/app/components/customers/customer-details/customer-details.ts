import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CustomerService } from '../../../services/customer/customer-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Customer } from '../../../interfaces/customer.Interface';
import { CUSTOMER_TYPE_SEVERITY, CUSTOMER_TYPES } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-customer-details',
  imports: [RouterLink,ProgressSpinnerModule, UtilsModule,CommonModule],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.css',
  providers: [MessageService]
})
export class CustomerDetails  implements OnInit {
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  // Make CUSTOMER_TYPES available to template
  readonly CUSTOMER_TYPES = CUSTOMER_TYPES;

  customer = signal<Customer | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomer(id);
    }
  }

  loadCustomer(id: string): void {
    this.loading.set(true);
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        this.customer.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load customer details'
        });
        this.loading.set(false);
        this.router.navigate(['/customers']);
      }
    });
  }

  getCustomerTypeSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return CUSTOMER_TYPE_SEVERITY[type] || 'secondary';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatLastPurchaseDate(): string {
    const customer = this.customer();
    if (!customer?.lastPurchaseDate) return 'Never purchased';
    return this.formatDate(customer.lastPurchaseDate);
  }

  getCustomerSince(): string {
    const customer = this.customer();
    if (!customer) return '';
    return this.formatDate(customer.createdAt);
  }

  getLoyaltyLevel(): string {
    const customer = this.customer();
    if (!customer) return '';
    
    const totalSpent = customer.totalPurchases;
    if (totalSpent > 10000) return 'Platinum';
    if (totalSpent > 5000) return 'Gold';
    if (totalSpent > 1000) return 'Silver';
    return 'Bronze';
  }

  getLoyaltyColor(): string {
    const level = this.getLoyaltyLevel();
    switch (level) {
      case 'Platinum': return 'text-purple-600 bg-purple-100';
      case 'Gold': return 'text-yellow-600 bg-yellow-100';
      case 'Silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  }
}