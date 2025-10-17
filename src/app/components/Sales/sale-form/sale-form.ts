import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { SaleService } from '../../../services/sales/sale-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CustomerService } from '../../../services/customer/customer-service';
import { ProductService } from '../../../services/products/product-service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Customer } from '../../../interfaces/customer.Interface';
import { Product } from '../../../interfaces/product.interface';
import { CreateSaleRequest } from '../../../interfaces/sale.Interface';
import { PAYMENT_METHODS } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sale-form',
  imports: [UtilsModule,CommonModule],
  templateUrl: './sale-form.html',
  styleUrl: './sale-form.css',
  providers: [ConfirmationService, MessageService]

})
export class SaleForm  implements OnInit {
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  loading = signal(false);
  
  // Data sources
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);

  // Form model
  formData = signal<CreateSaleRequest>({
    customer: '',
    items: [],
    paymentMethod: PAYMENT_METHODS.CASH,
    discount: 0,
    taxAmount: 0,
    notes: ''
  });

  // New item form
  newItem = signal({
    product: '',
    quantity: 1,
    unitSalePrice: 0
  });

  // Computed properties
  subtotal = computed(() => {
    return this.formData().items.reduce((total, item) => total + (item.quantity * item.unitSalePrice), 0);
  });

  totalAmount = computed(() => {
    return this.subtotal() - (this.formData().discount || 0) + (this.formData().taxAmount || 0);
  });

  totalItems = computed(() => {
    return this.formData().items.reduce((total, item) => total + item.quantity, 0);
  });

  paymentMethodOptions = [
    { label: 'Cash', value: PAYMENT_METHODS.CASH },
    { label: 'Card', value: PAYMENT_METHODS.CARD },
    { label: 'Digital Payment', value: PAYMENT_METHODS.DIGITAL },
    { label: 'Credit', value: PAYMENT_METHODS.CREDIT }
  ];

  constructor() {
    // Auto-update unit sale price when product changes
    effect(() => {
      const productId = this.newItem().product;
      if (productId) {
        const product = this.products().find(p => p._id === productId);
        if (product) {
          this.newItem.update(item => ({
            ...item,
            unitSalePrice: product.mrp // Default to MRP, can be negotiated
          }));
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();

    // Check for customer query parameter
    const customerId = this.route.snapshot.queryParamMap.get('customer');
    if (customerId) {
      this.formData.update(data => ({ ...data, customer: customerId }));
    }
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers.set(response.data);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load customers'
        });
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (response) => {
        const products = (response.data as Product[]).filter(p => p.isActive && p.stock > 0);
        this.products.set(products);
        this.filteredProducts.set(products);
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

  // Fix: Add missing getSelectedCustomer method
  getSelectedCustomer(): Customer | undefined {
    const customerId = this.formData().customer;
    if (!customerId) return undefined;
    return this.customers().find(c => c._id === customerId);
  }

  addItem(): void {
    const item = this.newItem();
    if (!item.product || item.quantity <= 0 || item.unitSalePrice < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill all item fields correctly'
      });
      return;
    }

    const product = this.products().find(p => p._id === item.product);
    if (!product) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Selected product not found'
      });
      return;
    }

    if (item.quantity > product.stock) {
      this.messageService.add({
        severity: 'error',
        summary: 'Insufficient Stock',
        detail: `Only ${product.stock} units available for ${product.name}`
      });
      return;
    }

    if (item.unitSalePrice < product.minSalePrice) {
      const minPriceFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(product.minSalePrice);
      
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Price',
        detail: `Sale price cannot be below minimum: ${minPriceFormatted}`
      });
      return;
    }

    const currentItems = [...this.formData().items];
    const existingItemIndex = currentItems.findIndex(i => i.product === item.product);

    if (existingItemIndex > -1) {
      const newQuantity = currentItems[existingItemIndex].quantity + item.quantity;
      if (newQuantity > product.stock) {
        this.messageService.add({
          severity: 'error',
          summary: 'Insufficient Stock',
          detail: `Cannot add more than ${product.stock} units of ${product.name}`
        });
        return;
      }
      currentItems[existingItemIndex].quantity = newQuantity;
      currentItems[existingItemIndex].unitSalePrice = item.unitSalePrice;
    } else {
      currentItems.push({ ...item });
    }

    this.formData.set({
      ...this.formData(),
      items: currentItems
    });

    this.newItem.set({
      product: '',
      quantity: 1,
      unitSalePrice: 0
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

  // Fix: Add missing updateItemQuantity method
  updateItemQuantity(index: number, quantity: number): void {
    const currentItems = [...this.formData().items];
    const product = this.products().find(p => p._id === currentItems[index].product);
    
    if (product && quantity > product.stock) {
      this.messageService.add({
        severity: 'error',
        summary: 'Insufficient Stock',
        detail: `Only ${product.stock} units available for ${product.name}`
      });
      return;
    }

    if (quantity > 0) {
      currentItems[index].quantity = quantity;
      this.formData.set({
        ...this.formData(),
        items: currentItems
      });
    }
  }

  // Fix: Add missing updateItemPrice method
  updateItemPrice(index: number, price: number): void {
    const currentItems = [...this.formData().items];
    const product = this.products().find(p => p._id === currentItems[index].product);
    
    if (product && price < product.minSalePrice) {
      const minPriceFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(product.minSalePrice);
      
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Price',
        detail: `Sale price cannot be below minimum: ${minPriceFormatted}`
      });
      return;
    }

    if (price >= 0) {
      currentItems[index].unitSalePrice = price;
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

  getProductMrp(productId: string): number {
    const product = this.products().find(p => p._id === productId);
    return product ? product.mrp : 0;
  }

  getProductMinPrice(productId: string): number {
    const product = this.products().find(p => p._id === productId);
    return product ? product.minSalePrice : 0;
  }

  getItemTotal(item: any): number {
    return item.quantity * item.unitSalePrice;
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
        detail: 'Please add at least one item to create sale'
      });
      return;
    }

    this.loading.set(true);

    this.saleService.createSale(this.formData()).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Sale created successfully'
        });
        this.loading.set(false);
        this.router.navigate(['/sales']);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to create sale'
        });
        this.loading.set(false);
      }
    });
  }

  isFormValid(): boolean {
    return this.formData().items.length > 0;
  }

  onCancel(): void {
    if (this.formData().items.length > 0) {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Are you sure you want to cancel?',
        header: 'Confirm Cancel',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.router.navigate(['/sales'])
      });
    } else {
      this.router.navigate(['/sales']);
    }
  }

  applyDiscount(percentage: number): void {
    const discountAmount = (this.subtotal() * percentage) / 100;
    this.formData.update(data => ({
      ...data,
      discount: discountAmount
    }));
  }

  calculateProfit(item: any): number {
    const product = this.products().find(p => p._id === item.product);
    if (!product) return 0;
    return (item.unitSalePrice - product.costPrice) * item.quantity;
  }

  getTotalProfit(): number {
    return this.formData().items.reduce((total, item) => total + this.calculateProfit(item), 0);
  }
}