import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { ProductService } from '../../../services/products/product-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService } from '../../../services/categories/category';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { API_URL, SERVER_URL } from '../../../utils/constants'; // Import your API URL

interface CategoryOption {
  label: string;
  value: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null;

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, UtilsModule, CommonModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ConfirmationService, MessageService],
})
export class ProductList implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  Math = Math;
  apiUrl = API_URL; // Make API_URL available in template

  products = signal<Product[]>([]);
  loading = signal(false);
  initialLoad = signal(true);
  
  summary = signal<any>({});
  pagination = signal<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filters
  searchTerm = signal('');
  selectedCategory = signal('all');
  stockFilter = signal('all');
  
  // Sort state
  sortField = signal('createdAt');
  sortOrder = signal(-1);

  categoryOptions: CategoryOption[] = [];
  stockOptions = [
    { label: 'All Products', value: 'all' },
    { label: 'Low Stock', value: 'lowStock' },
    { label: 'Out of Stock', value: 'outOfStock' }
  ];

  private searchSubject = new Subject<string>();
  private filterSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadCategories();
    this.setupSearchDebounce();
    this.setupFilterDebounce();
    // Initial load
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pagination.update(p => ({ ...p, currentPage: 1 }));
      this.loadProducts();
    });
  }

  private setupFilterDebounce(): void {
    this.filterSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.pagination.update(p => ({ ...p, currentPage: 1 }));
      this.loadProducts();
    });
  }

  loadProducts(event?: TableLazyLoadEvent): void {
    this.loading.set(true);

    if (event) {
      const page = event?.first != null && event?.rows != null
        ? Math.floor(event.first / event.rows) + 1
        : 1;

      const limit = event?.rows ?? this.pagination().limit;
      
      this.pagination.update(p => ({
        ...p,
        currentPage: page,
        limit: limit
      }));

      if (event.sortField) {
        const sortField = Array.isArray(event.sortField)
          ? event.sortField[0]
          : event.sortField;

        this.sortField.set(sortField);
        this.sortOrder.set(event.sortOrder === 1 ? 1 : -1);
      }
    }

    const params: any = {
      page: this.pagination().currentPage,
      limit: this.pagination().limit,
      sortField: this.sortField(),
      sortOrder: this.sortOrder()
    };

    if (this.searchTerm() && this.searchTerm().length >= 2) {
      params.search = this.searchTerm();
    }

    if (this.selectedCategory() !== 'all') {
      params.category = this.selectedCategory();
    }

    if (this.stockFilter() === 'lowStock') {
      params.lowStock = true;
    }

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        this.products.set(response.data || []);
        
        this.summary.set(response.summary || {
          totalProducts: 0,
          totalStockValue: 0,
          lowStockCount: 0,
          outOfStockCount: 0
        });

        this.pagination.update(p => ({
          ...p,
          totalPages: Math.ceil((response.pagination?.totalProducts || 0) / p.limit),
          totalProducts: response.pagination?.totalProducts || 0,
          hasNextPage: p.currentPage < Math.ceil((response.pagination?.totalProducts || 0) / p.limit),
          hasPrevPage: p.currentPage > 1
        }));

        this.loading.set(false);
        this.initialLoad.set(false);
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load products. Please try again.'
        });
        this.loading.set(false);
        this.initialLoad.set(false);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categoryOptions = [
          { label: 'All Categories', value: 'all' },
          ...(response.data?.map(cat => ({
            label: cat.name,
            value: cat._id
          })) || [])
        ];
      },
      error: (error) => {
        console.error('Failed to load categories', error);
      }
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    if (input.value.length >= 2 || input.value.length === 0) {
      this.searchSubject.next(input.value);
    }
  }

  onCategoryChange(): void {
    this.filterSubject.next();
  }

  onStockChange(): void {
    this.filterSubject.next();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.loadProducts(event);
  }

  getCategoryName(product: Product): string {
    if (!product.category) return 'Unknown';
    if (typeof product.category === 'string') return 'Loading...';
    return product.category.name;
  }

  getStockSeverity(stock: number, minStockLevel: number): TagSeverity {
    if (stock === 0) return 'danger';
    if (stock <= minStockLevel) return 'warn';
    return 'success';
  }

  getStockStatus(stock: number, minStockLevel: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock <= minStockLevel) return 'Low Stock';
    return 'In Stock';
  }

  // FIXED: Construct full image URL
getImageUrl(imagePath?: string): string {
  if (!imagePath) {
    return 'assets/images/placeholder.png';
  }

  return `${SERVER_URL}${imagePath}`;
}

  confirmDelete(product: Product): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${product.name}"? This will make the product inactive.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteProduct(product._id)
    });
  }

  deleteProduct(id: string): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Product deleted successfully'
        });
        
        // Reload current page
        this.loadProducts();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.error || 'Failed to delete product'
        });
      }
    });
  }
// Add this method to handle image loading errors
handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;

  if (!img.src.includes('placeholder.png')) {
    img.src = 'assets/images/placeholder.png';
  }
}
  refreshProducts(): void {
    this.pagination.update(p => ({ ...p, currentPage: 1 }));
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('all');
    this.stockFilter.set('all');
    this.sortField.set('createdAt');
    this.sortOrder.set(-1);
    this.pagination.update(p => ({ ...p, currentPage: 1 }));
    this.loadProducts();
  }
}