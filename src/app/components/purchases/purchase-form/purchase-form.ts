import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PurchaseService } from '../../../services/purchase/purchase-service';
import { SupplierService } from '../../../services/supplier/supplier-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProductService } from '../../../services/products/product-service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { CreatePurchaseRequest, Purchase, PurchaseItem, UpdatePurchaseRequest } from '../../../interfaces/purchase.interface';
import { Product } from '../../../interfaces/product.interface';
import { Supplier } from '../../../interfaces/supplier.Interface';
import { PURCHASE_STATUS } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';
@Component({
  selector: 'app-purchase-form',
  imports: [
     CommonModule,
    FormsModule,
    RouterModule,
    UtilsModule,
    InputNumberModule
  ],
  templateUrl: './purchase-form.html',
  styleUrl: './purchase-form.css',
  providers: [ConfirmationService, MessageService]
})
export class PurchaseForm  implements OnInit {
  private purchaseService = inject(PurchaseService);
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  purchase = signal<Purchase | null>(null);
  loading = signal(false);
  isEdit = signal(false);
  purchaseId = signal<string | null>(null);

  // Data sources
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);

  // Form model
  formData = signal<CreatePurchaseRequest>({
    supplier: '',
    items: [],
    purchaseDate: new Date().toISOString().split('T')[0],
    status: PURCHASE_STATUS.PENDING
  });

  // New item form
  newItem = signal({
    product: '',
    quantity: 1,
    unitCost: 0
  });

  // Computed properties
  pageTitle = computed(() => 
    this.isEdit() ? `Edit Purchase: ${this.purchase()?.purchaseNumber}` : 'Create New Purchase'
  );

  submitButtonText = computed(() => 
    this.loading() ? 'Saving...' : (this.isEdit() ? 'Update Purchase' : 'Create Purchase')
  );

  totalAmount = computed(() => {
    return this.formData().items.reduce((total, item) => total + (item.quantity * item.unitCost), 0);
  });

  totalItems = computed(() => {
    return this.formData().items.reduce((total, item) => total + item.quantity, 0);
  });

  statusOptions = [
    { label: 'Pending', value: PURCHASE_STATUS.PENDING },
    { label: 'Completed', value: PURCHASE_STATUS.COMPLETED },
    { label: 'Cancelled', value: PURCHASE_STATUS.CANCELLED }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    this.loadSuppliers();
    this.loadProducts();

    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.purchaseId.set(id);
      this.loadPurchase(id);
    } else {
      this.isEdit.set(false);
    }
  }

  loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (response) => {
        this.suppliers.set(response.data);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load suppliers'
        });
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.data as Product[]);
        this.filteredProducts.set(response.data as Product[]);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load products'
        });
      }
    });
  }

  loadPurchase(id: string): void {
    this.loading.set(true);
    this.purchaseService.getPurchase(id).subscribe({
      next: (response) => {
        const purchase = response.data;
        this.purchase.set(purchase);
        
        // Convert items to the format expected by the form
        const items = purchase.items.map(item => ({
          product: typeof item.product === 'string' ? item.product : item.product._id,
          quantity: item.quantity,
          unitCost: item.unitCost
        }));

        this.formData.set({
          supplier: typeof purchase.supplier === 'string' ? purchase.supplier : purchase.supplier._id,
          items: items,
          purchaseDate: purchase.purchaseDate.split('T')[0],
          status: purchase.status
        });
        
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load purchase'
        });
        this.loading.set(false);
        this.router.navigate(['/purchases']);
      }
    });
  }

  addItem(): void {
    const item = this.newItem();
    if (!item.product || item.quantity <= 0 || item.unitCost < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all item fields correctly'
      });
      return;
    }

    const currentItems = [...this.formData().items];
    const existingItemIndex = currentItems.findIndex(i => i.product === item.product);

    if (existingItemIndex > -1) {
      // Update existing item
      currentItems[existingItemIndex].quantity += item.quantity;
      currentItems[existingItemIndex].unitCost = item.unitCost;
    } else {
      // Add new item
      currentItems.push({ ...item });
    }

    this.formData.set({
      ...this.formData(),
      items: currentItems
    });

    // Reset new item form
    this.newItem.set({
      product: '',
      quantity: 1,
      unitCost: 0
    });
  }

  removeItem(index: number): void {
    const currentItems = [...this.formData().items];
    currentItems.splice(index, 1);
    this.formData.set({
      ...this.formData(),
      items: currentItems
    });
  }

  updateItemQuantity(index: number, quantity: number): void {
    const currentItems = [...this.formData().items];
    if (quantity > 0) {
      currentItems[index].quantity = quantity;
      this.formData.set({
        ...this.formData(),
        items: currentItems
      });
    }
  }

  updateItemUnitCost(index: number, unitCost: number): void {
    const currentItems = [...this.formData().items];
    if (unitCost >= 0) {
      currentItems[index].unitCost = unitCost;
      this.formData.set({
        ...this.formData(),
        items: currentItems
      });
    }
  }

  getProductName(productId: string): string {
    const product = this.products().find(p => p._id === productId);
    return product ? product.name : 'Unknown Product';
  }

  getProductStock(productId: string): number {
    const product = this.products().find(p => p._id === productId);
    return product ? product.stock : 0;
  }

  getItemTotal(item: PurchaseItem): number {
    return item.quantity * item.unitCost;
  }

  clearAllItems(): void {
    this.formData.set({
      ...this.formData(),
      items: []
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields and add at least one item'
      });
      return;
    }

    this.loading.set(true);

    const submitData = {
      ...this.formData(),
      items: this.formData().items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitCost: item.unitCost
      }))
    };

    if (this.isEdit() && this.purchaseId()) {
      // Update existing purchase
      this.purchaseService.updatePurchase(this.purchaseId()!, submitData as UpdatePurchaseRequest)
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Purchase updated successfully'
            });
            this.loading.set(false);
            this.router.navigate(['/purchases']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update purchase'
            });
            this.loading.set(false);
          }
        });
    } else {
      // Create new purchase
      this.purchaseService.createPurchase(submitData)
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Purchase created successfully'
            });
            this.loading.set(false);
            this.router.navigate(['/purchases']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create purchase'
            });
            this.loading.set(false);
          }
        });
    }
  }

  // Fix: Make this method public for template access
  isFormValid(): boolean {
    const data = this.formData();
    return !!(data.supplier && data.items.length > 0);
  }

  onCancel(): void {
    this.router.navigate(['/purchases']);
  }

  confirmCancel(): void {
    if (this.formData().items.length > 0) {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Are you sure you want to cancel?',
        header: 'Confirm Cancel',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.onCancel()
      });
    } else {
      this.onCancel();
    }
  }
}