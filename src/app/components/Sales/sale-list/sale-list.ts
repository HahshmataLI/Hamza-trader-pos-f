import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SaleService } from '../../../services/sales/sale-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Sale, SaleAnalytics } from '../../../interfaces/sale.Interface';
import { PAYMENT_STATUS_SEVERITY, SALE_STATUS, SALE_STATUS_SEVERITY } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-list',
  imports: [RouterLink,UtilsModule,CommonModule],
  templateUrl: './sale-list.html',
  styleUrl: './sale-list.css',
  providers: [ConfirmationService, MessageService]
})
export class SaleList implements OnInit {
  private saleService = inject(SaleService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  // Make constants available to template if needed
  readonly SALE_STATUS = SALE_STATUS;

  sales = signal<Sale[]>([]);
  loading = signal(true);
  analytics = signal<SaleAnalytics | null>(null);
  
  // Filters
  startDate = signal<string>('');
  endDate = signal<string>('');
  
  // Pagination
  pagination = signal({
    currentPage: 1,
    totalPages: 0,
    totalSales: 0,
    limit: 10
  });

  ngOnInit(): void {
    this.loadSales();
    this.loadAnalytics();
  }

  loadSales(): void {
    this.loading.set(true);
    const filters = {
      startDate: this.startDate(),
      endDate: this.endDate(),
      page: this.pagination().currentPage,
      limit: this.pagination().limit
    };

    this.saleService.getSales(filters).subscribe({
      next: (response) => {
        this.sales.set(response.data);
        if (response.pagination) {
          this.pagination.set({
            ...this.pagination(),
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            totalSales: response.pagination.totalSales
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load sales'
        });
        this.loading.set(false);
      }
    });
  }

  loadAnalytics(): void {
    this.saleService.getSalesAnalytics(30).subscribe({
      next: (response) => {
        this.analytics.set(response.data);
      },
      error: (error) => {
        console.error('Failed to load analytics:', error);
      }
    });
  }

  onFilterChange(): void {
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
    this.loadSales();
  }

  onPageChange(event: any): void {
    this.pagination.set({ 
      ...this.pagination(), 
      currentPage: event.page + 1,
      limit: event.rows
    });
    this.loadSales();
  }

  // Fix: Use type assertion to handle string indexing
  getPaymentStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return PAYMENT_STATUS_SEVERITY[status as keyof typeof PAYMENT_STATUS_SEVERITY] || 'secondary';
  }

  // Fix: Use type assertion to handle string indexing
  getSaleStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return SALE_STATUS_SEVERITY[status as keyof typeof SALE_STATUS_SEVERITY] || 'secondary';
  }

  getCustomerName(sale: Sale): string {
    if (!sale.customer) return 'Walk-in Customer';
    if (typeof sale.customer === 'string') return 'Loading...';
    return sale.customer.name;
  }

  getSalesPersonName(sale: Sale): string {
    if (typeof sale.salesPerson === 'string') return 'Loading...';
    return sale.salesPerson.name;
  }

  getTotalItems(sale: Sale): number {
    return sale.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalRevenue(): number {
    return this.analytics()?.totalRevenue || 0;
  }

  getTotalSales(): number {
    return this.analytics()?.totalSales || 0;
  }

  getAverageSale(): number {
    return this.analytics()?.averageSale || 0;
  }

  confirmReturn(sale: Sale): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to process return for sale "${sale.invoiceNumber}"?`,
      header: 'Confirm Return',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processReturn(sale._id)
    });
  }

  processReturn(saleId: string): void {
    // This would navigate to return form
    this.router.navigate(['/sales', saleId, 'return']);
  }

  confirmCancel(sale: Sale): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel sale "${sale.invoiceNumber}"? This will return all items to stock.`,
      header: 'Confirm Cancellation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processCancel(sale._id)
    });
  }

  processCancel(saleId: string): void {
    const cancelData = { reason: 'Cancelled by user' };
    this.saleService.cancelSale(saleId, cancelData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.message || 'Sale cancelled successfully'
        });
        this.loadSales();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to cancel sale'
        });
      }
    });
  }

  canModifySale(sale: Sale): boolean {
    return sale.status === SALE_STATUS.COMPLETED && this.authService.hasAnyRole(['admin', 'manager']);
  }
}