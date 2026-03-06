import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ProductService } from '../../../services/products/product-service';
import { AuthService } from '../../../services/auth';
import { Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { ProgressSpinner } from "primeng/progressspinner";
import { Pipe, PipeTransform } from '@angular/core';
@Component({
  selector: 'app-product-details',
  imports: [RouterLink, CommonModule, UtilsModule, ProgressSpinner],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
  providers: [MessageService],
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  authService = inject(AuthService);

  productId: string | null = null;
  product = signal<Product | null>(null);
  loading = signal(true);
  selectedImage: string | null = null;

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.loadProductDetails();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid product ID'
      });
      this.router.navigate(['/products']);
    }
  }
hasAttributes(product: any): boolean {
  return product?.attributes && Object.keys(product.attributes).length > 0;
}
  loadProductDetails(): void {
    if (!this.productId) return;
    
    this.loading.set(true);
    this.productService.getProduct(this.productId).subscribe({
      next: (response) => {
        this.product.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load product details: ' + (error.error?.error || error.message)
        });
        this.loading.set(false);
      }
    });
  }

  getCategoryName(product: Product): string {
    if (!product.category) return 'No Category';
    if (typeof product.category === 'string') {
      // If category is just an ID, show loading or fetch category name
      return 'Loading...';
    }
    return product.category.name;
  }

  calculateMarginPercentage(cost: number, mrp: number): string {
    if (cost <= 0) return '0';
    const margin = ((mrp - cost) / cost) * 100;
    return margin.toFixed(2);
  }

  getAttributesList(product: Product): { key: string; value: any }[] {
    if (!product || !product.attributes) return [];
    
    return Object.entries(product.attributes).map(([key, value]) => ({
      key: key.replace(/_/g, ' '),
      value: value
    }));
  }

  goBack(): void {
    this.location.back();
  }
}