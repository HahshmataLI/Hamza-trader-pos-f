import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CustomerService } from '../../../services/customer/customer-service';
import { AuthService } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { Customer } from '../../../interfaces/customer.Interface';
import { CUSTOMER_TYPE_SEVERITY, CUSTOMER_TYPES } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink,UtilsModule,CommonModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
  providers: [ConfirmationService, MessageService]
})
export class CustomerList implements OnInit {
  private customerService = inject(CustomerService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  customers = signal<Customer[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  
  // Pagination
  pagination = signal({
    currentPage: 1,
    totalPages: 0,
    totalCustomers: 0,
    limit: 10
  });

  // Computed properties for template
  activeCustomersCount = computed(() => {
    return this.customers().filter(c => c.isActive).length;
  });

  customerTypeOptions = [
    { label: 'Regular', value: CUSTOMER_TYPES.REGULAR },
    { label: 'VIP', value: CUSTOMER_TYPES.VIP },
    { label: 'Wholesale', value: CUSTOMER_TYPES.WHOLESALE }
  ];

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    const filters = {
      search: this.searchTerm(),
      page: this.pagination().currentPage,
      limit: this.pagination().limit
    };

    this.customerService.getCustomers(filters).subscribe({
      next: (response) => {
        this.customers.set(response.data);
        if (response.pagination) {
          this.pagination.set({
            ...this.pagination(),
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            totalCustomers: response.pagination.totalCustomers
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load customers'
        });
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
    this.loadCustomers();
  }

  onPageChange(event: any): void {
    this.pagination.set({ 
      ...this.pagination(), 
      currentPage: event.page + 1,
      limit: event.rows
    });
    this.loadCustomers();
  }

  // Fix: Return proper PrimeNG severity type
  getCustomerTypeSeverity(type: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return CUSTOMER_TYPE_SEVERITY[type] || 'secondary';
  }

  getTotalRevenue(): number {
    return this.customers().reduce((total, customer) => total + customer.totalPurchases, 0);
  }

  getVIPCustomersCount(): number {
    return this.customers().filter(customer => customer.customerType === CUSTOMER_TYPES.VIP).length;
  }

  formatLastPurchaseDate(customer: Customer): string {
    if (!customer.lastPurchaseDate) return 'Never';
    return new Date(customer.lastPurchaseDate).toLocaleDateString();
  }

  getContactInfo(customer: Customer): string {
    const info = [];
    if (customer.phone) info.push(customer.phone);
    if (customer.email) info.push(customer.email);
    return info.join(' • ') || 'No contact info';
  }
}