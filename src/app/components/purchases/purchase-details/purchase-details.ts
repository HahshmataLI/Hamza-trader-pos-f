import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PurchaseService } from '../../../services/purchase/purchase-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Purchase, PurchaseItem } from '../../../interfaces/purchase.interface';
import { PURCHASE_STATUS, PURCHASE_STATUS_SEVERITY } from '../../../utils/constants';
import { User } from '../../../interfaces/user.interface';
import { Supplier } from '../../../interfaces/supplier.Interface';
import { Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-purchase-details',
  imports: [RouterLink,ProgressSpinnerModule,UtilsModule,CommonModule],
  templateUrl: './purchase-details.html',
  styleUrl: './purchase-details.css',
  providers: [ConfirmationService, MessageService]
})
export class PurchaseDetails  implements OnInit {
  private purchaseService = inject(PurchaseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  purchase = signal<Purchase | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchase(id);
    }
  }

  loadPurchase(id: string): void {
    this.loading.set(true);
    this.purchaseService.getPurchase(id).subscribe({
      next: (response) => {
        this.purchase.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load purchase details'
        });
        this.loading.set(false);
        this.router.navigate(['/purchases']);
      }
    });
  }

  // Fix: Return proper PrimeNG severity type
  getStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined {
    return PURCHASE_STATUS_SEVERITY[status] || 'secondary';
  }

  getSupplier(): Supplier | null {
    const purchase = this.purchase();
    if (!purchase || typeof purchase.supplier === 'string') return null;
    return purchase.supplier;
  }

  getReceivedBy(): User | null {
    const purchase = this.purchase();
    if (!purchase || typeof purchase.receivedBy === 'string') return null;
    return purchase.receivedBy;
  }

  getProduct(item: PurchaseItem): Product | null {
    if (typeof item.product === 'string') return null;
    return item.product;
  }

  getTotalUnits(): number {
    const purchase = this.purchase();
    if (!purchase) return 0;
    return purchase.items.reduce((total, item) => total + item.quantity, 0);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  updateStatus(newStatus: string): void {
    const purchase = this.purchase();
    if (!purchase) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to change the status to "${newStatus}"?`,
      header: 'Confirm Status Change',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.purchaseService.updatePurchaseStatus(purchase._id, { status: newStatus as any })
          .subscribe({
            next: (response) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: response.message || 'Purchase status updated successfully'
              });
              this.loadPurchase(purchase._id);
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
    });
  }

  confirmDelete(): void {
    const purchase = this.purchase();
    if (!purchase) return;

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
        this.router.navigate(['/purchases']);
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

  canUpdateStatus(): boolean {
    return this.authService.hasAnyRole(['admin', 'manager']);
  }

  // Fix: Use proper PrimeNG severity types for buttons
  getStatusActions(): { label: string; value: string; severity: "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined }[] {
    const currentStatus = this.purchase()?.status;
    const actions: { label: string; value: string; severity: "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined }[] = [];

    if (currentStatus === PURCHASE_STATUS.PENDING) {
      actions.push(
        { label: 'Mark as Completed', value: PURCHASE_STATUS.COMPLETED, severity: 'success' },
        { label: 'Cancel Purchase', value: PURCHASE_STATUS.CANCELLED, severity: 'danger' }
      );
    } else if (currentStatus === PURCHASE_STATUS.COMPLETED) {
      actions.push(
        { label: 'Cancel Purchase', value: PURCHASE_STATUS.CANCELLED, severity: 'danger' }
      );
    } else if (currentStatus === PURCHASE_STATUS.CANCELLED) {
      actions.push(
        { label: 'Mark as Completed', value: PURCHASE_STATUS.COMPLETED, severity: 'success' },
        { label: 'Reopen as Pending', value: PURCHASE_STATUS.PENDING, severity: 'warn' }
      );
    }

    return actions;
  }
}