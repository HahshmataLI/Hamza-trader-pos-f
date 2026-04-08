// sale-form.component.ts - Add camera scanning
import { Component, computed, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SaleService } from '../../../services/sales/sale-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CustomerService } from '../../../services/customer/customer-service';
import { ProductService } from '../../../services/products/product-service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Customer } from '../../../interfaces/customer.Interface';
import { Product } from '../../../interfaces/product.interface';
import { CartItem, CreateSaleRequest, CreateSaleItem } from '../../../interfaces/sale.Interface';
import { PAYMENT_METHODS } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { ZXingScannerModule, } from '@zxing/ngx-scanner';
// Extended Product type with temporary sale price for UI
interface ProductWithTempPrice extends Product {
  tempSalePrice?: number;
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [UtilsModule, CommonModule,ZXingScannerModule,],
  templateUrl: './sale-form.html',
  styleUrls: ['./sale-form.css'],
  providers: [ConfirmationService, MessageService]
})
export class SaleForm implements OnInit, AfterViewInit {
  private saleService = inject(SaleService);
  private customerService = inject(CustomerService);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  @ViewChild('barcodeInput') barcodeInput!: ElementRef;
  @ViewChild('quantityInput') quantityInput!: ElementRef;
  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  // State signals
  loading = signal(false);
  barcodeMode = signal(true);
  scanning = signal(false);
  cameraEnabled = signal(false);
  torchEnabled = signal(false);
  searchTerm = signal('');
  searchLoading = signal(false);
  availableCameras: MediaDeviceInfo[] = [];
selectedCamera: MediaDeviceInfo | undefined = undefined;
  
  // Data sources
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  
  // Cart state
  cart = signal<CartItem[]>([]);
  
  // Form state
  customer = signal<string>('');
  paymentMethod = signal<string>(PAYMENT_METHODS.CASH);
  discount = signal<number>(0);
  taxAmount = signal<number>(0);
  notes = signal<string>('');
  
  // New item being added - using extended type with temp price
  currentBarcode = signal<string>('');
  currentQuantity = signal<number>(1);
  currentProduct = signal<ProductWithTempPrice | null>(null);
  
  // Price validation for bargaining
  priceError = signal<string>('');
  
  // Search
  private searchSubject = new Subject<string>();

  // Barcode formats to scan
  allowedFormats = [
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.QR_CODE
  ];

  // Computed values
  subtotal = computed(() => {
    return this.cart().reduce((total, item) => total + (item.quantity * item.unitSalePrice), 0);
  });

  totalAmount = computed(() => {
    return this.subtotal() - this.discount() + this.taxAmount();
  });

  totalItems = computed(() => {
    return this.cart().reduce((total, item) => total + item.quantity, 0);
  });

  totalProfit = computed(() => {
    return this.cart().reduce((total, item) => total + item.profit, 0);
  });

  // Price validation helper
  priceRange = computed(() => {
    const product = this.currentProduct();
    if (!product) return null;
    return {
      min: product.minSalePrice,
      max: product.mrp,
      cost: product.costPrice,
      current: product.tempSalePrice || product.mrp
    };
  });

  // Preview calculations for current product
  previewProfit = computed(() => {
    const product = this.currentProduct();
    const quantity = this.currentQuantity();
    const price = product?.tempSalePrice || product?.mrp || 0;
    
    if (!product || quantity <= 0) return 0;
    return (price - product.costPrice) * quantity;
  });

  previewMargin = computed(() => {
    const product = this.currentProduct();
    const price = product?.tempSalePrice || product?.mrp || 0;
    
    if (!product || product.costPrice === 0) return 0;
    return ((price - product.costPrice) / product.costPrice * 100);
  });

  cartSummary = computed(() => ({
    subtotal: this.subtotal(),
    discount: this.discount(),
    tax: this.taxAmount(),
    total: this.totalAmount(),
    items: this.totalItems(),
    profit: this.totalProfit()
  }));

  paymentMethodOptions = [
    { label: 'Cash', value: PAYMENT_METHODS.CASH },
    { label: 'Card', value: PAYMENT_METHODS.CARD },
    { label: 'Digital Payment', value: PAYMENT_METHODS.DIGITAL },
    { label: 'Credit', value: PAYMENT_METHODS.CREDIT }
  ];

  constructor() {
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.searchLoading.set(true);
        return this.productService.getProducts({ 
          search: term,
          limit: 10
        });
      })
    ).subscribe({
      next: (response) => {
        const products = (response.data as Product[]).filter(p => p.isActive && p.stock > 0);
        this.filteredProducts.set(products);
        this.searchLoading.set(false);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Search Failed',
          detail: 'Failed to search products'
        });
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.barcodeInput) {
        this.barcodeInput.nativeElement.focus();
      }
    }, 500);
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();

    const customerId = this.route.snapshot.queryParamMap.get('customer');
    if (customerId) {
      this.customer.set(customerId);
    }
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (response) => {
        this.customers.set(response.data);
      },
      error: (error) => {
        console.error('Customer load error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load customers'
        });
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts({ limit: 100 }).subscribe({
      next: (response) => {
        const products = (response.data as Product[]).filter(p => p.isActive && p.stock > 0);
        this.products.set(products);
        this.filteredProducts.set(products);
      },
      error: (error) => {
        console.error('Product load error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load products'
        });
      }
    });
  }

  // CAMERA SCANNING METHODS

  openCamera(): void {
    this.cameraEnabled.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Camera Opening',
      detail: 'Please allow camera access to scan barcodes',
      life: 3000
    });
  }

  closeCamera(): void {
    this.cameraEnabled.set(false);
    this.torchEnabled.set(false);
  }

  toggleTorch(): void {
    this.torchEnabled.set(!this.torchEnabled());
  }

  onCamerasFound(cameras: MediaDeviceInfo[]): void {
    this.availableCameras = cameras;
    // Prefer back camera for mobile
    const backCamera = cameras.find(camera => 
      camera.label.toLowerCase().includes('back') || 
      camera.label.toLowerCase().includes('rear')
    );
    this.selectedCamera = backCamera || cameras[0] || null;
  }

  onCameraSelected(camera: MediaDeviceInfo): void {
    this.selectedCamera = camera;
  }

  onScanSuccess(result: string): void {
    // Stop scanning after successful scan
    this.cameraEnabled.set(false);
    
    // Process the scanned barcode
    this.processBarcode(result);
  }

  onScanError(error: any): void {
    console.error('Scan error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Scan Error',
      detail: 'Failed to scan barcode. Please try again.'
    });
  }

  processBarcode(barcode: string): void {
    this.scanning.set(true);
    
    this.productService.getProductByBarcode(barcode).subscribe({
      next: (response) => {
        const product = response.data;
        
        if (!product.isActive) {
          this.messageService.add({
            severity: 'error',
            summary: 'Product Inactive',
            detail: `${product.name} is not available for sale`
          });
          this.scanning.set(false);
          return;
        }

        if (product.stock <= 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Out of Stock',
            detail: `${product.name} is out of stock`
          });
          this.scanning.set(false);
          return;
        }

        // Set current product with temp price
        this.currentProduct.set({
          ...product,
          tempSalePrice: product.mrp
        });
        this.currentQuantity.set(1);
        
        // Focus quantity input for bargaining
        setTimeout(() => this.quantityInput?.nativeElement?.focus(), 100);
        this.scanning.set(false);

        // Success message
        this.messageService.add({
          severity: 'success',
          summary: 'Barcode Scanned',
          detail: `${product.name} found`,
          life: 2000
        });
      },
      error: (error) => {
        console.error('Barcode lookup error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Product Not Found',
          detail: `No product found with barcode: ${barcode}`
        });
        this.currentProduct.set(null);
        this.scanning.set(false);
      }
    });
  }

  // MANUAL BARCODE INPUT

  onBarcodeEntered(event: any): void {
    const barcode = event.target.value.trim();
    if (!barcode) return;
    this.processBarcode(barcode);
    event.target.value = ''; // Clear input after processing
  }

  // Validate price for bargaining
  validatePrice(product: Product, price: number): string | null {
    if (price < product.minSalePrice) {
      return `Price cannot be below minimum: ${this.formatCurrency(product.minSalePrice)}`;
    }
    if (price > product.mrp) {
      return `Price cannot exceed MRP: ${this.formatCurrency(product.mrp)}`;
    }
    return null;
  }

  // Update temp price for current product (for bargaining)
  updateTempPrice(price: number): void {
    const product = this.currentProduct();
    if (!product) return;
    
    const priceError = this.validatePrice(product, price);
    if (priceError) {
      this.priceError.set(priceError);
    } else {
      this.priceError.set('');
      this.currentProduct.set({
        ...product,
        tempSalePrice: price
      });
    }
  }

  // Quick price buttons for bargaining
  setMinPrice(): void {
    const product = this.currentProduct();
    if (product) {
      this.currentProduct.set({
        ...product,
        tempSalePrice: product.minSalePrice
      });
      this.priceError.set('');
    }
  }

  setMaxPrice(): void {
    const product = this.currentProduct();
    if (product) {
      this.currentProduct.set({
        ...product,
        tempSalePrice: product.mrp
      });
      this.priceError.set('');
    }
  }

  setAveragePrice(): void {
    const product = this.currentProduct();
    if (product) {
      const avgPrice = (product.minSalePrice + product.mrp) / 2;
      this.currentProduct.set({
        ...product,
        tempSalePrice: avgPrice
      });
      this.priceError.set('');
    }
  }

 addCurrentProductWithQuantity(): void {
  const product = this.currentProduct();
  const quantity = this.currentQuantity();
  const price = product?.tempSalePrice ?? product?.mrp ?? 0;
  
  if (!product) return;
  
  // Validate price
  const priceError = this.validatePrice(product, price);
  if (priceError) {
    this.messageService.add({
      severity: 'error',
      summary: 'Invalid Price',
      detail: priceError
    });
    return;
  }

  // Add product to cart
  this.addToCart(product, quantity, price);

  // Reset current product & quantity
  this.currentProduct.set(null);
  this.currentQuantity.set(1);
  this.priceError.set('');

  // ✅ Focus input depending on mode
  if (this.barcodeMode()) {
    setTimeout(() => this.barcodeInput?.nativeElement?.focus(), 100);
  } else {
    setTimeout(() => this.quantityInput?.nativeElement?.focus(), 100);
  }
}
  addToCart(product: Product, quantity: number, unitSalePrice: number = product.mrp): void {
    // Validate stock
    if (quantity > product.stock) {
      this.messageService.add({
        severity: 'error',
        summary: 'Insufficient Stock',
        detail: `Only ${product.stock} units available for ${product.name}`
      });
      return;
    }

    // Validate price for bargaining
    const priceError = this.validatePrice(product, unitSalePrice);
    if (priceError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Price',
        detail: priceError
      });
      return;
    }

    // Check if product already in cart
    const existingItemIndex = this.cart().findIndex(item => item.product._id === product._id);
    
    if (existingItemIndex > -1) {
      // Update existing item
      const updatedCart = [...this.cart()];
      const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        this.messageService.add({
          severity: 'error',
          summary: 'Insufficient Stock',
          detail: `Cannot add more than ${product.stock} units of ${product.name}`
        });
        return;
      }
      
      updatedCart[existingItemIndex].quantity = newQuantity;
      updatedCart[existingItemIndex].unitSalePrice = unitSalePrice;
      updatedCart[existingItemIndex].total = newQuantity * unitSalePrice;
      updatedCart[existingItemIndex].profit = (unitSalePrice - product.costPrice) * newQuantity;
      
      this.cart.set(updatedCart);
    } else {
      // Add new item
      const newItem: CartItem = {
        product,
        quantity,
        unitSalePrice,
        unitMrp: product.mrp,
        total: quantity * unitSalePrice,
        profit: (unitSalePrice - product.costPrice) * quantity,
        isValid: true
      };
      
      this.cart.set([...this.cart(), newItem]);
    }

    // Show success message with price info
    const profitAmount = (unitSalePrice - product.costPrice) * quantity;
    const profitMargin = ((unitSalePrice - product.costPrice) / product.costPrice * 100).toFixed(1);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Added to Cart',
      detail: `${quantity}x ${product.name} at ${this.formatCurrency(unitSalePrice)} (Profit: ${this.formatCurrency(profitAmount)} | ${profitMargin}%)`,
      life: 3000
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // CART MANAGEMENT METHODS

  updateQuantity(index: number, newQuantity: number): void {
    const updatedCart = [...this.cart()];
    const item = updatedCart[index];
    const product = item.product;

    if (newQuantity > product.stock) {
      this.messageService.add({
        severity: 'error',
        summary: 'Insufficient Stock',
        detail: `Only ${product.stock} units available`
      });
      return;
    }

    if (newQuantity > 0) {
      item.quantity = newQuantity;
      item.total = newQuantity * item.unitSalePrice;
      item.profit = (item.unitSalePrice - product.costPrice) * newQuantity;
      this.cart.set(updatedCart);
      
      const profitAmount = item.profit;
      const profitMargin = ((item.unitSalePrice - product.costPrice) / product.costPrice * 100).toFixed(1);
      
      this.messageService.add({
        severity: 'info',
        summary: 'Quantity Updated',
        detail: `New profit: ${this.formatCurrency(profitAmount)} (${profitMargin}%)`,
        life: 2000
      });
    }
  }

  updatePrice(index: number, newPrice: number): void {
    const updatedCart = [...this.cart()];
    const item = updatedCart[index];
    const product = item.product;

    const priceError = this.validatePrice(product, newPrice);
    if (priceError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Price',
        detail: priceError
      });
      return;
    }

    if (newPrice >= 0) {
      const oldPrice = item.unitSalePrice;
      item.unitSalePrice = newPrice;
      item.total = item.quantity * newPrice;
      item.profit = (newPrice - product.costPrice) * item.quantity;
      this.cart.set(updatedCart);
      
      const priceDiff = newPrice - oldPrice;
      const profitDiff = priceDiff * item.quantity;
      const profitMargin = ((newPrice - product.costPrice) / product.costPrice * 100).toFixed(1);
      
      this.messageService.add({
        severity: priceDiff >= 0 ? 'info' : 'warn',
        summary: 'Price Updated',
        detail: `New price: ${this.formatCurrency(newPrice)} (${profitDiff >= 0 ? '+' : ''}${this.formatCurrency(profitDiff)} profit) | Margin: ${profitMargin}%`,
        life: 3000
      });
    }
  }

  removeItem(index: number): void {
    const updatedCart = [...this.cart()];
    updatedCart.splice(index, 1);
    this.cart.set(updatedCart);
    
    this.messageService.add({
      severity: 'info',
      summary: 'Item Removed',
      detail: 'Item removed from cart',
      life: 2000
    });
  }

  clearCart(): void {
    if (this.cart().length > 0) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to clear all items from cart?',
        header: 'Confirm Clear',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.cart.set([]);
          this.messageService.add({
            severity: 'info',
            summary: 'Cart Cleared',
            detail: 'All items removed from cart'
          });
        }
      });
    }
  }

  // SEARCH METHODS

  onSearch(term: string): void {
    this.searchTerm.set(term);
    if (term.trim().length >= 2) {
      this.searchSubject.next(term);
    } else {
      this.filteredProducts.set(this.products());
    }
  }

selectProductFromSearch(product: Product): void {
  if (!product.isActive) {
    this.messageService.add({
      severity: 'error',
      summary: 'Inactive Product',
      detail: `${product.name} is not available for sale`
    });
    return;
  }

  if (product.stock <= 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Out of Stock',
      detail: `${product.name} is out of stock`
    });
    return;
  }

  // Set current product with default tempSalePrice and quantity
  this.currentProduct.set({ ...product, tempSalePrice: product.mrp });
  this.currentQuantity.set(1);

  // Clear search UI
  this.searchTerm.set('');
  this.filteredProducts.set([]);

  // ✅ Auto-add to cart immediately
  this.addCurrentProductWithQuantity();

  // Focus input based on mode for next product
  if (this.barcodeMode()) {
    setTimeout(() => this.barcodeInput?.nativeElement?.focus(), 100);
  } else {
    setTimeout(() => this.quantityInput?.nativeElement?.focus(), 100);
  }
}

  // DISCOUNT METHODS

  applyDiscountPercentage(percentage: number): void {
    const discountAmount = (this.subtotal() * percentage) / 100;
    this.discount.set(discountAmount);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Discount Applied',
      detail: `${percentage}% discount (${this.formatCurrency(discountAmount)}) applied`,
      life: 2000
    });
  }

  applyFixedDiscount(amount: number): void {
    if (amount <= this.subtotal()) {
      this.discount.set(amount);
      this.messageService.add({
        severity: 'success',
        summary: 'Discount Applied',
        detail: `${this.formatCurrency(amount)} discount applied`,
        life: 2000
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Discount',
        detail: 'Discount cannot exceed subtotal'
      });
    }
  }

  // SUBMIT METHODS

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please add at least one item to cart'
      });
      return;
    }

    this.loading.set(true);

    const saleItems: CreateSaleItem[] = this.cart().map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      unitSalePrice: item.unitSalePrice
    }));

    const saleData: CreateSaleRequest = {
      customer: this.customer() || undefined,
      items: saleItems,
      paymentMethod: this.paymentMethod() as any,
      discount: this.discount(),
      taxAmount: this.taxAmount(),
      notes: this.notes()
    };

    this.saleService.createSale(saleData).subscribe({
      next: (response) => {
        const totalProfit = this.totalProfit();
        const profitMargin = (totalProfit / (this.subtotal() - this.discount()) * 100).toFixed(1);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Sale completed! Total: ${this.formatCurrency(this.totalAmount())} | Profit: ${this.formatCurrency(totalProfit)} (${profitMargin}%)`
        });
        
        this.printReceipt(response.data);
        
        this.loading.set(false);
        this.router.navigate(['/sales', response.data._id]);
      },
      error: (error) => {
        console.error('Sale creation error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to create sale'
        });
        this.loading.set(false);
      }
    });
  }

  printReceipt(sale: any): void {
    console.log('Printing receipt for sale:', sale.invoiceNumber);
  }

  isFormValid(): boolean {
    return this.cart().length > 0;
  }

  onCancel(): void {
    if (this.cart().length > 0) {
      this.confirmationService.confirm({
        message: 'You have items in cart. Are you sure you want to cancel?',
        header: 'Confirm Cancel',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.router.navigate(['/sales'])
      });
    } else {
      this.router.navigate(['/sales']);
    }
  }

  getSelectedCustomer(): Customer | undefined {
    const customerId = this.customer();
    if (!customerId) return undefined;
    return this.customers().find(c => c._id === customerId);
  }

  toggleMode(): void {
    this.barcodeMode.set(!this.barcodeMode());
    if (this.barcodeMode()) {
      setTimeout(() => this.barcodeInput?.nativeElement?.focus(), 100);
    }
  }

  getPriceRange(product: Product): string {
    return `${this.formatCurrency(product.minSalePrice)} - ${this.formatCurrency(product.mrp)}`;
  }

  isPriceInRange(product: Product, price: number): boolean {
    return price >= product.minSalePrice && price <= product.mrp;
  }
}