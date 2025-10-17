import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Customer } from '../../../interfaces/customer.Interface';
import { Product } from '../../../interfaces/product.interface';
import { Sale, SaleItem } from '../../../interfaces/sale.Interface';
import { User } from '../../../interfaces/user.interface';
import { AuthService } from '../../../services/auth';
import { SaleService } from '../../../services/sales/sale-service';
import { SALE_STATUS, PAYMENT_STATUS, PAYMENT_STATUS_SEVERITY, SALE_STATUS_SEVERITY } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-sales-details',
  imports: [ProgressSpinnerModule,RouterLink,UtilsModule,CommonModule],
  templateUrl: './sales-details.html',
  styleUrl: './sales-details.css',
  providers: [ConfirmationService, MessageService]
})
export class SalesDetails  implements OnInit {
  private saleService = inject(SaleService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  // Make constants available to template
  readonly SALE_STATUS = SALE_STATUS;
  readonly PAYMENT_STATUS = PAYMENT_STATUS;

  sale = signal<Sale | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSale(id);
    }
  }

  loadSale(id: string): void {
    this.loading.set(true);
    this.saleService.getSale(id).subscribe({
      next: (response) => {
        this.sale.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load sale details'
        });
        this.loading.set(false);
        this.router.navigate(['/sales']);
      }
    });
  }

  getPaymentStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return PAYMENT_STATUS_SEVERITY[status as keyof typeof PAYMENT_STATUS_SEVERITY] || 'secondary';
  }

  getSaleStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
    return SALE_STATUS_SEVERITY[status as keyof typeof SALE_STATUS_SEVERITY] || 'secondary';
  }

getCustomer(): Customer | null {
  const sale = this.sale();
  if (!sale || typeof sale.customer === 'string' || !sale.customer) return null;
  return sale.customer;
}


  getSalesPerson(): User | null {
    const sale = this.sale();
    if (!sale || typeof sale.salesPerson === 'string') return null;
    return sale.salesPerson;
  }

  getProduct(item: SaleItem): Product | null {
    if (typeof item.product === 'string') return null;
    return item.product;
  }

  getTotalUnits(): number {
    const sale = this.sale();
    if (!sale) return 0;
    return sale.items.reduce((total, item) => total + item.quantity, 0);
  }

  getTotalReturned(): number {
    const sale = this.sale();
    if (!sale) return 0;
    return sale.items.reduce((total, item) => total + item.returnedQuantity, 0);
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

  canProcessReturn(): boolean {
    const sale = this.sale();
    return sale?.status === SALE_STATUS.COMPLETED && this.authService.hasAnyRole(['admin', 'manager']);
  }

  canCancel(): boolean {
    const sale = this.sale();
    return (sale?.status === SALE_STATUS.COMPLETED || sale?.status === SALE_STATUS.PARTIALLY_RETURNED) && 
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  confirmCancel(): void {
    const sale = this.sale();
    if (!sale) return;

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
        this.loadSale(saleId);
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

  calculateProfit(item: SaleItem): number {
    const product = this.getProduct(item);
    if (!product) return 0;
    return (item.unitSalePrice - product.costPrice) * item.quantity;
  }

  getTotalProfit(): number {
    const sale = this.sale();
    if (!sale) return 0;
    return sale.items.reduce((total, item) => total + this.calculateProfit(item), 0);
  }

  getSavingsAmount(): number {
    const sale = this.sale();
    if (!sale) return 0;
    return sale.items.reduce((total, item) => {
      const product = this.getProduct(item);
      if (!product) return total;
      return total + ((product.mrp - item.unitSalePrice) * item.quantity);
    }, 0);
  }
}