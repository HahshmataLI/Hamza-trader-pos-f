// sale-list.component.ts - Updated with pending filter
import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SaleService } from '../../../services/sales/sale-service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Sale, SaleAnalytics, PeriodAnalytics } from '../../../interfaces/sale.Interface';
import { PAYMENT_STATUS_SEVERITY, SALE_STATUS, SALE_STATUS_SEVERITY } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-sale-list',
  imports: [RouterLink, UtilsModule, CommonModule, FormsModule, SelectModule],
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

  readonly SALE_STATUS = SALE_STATUS;

  sales = signal<Sale[]>([]);
  loading = signal(true);
  analytics = signal<SaleAnalytics | null>(null);
  periodAnalytics = signal<PeriodAnalytics | null>(null);
  
  // Filters
  startDate = signal<string>('');
  endDate = signal<string>('');
  paymentStatusFilter = signal<string>(''); // 'Pending', 'Paid', 'Refunded', or empty for all
  
  // Filter options
  paymentStatusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Refunded', value: 'Refunded' },
    { label: 'Partially Paid', value: 'Partially Paid' }
  ];
  
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
    this.loadPeriodAnalytics();
  }

  loadSales(): void {
    this.loading.set(true);
    const filters: any = {
      startDate: this.startDate(),
      endDate: this.endDate(),
      page: this.pagination().currentPage,
      limit: this.pagination().limit
    };

    // Add payment status filter if selected
    if (this.paymentStatusFilter()) {
      filters.paymentStatus = this.paymentStatusFilter();
    }

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

  loadPeriodAnalytics(): void {
    this.saleService.getPeriodAnalytics().subscribe({
      next: (response) => {
        this.periodAnalytics.set(response.data);
      },
      error: (error) => {
        console.error('Failed to load period analytics:', error);
      }
    });
  }

onFilterChange(): void {
  this.pagination.set({ ...this.pagination(), currentPage: 1 });
  this.loadSales();
}

clearFilters(): void {
  this.startDate.set('');
  this.endDate.set('');
  this.paymentStatusFilter.set('');
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

  getPaymentStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    const severities: Record<string, "success" | "secondary" | "info" | "warn" | "danger"> = {
      'Paid': 'success',
      'Pending': 'warn',
      'Partially Paid': 'info',
      'Refunded': 'secondary'
    };
    return severities[status] || 'secondary';
  }

  getSaleStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    const severities: Record<string, "success" | "secondary" | "info" | "warn" | "danger"> = {
      'Completed': 'success',
      'Returned': 'info',
      'Partially Returned': 'warn',
      'Cancelled': 'danger'
    };
    return severities[status] || 'secondary';
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

  getTotalProfit(): number {
    return this.analytics()?.totalProfit || 0;
  }

  getTotalSales(): number {
    return this.analytics()?.totalSales || 0;
  }

  getAverageSale(): number {
    return this.analytics()?.averageSale || 0;
  }

  getAverageProfit(): number {
    return this.analytics()?.averageProfit || 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
        this.loadAnalytics();
        this.loadPeriodAnalytics();
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

  confirmMarkAsPaid(sale: Sale): void {
    this.confirmationService.confirm({
      message: `Mark sale "${sale.invoiceNumber}" as paid?`,
      header: 'Confirm Payment',
      icon: 'pi pi-check-circle',
      accept: () => this.markAsPaid(sale._id)
    });
  }

  markAsPaid(saleId: string): void {
    this.saleService.markSaleAsPaid(saleId).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.message
        });
        this.loadSales();
        this.loadAnalytics();
        this.loadPeriodAnalytics();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to mark sale as paid'
        });
      }
    });
  }

  canModifySale(sale: Sale): boolean {
    return sale.status === 'Completed' && this.authService.hasAnyRole(['admin', 'manager']);
  }

  canMarkAsPaid(sale: Sale): boolean {
    return sale.paymentMethod === 'Credit' && 
           sale.paymentStatus === 'Pending' && 
           sale.status === 'Completed' &&
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  canCancel(sale: Sale): boolean {
    return sale.status === 'Completed' && 
           sale.paymentStatus !== 'Refunded' && 
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  canReturn(sale: Sale): boolean {
    return sale.status === 'Completed' && 
           sale.paymentStatus !== 'Refunded' && 
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  // Get count of pending sales
  getPendingCount(): number {
    return this.sales().filter(s => s.paymentStatus === 'Pending').length;
  }

}