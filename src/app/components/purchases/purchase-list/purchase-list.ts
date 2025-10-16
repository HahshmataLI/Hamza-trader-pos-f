import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PurchaseService } from '../../../services/purchase/purchase-service';
import { AuthService } from '../../../services/auth';
import { Router, RouterLink } from '@angular/router';
import { Purchase, PurchaseStats } from '../../../interfaces/purchase.interface';
import { PURCHASE_STATUS, PURCHASE_STATUS_SEVERITY } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-purchase-list',
  imports: [RouterLink,UtilsModule,CommonModule],
  templateUrl: './purchase-list.html',
  styleUrl: './purchase-list.css',
   providers: [ConfirmationService, MessageService]
})
export class PurchaseList  implements OnInit {
  private purchaseService = inject(PurchaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  purchases = signal<Purchase[]>([]);
  loading = signal(true);
  stats = signal<PurchaseStats[]>([]);
  
  // Filters
  statusFilter = signal<string>('');
  searchTerm = signal('');
  
  // Pagination
  pagination = signal({
    currentPage: 1,
    totalPages: 0,
    totalPurchases: 0,
    limit: 10
  });

  // Status options for filter
  statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: PURCHASE_STATUS.PENDING },
    { label: 'Completed', value: PURCHASE_STATUS.COMPLETED },
    { label: 'Cancelled', value: PURCHASE_STATUS.CANCELLED }
  ];

  ngOnInit(): void {
    this.loadPurchases();
  }

  loadPurchases(): void {
    this.loading.set(true);
    const filters = {
      status: this.statusFilter(),
      page: this.pagination().currentPage,
      limit: this.pagination().limit
    };

    this.purchaseService.getPurchases(filters).subscribe({
      next: (response) => {
        this.purchases.set(response.data);
        this.stats.set(response.stats || []);
        if (response.pagination) {
          this.pagination.set({
            ...this.pagination(),
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            totalPurchases: response.pagination.totalPurchases
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load purchases'
        });
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
    this.loadPurchases();
  }

  onPageChange(event: any): void {
    this.pagination.set({ 
      ...this.pagination(), 
      currentPage: event.page + 1,
      limit: event.rows
    });
    this.loadPurchases();
  }

  // Fix: Return proper PrimeNG severity type
  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return PURCHASE_STATUS_SEVERITY[status] || 'secondary';
  }

  getSupplierName(purchase: Purchase): string {
    if (typeof purchase.supplier === 'string') return 'Loading...';
    return purchase.supplier.name;
  }

  getReceivedByName(purchase: Purchase): string {
    if (typeof purchase.receivedBy === 'string') return 'Loading...';
    return purchase.receivedBy.name;
  }

  // Fix: Calculate total units in component method instead of template
  getTotalUnits(purchase: Purchase): number {
    return purchase.items.reduce((total, item) => total + item.quantity, 0);
  }

  getStatsByStatus(status: string): PurchaseStats | undefined {
    return this.stats().find(stat => stat._id === status);
  }

  confirmDelete(purchase: Purchase): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete purchase "${purchase.purchaseNumber}"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deletePurchase(purchase._id)
    });
  }

  deletePurchase(id: string): void {
    this.purchaseService.deletePurchase(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Purchase deleted successfully'
        });
        this.loadPurchases();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete purchase'
        });
      }
    });
  }

  updatePurchaseStatus(purchase: Purchase, newStatus: string): void {
    this.purchaseService.updatePurchaseStatus(purchase._id, { status: newStatus as any })
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.message || 'Purchase status updated successfully'
          });
          this.loadPurchases();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update purchase status'
          });
        }
      });
  }

  getTotalPurchases(): number {
    return this.stats().reduce((total, stat) => total + stat.count, 0);
  }

  getTotalAmount(): number {
    return this.stats().reduce((total, stat) => total + stat.totalAmount, 0);
  }
}