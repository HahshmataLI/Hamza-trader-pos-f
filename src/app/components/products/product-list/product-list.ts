import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../../services/products/product-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService } from '../../../services/categories/category';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';

interface CategoryOption {
  label: string;
  value: string;
}
@Component({
  selector: 'app-product-list',
  imports: [RouterLink,UtilsModule,CommonModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
  providers: [ConfirmationService, MessageService],
})
export class ProductList  implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal(true);
  summary = signal<any>({});
  pagination = signal({
    currentPage: 1,
    totalPages: 0,
    totalProducts: 0,
    limit: 10
  });

  searchTerm = '';
  selectedCategory = 'all';
  stockFilter = 'all';
  
  categoryOptions: CategoryOption[] = [];
  stockOptions = [
    { label: 'All Products', value: 'all' },
    { label: 'In Stock', value: 'inStock' },
    { label: 'Low Stock', value: 'lowStock' },
    { label: 'Out of Stock', value: 'outOfStock' }
  ];

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }


  // ... existing code ...

  loadProducts(): void {
    this.loading.set(true);
    
    const params: any = {
      page: this.pagination().currentPage,
      limit: this.pagination().limit
    };

    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedCategory !== 'all') params.category = this.selectedCategory;
    if (this.stockFilter === 'lowStock') params.lowStock = true;

    console.log('Loading products with params:', params); // Debug log

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        console.log('Products response:', response); // Debug log
        this.products.set(response.data || []);
        this.summary.set(response.summary || {});
        this.pagination.update(p => ({
          ...p,
          totalPages: response.pagination?.totalPages || 0,
          totalProducts: response.pagination?.totalProducts || 0
        }));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error); // Debug log
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load products: ' + (error.error?.error || error.message)
        });
        this.loading.set(false);
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

  onSearch(): void {
    // Debounce search
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.update(p => ({ ...p, currentPage: 1 }));
      this.loadProducts();
    }, 500);
  }

  onFilterChange(): void {
    this.pagination.update(p => ({ ...p, currentPage: 1 }));
    this.loadProducts();
  }

  onPageChange(event: any): void {
    this.pagination.update(p => ({
      ...p,
      currentPage: event.page + 1,
      limit: event.rows
    }));
    this.loadProducts();
  }

  getCategoryName(product: Product): string {
    if (!product.category) return 'Unknown';
    if (typeof product.category === 'string') return 'Loading...';
    return product.category.name;
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
        this.loadProducts();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete product'
        });
      }
    });
  }
}