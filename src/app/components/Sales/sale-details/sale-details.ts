import { Component, inject, OnInit, signal } from '@angular/core';
import { SaleService } from '../../../services/sales/sale-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { ReturnSaleRequest, Sale, SaleItem } from '../../../interfaces/sale.Interface';
import { Product } from '../../../interfaces/product.interface';
import { CommonModule } from '@angular/common';
import { UtilsModule } from '../../../utils.module';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-sale-details',
  imports: [ProgressSpinnerModule,InputNumberModule,CommonModule,
    FormsModule,UtilsModule],
  templateUrl: './sale-details.html',
  styleUrl: './sale-details.css',
  providers: [ConfirmationService, MessageService]
})
export class SaleDetails implements OnInit {
  private saleService = inject(SaleService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  sale = signal<Sale | null>(null);
  loading = signal(false);
  
  // Return form data
  returnData = signal<ReturnSaleRequest>({
    returnItems: [],
    reason: ''
  });

  // Map to store max returnable quantities
  private maxReturnableMap = new Map<string, number>();
 returnQuantities = signal<{[key: string]: number}>({});
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSale(id);
    }
  }

  // Update loadSale method to initialize returnQuantities
  loadSale(id: string): void {
    this.loading.set(true);
    this.saleService.getSale(id).subscribe({
      next: (response) => {
        this.sale.set(response.data);
        
        // Clear and populate the max returnable map
        this.maxReturnableMap.clear();
        const quantities: {[key: string]: number} = {};
        
        response.data.items.forEach(item => {
          const maxReturnable = item.quantity - (item.returnedQuantity || 0);
          this.maxReturnableMap.set(item._id!, maxReturnable);
          quantities[item._id!] = 0;
        });

        this.returnQuantities.set(quantities);

        // Initialize return items
        const returnItems = response.data.items.map(item => ({
          itemId: item._id!,
          quantity: 0
        }));
        
        this.returnData.set({
          returnItems,
          reason: ''
        });
        this.loading.set(false);
      },
      error: (error) => {
        // error handling
      }
    });
  }

getReturnQuantity(itemId: string): number {
  const returnItem = this.getReturnItem(itemId);
  return returnItem?.quantity || 0;
}
  getProduct(item: SaleItem): Product | null {
    if (typeof item.product === 'string') return null;
    return item.product;
  }

  getReturnItem(itemId: string): any {
    return this.returnData().returnItems.find(ri => ri.itemId === itemId);
  }

  getMaxReturnable(itemId: string): number {
    return this.maxReturnableMap.get(itemId) || 0;
  }

  // Update updateReturnQuantity to sync both
  updateReturnQuantity(itemId: string, quantity: string | number | null): void {
    const safeQuantity = typeof quantity === 'string' ? parseFloat(quantity) || 0 : quantity || 0;
    const maxReturnable = this.getMaxReturnable(itemId);
    const finalQuantity = Math.min(safeQuantity, maxReturnable);
    
    // Update returnQuantities
    this.returnQuantities.update(quantities => ({
      ...quantities,
      [itemId]: finalQuantity
    }));

    // Update returnData
    const returnItems = this.returnData().returnItems.map(ri => 
      ri.itemId === itemId ? { ...ri, quantity: finalQuantity } : ri
    );
    this.returnData.set({ ...this.returnData(), returnItems });
  }

 



  getTotalRefundAmount(): number {
    const sale = this.sale();
    if (!sale) return 0;

    return this.returnData().returnItems.reduce((total, returnItem) => {
      const saleItem = sale.items.find(item => item._id === returnItem.itemId);
      if (!saleItem) return total;
      return total + (saleItem.unitSalePrice * returnItem.quantity);
    }, 0);
  }

  getTotalReturnItems(): number {
    return this.returnData().returnItems.reduce((total, item) => total + item.quantity, 0);
  }

  hasReturns(): boolean {
    return this.getTotalReturnItems() > 0;
  }

  isFormValid(): boolean {
    return this.hasReturns() && !!this.returnData().reason.trim();
  }

  returnAllAvailable(): void {
    const returnItems = this.returnData().returnItems.map(ri => ({
      ...ri,
      quantity: this.getMaxReturnable(ri.itemId)
    }));
    this.returnData.set({ ...this.returnData(), returnItems });
  }

  clearAllReturns(): void {
    const returnItems = this.returnData().returnItems.map(ri => ({
      ...ri,
      quantity: 0
    }));
    this.returnData.set({ ...this.returnData(), returnItems });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please select items to return and provide a reason'
      });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to process this return? This action cannot be undone.',
      header: 'Confirm Return',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.processReturn();
      }
    });
  }

  private processReturn(): void {
    this.loading.set(true);

    // Filter out items with zero quantity before submitting
    const returnDataToSubmit = {
      ...this.returnData(),
      returnItems: this.returnData().returnItems.filter(item => item.quantity > 0)
    };

    this.saleService.returnSale(this.sale()!._id, returnDataToSubmit).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: response.message || 'Return processed successfully'
        });
        this.loading.set(false);
        this.router.navigate(['/sales', this.sale()!._id]);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to process return'
        });
        this.loading.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/sales', this.sale()!._id]);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}