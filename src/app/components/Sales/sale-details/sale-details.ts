import { Component, inject, OnInit, signal } from '@angular/core';
import { SaleService } from '../../../services/sales/sale-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ReturnSaleRequest, Sale, SaleItem } from '../../../interfaces/sale.Interface';
import { Product } from '../../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { UtilsModule } from '../../../utils.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { PAYMENT_STATUS, SALE_STATUS } from '../../../utils/constants';
import { Customer } from '../../../interfaces/customer.Interface';
import { User } from '../../../interfaces/user.interface';
@Component({
  selector: 'app-sale-details',
  imports: [ProgressSpinnerModule,InputNumberModule,CommonModule,
    FormsModule,UtilsModule,RouterLink],
  templateUrl: './sale-details.html',
  styleUrl: './sale-details.css',
  providers: [ConfirmationService, MessageService]
})
export class SaleDetails  implements OnInit {
  private saleService = inject(SaleService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

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

  // Action permissions
  canProcessReturn(): boolean {
    const sale = this.sale();
    return sale?.status === SALE_STATUS.COMPLETED && 
           sale?.paymentStatus !== 'Refunded' && 
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  canCancel(): boolean {
    const sale = this.sale();
    return (sale?.status === SALE_STATUS.COMPLETED) && 
           sale?.paymentStatus !== 'Refunded' && 
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  canMarkAsPaid(): boolean {
    const sale = this.sale();
    return sale?.paymentMethod === 'Credit' && 
           sale?.paymentStatus === 'Pending' && 
           sale?.status === 'Completed' &&
           this.authService.hasAnyRole(['admin', 'manager']);
  }

  // Mark as paid
  confirmMarkAsPaid(): void {
    const sale = this.sale();
    if (!sale) return;

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
        this.loadSale(saleId);
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

  // Cancel sale
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
}