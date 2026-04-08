import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ProductService } from '../../../services/products/product-service';
import { AuthService } from '../../../services/auth';
import { Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { ProgressSpinner } from "primeng/progressspinner";
import JsBarcode from 'jsbarcode';
import { SERVER_URL } from '../../../utils/constants';
import { BarcodePrintService, BarcodeLabel } from '../../../services/barcode-pdf.service';

// PrimeNG imports
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    RouterLink, 
    CommonModule, 
    UtilsModule, 
    ProgressSpinner,
    DialogModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    CheckboxModule,
    CardModule,
    TagModule,
    ToastModule,
    FormsModule
  ],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
  providers: [MessageService, BarcodePrintService],
})
export class ProductDetails implements OnInit, AfterViewInit {
  @ViewChild('barcodeCanvas') barcodeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barcodePreview') barcodePreview!: ElementRef<HTMLCanvasElement>;
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  authService = inject(AuthService);
  private barcodePrintService = inject(BarcodePrintService);

  productId: string | null = null;
  product = signal<Product | null>(null);
  loading = signal(true);
  selectedImage: string | null = null;
  
  // Barcode printing state
  showBarcodeModal = signal(false);
  barcodeFormat = signal<'CODE128' | 'CODE39' | 'EAN13' | 'UPC'>('CODE128');
  barcodeWidth = signal(2);
  barcodeHeight = signal(100);
  barcodeFontSize = signal(20);
  printCopies = signal(1);
  showProductName = signal(true);
  showPrice = signal(false);
  SERVER_URL = SERVER_URL;
  
  // Barcode preview URL
  barcodePreviewUrl = signal<string | null>(null);
  
  // A4 layout options
  labelSize = signal<'small' | 'standard' | 'large'>('standard');
  gridColumns = signal<number>(3);

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

  ngAfterViewInit() {
    // Generate barcode when modal opens
    if (this.showBarcodeModal()) {
      setTimeout(() => this.generateBarcode(), 200);
    }
  }

  getImageUrl(image?: string): string {
    if (!image) return 'assets/images/placeholder.png';
    if (image.startsWith('http')) {
      return image;
    }
    return `${this.SERVER_URL}${image}`;
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

  // Barcode Methods
  openBarcodeModal(): void {
    const currentProduct = this.product();
    if (!currentProduct?.barcode) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No barcode available for this product'
      });
      return;
    }
    
    this.showBarcodeModal.set(true);
    setTimeout(() => this.generateBarcode(), 200);
  }

  closeBarcodeModal(): void {
    this.showBarcodeModal.set(false);
    this.barcodePreviewUrl.set(null);
  }

  private getBarcodeValue(): string | null {
    const product = this.product();
    return product?.barcode || null;
  }

  generateBarcode(): void {
    const barcodeValue = this.getBarcodeValue();
    if (!barcodeValue) return;

    try {
      const canvas = this.barcodePreview?.nativeElement || this.barcodeCanvas?.nativeElement;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      canvas.width = 400;
      canvas.height = this.barcodeHeight() + 60;

      JsBarcode(canvas, barcodeValue, {
        format: this.barcodeFormat(),
        width: this.barcodeWidth(),
        height: this.barcodeHeight(),
        displayValue: true,
        fontSize: this.barcodeFontSize(),
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000'
      });

      this.barcodePreviewUrl.set(canvas.toDataURL('image/png'));

    } catch (error) {
      console.error('Error generating barcode:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to generate barcode'
      });
    }
  }

  printBarcode(): void {
    const barcodeValue = this.getBarcodeValue();
    const product = this.product();
    
    if (!barcodeValue || !product) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No barcode available for this product'
      });
      return;
    }

    this.generateBarcode();

    setTimeout(() => {
      let canvas: HTMLCanvasElement | null = this.barcodePreview?.nativeElement || this.barcodeCanvas?.nativeElement;
      
      if (!canvas) {
        canvas = document.createElement('canvas');
        JsBarcode(canvas, barcodeValue, {
          format: this.barcodeFormat(),
          width: this.barcodeWidth(),
          height: this.barcodeHeight(),
          displayValue: true,
          fontSize: this.barcodeFontSize(),
          margin: 10,
          background: '#ffffff',
          lineColor: '#000000'
        });
      }
      
      this.printFromCanvas(canvas, product, barcodeValue);
    }, 100);
  }

  private printFromCanvas(canvas: HTMLCanvasElement, product: Product, barcodeValue: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Pop-up blocked. Please allow pop-ups for this site.'
      });
      return;
    }

    const barcodeDataUrl = canvas.toDataURL('image/png');

    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode - ${product.name}</title>
        <style>
          body {
            margin: 0;
            padding: 10px;
            font-family: Arial, sans-serif;
          }
          .barcode-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            padding: 10px;
            box-sizing: border-box;
            border: 1px dashed #ccc;
            margin-bottom: 10px;
          }
          .product-info {
            text-align: center;
            margin-bottom: 5px;
          }
          .product-name {
            font-size: 12px;
            font-weight: bold;
            margin: 2px 0;
          }
          .product-price {
            font-size: 11px;
            color: #333;
            margin: 2px 0;
          }
          .barcode-image {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .barcode-container {
              page-break-after: always;
              break-inside: avoid;
              border: none;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
    `;

    for (let i = 0; i < this.printCopies(); i++) {
      printContent += `
        <div class="barcode-container">
          ${this.showProductName() ? `
            <div class="product-info">
              <div class="product-name">${this.escapeHtml(product.name)}</div>
              ${this.showPrice() ? `<div class="product-price">MRP: PKR ${product.mrp}</div>` : ''}
            </div>
          ` : ''}
          <img src="${barcodeDataUrl}" class="barcode-image" alt="Barcode" />
          <div style="text-align: center; margin-top: 3px; font-size: 10px; font-family: monospace;">
            ${barcodeValue}
          </div>
        </div>
      `;
    }

    printContent += `
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);

    this.closeBarcodeModal();

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${this.printCopies()} barcode(s) sent to printer`
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  downloadBarcode(): void {
    const barcodeValue = this.getBarcodeValue();
    const product = this.product();
    
    if (!barcodeValue || !product) return;

    this.generateBarcode();

    setTimeout(() => {
      const canvas = this.barcodePreview?.nativeElement || this.barcodeCanvas?.nativeElement;
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `${product.name.replace(/\s+/g, '_')}_barcode.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Barcode downloaded successfully'
      });
    }, 100);
  }

  onBarcodeFormatChange(): void {
    this.generateBarcode();
  }

  onBarcodeSizeChange(): void {
    this.generateBarcode();
  }

  hasBarcode(): boolean {
    const product = this.product();
    return !!(product?.barcode);
  }

  // A4 Sheet Printing Method
  printA4BarcodeSheet(): void {
    const product = this.product();
    if (!product?.barcode) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'No barcode available for this product'
      });
      return;
    }

    const barcodeLabel: BarcodeLabel = {
      code: product.barcode,
      productName: product.name,
      price: product.mrp,
      sku: product.sku
    };

    const numberOfCopies = this.printCopies();
    
    this.barcodePrintService.printSingleProductBarcodes(
      barcodeLabel,
      numberOfCopies,
      {
        labelSize: this.labelSize(),
        columns: this.gridColumns(),
        showProductName: this.showProductName(),
        showPrice: this.showPrice(),
        showSku: true,
        copiesPerProduct: numberOfCopies
      }
    );

    this.closeBarcodeModal();
    
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `${numberOfCopies} barcode(s) sent to printer on A4 sheet`
    });
  }

  // Calculate max labels per page
  calculateMaxLabels(): number {
    const labelDim = {
      small: { width: 40, height: 25 },
      standard: { width: 50, height: 30 },
      large: { width: 62, height: 35 }
    }[this.labelSize()];
    
    const availableWidth = 210 - 20; // A4 width minus margins
    const availableHeight = 297 - 20; // A4 height minus margins
    const columns = Math.floor(availableWidth / (labelDim.width + 5));
    const rows = Math.floor(availableHeight / (labelDim.height + 5));
    
    return Math.max(1, columns * rows);
  }

  onLabelSizeChange(): void {
    const maxLabels = this.calculateMaxLabels();
    if (this.printCopies() > maxLabels) {
      this.printCopies.set(maxLabels);
    }
  }

  // Print multiple products (for bulk printing)
  printMultipleBarcodes(products: any[]): void {
    const barcodeLabels: BarcodeLabel[] = products.map(product => ({
      code: product.barcode,
      productName: product.name,
      price: product.mrp,
      sku: product.sku
    }));

    this.barcodePrintService.printBarcodeSheet(barcodeLabels, {
      labelSize: this.labelSize(),
      columns: this.gridColumns(),
      showProductName: true,
      showPrice: true,
      showSku: true,
      copiesPerProduct: 1
    });
  }
}