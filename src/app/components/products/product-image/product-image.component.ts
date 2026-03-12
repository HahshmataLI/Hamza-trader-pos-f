// components/product-image/product-image.component.ts
import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-product-image',
  template: `
    <div class="relative w-10 h-10">
      @if (loading()) {
        <div class="absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
          <span class="text-gray-400">📷</span>
        </div>
      }
      <img 
        [src]="src" 
        [alt]="alt"
        class="w-10 h-10 rounded-lg object-cover transition-opacity duration-300"
        [class.opacity-0]="loading()"
        (load)="onLoad()"
        (error)="onError()"
      />
    </div>
  `
})
export class ProductImageComponent {
  @Input() src = '';
  @Input() alt = '';
  
  loading = signal(true);

  onLoad() {
    this.loading.set(false);
  }

  onError() {
    this.loading.set(false);
    this.src = 'assets/placeholder.png'; // Fallback image
  }
}