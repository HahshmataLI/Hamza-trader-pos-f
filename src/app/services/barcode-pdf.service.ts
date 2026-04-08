// services/barcode-print.service.ts
import { Injectable } from '@angular/core';

export interface BarcodeLabel {
  code: string;
  productName: string;
  price?: number;
  sku?: string;
}

export interface PrintOptions {
  labelSize?: 'small' | 'standard' | 'large';
  columns?: number;
  showProductName?: boolean;
  showPrice?: boolean;
  showSku?: boolean;
  copiesPerProduct?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BarcodePrintService {
  
  private readonly LABEL_SIZES = {
    small: { width: 40, height: 25 },
    standard: { width: 50, height: 30 },
    large: { width: 62, height: 35 }
  };

  private readonly A4_WIDTH = 210;
  private readonly A4_HEIGHT = 297;
  private readonly PAGE_MARGIN = 10;

  constructor() {}

  printBarcodeSheet(products: BarcodeLabel[], options: PrintOptions = {}): void {
    const {
      labelSize = 'standard',
      columns = 3,
      showProductName = true,
      showPrice = true,
      showSku = false,
      copiesPerProduct = 1
    } = options;

    // Expand products based on copies
    const expandedProducts: BarcodeLabel[] = [];
    products.forEach(product => {
      for (let i = 0; i < copiesPerProduct; i++) {
        expandedProducts.push({ ...product });
      }
    });

    const labelDim = this.LABEL_SIZES[labelSize];
    const gridConfig = this.calculateGridLayout(labelDim, columns);
    const printHtml = this.generatePrintHtml(
      expandedProducts,
      gridConfig,
      { showProductName, showPrice, showSku, labelSize }
    );

    this.openPrintWindow(printHtml);
  }

  printSingleProductBarcodes(product: BarcodeLabel, copies: number = 10, options?: PrintOptions): void {
    this.printBarcodeSheet([product], {
      ...options,
      copiesPerProduct: copies
    });
  }

  private calculateGridLayout(labelDim: { width: number; height: number }, preferredColumns: number): any {
    const availableWidth = this.A4_WIDTH - (this.PAGE_MARGIN * 2);
    const availableHeight = this.A4_HEIGHT - (this.PAGE_MARGIN * 2);
    
    let columns = Math.floor(availableWidth / (labelDim.width + 5));
    columns = Math.min(columns, preferredColumns);
    columns = Math.max(columns, 2);
    
    const rows = Math.floor(availableHeight / (labelDim.height + 5));
    const horizontalGap = columns > 1 ? (availableWidth - (columns * labelDim.width)) / (columns - 1) : 0;
    const verticalGap = rows > 1 ? (availableHeight - (rows * labelDim.height)) / (rows - 1) : 0;
    
    return {
      columns,
      rows,
      horizontalGap,
      verticalGap,
      labelWidth: labelDim.width,
      labelHeight: labelDim.height,
      margin: this.PAGE_MARGIN
    };
  }

  private generatePrintHtml(products: BarcodeLabel[], gridConfig: any, displayOptions: any): string {
    const { columns, rows, labelWidth, labelHeight, horizontalGap, verticalGap, margin } = gridConfig;
    const labelsPerPage = columns * rows;
    const totalPages = Math.ceil(products.length / labelsPerPage);
    
    let allPagesHtml = '';
    
    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * labelsPerPage;
     let pageProducts = products.slice(startIndex, startIndex + labelsPerPage);

// 🔥 Auto-fill remaining labels
if (pageProducts.length < labelsPerPage && pageProducts.length > 0) {
  const fillProduct = pageProducts[0]; // repeat same product

  while (pageProducts.length < labelsPerPage) {
    pageProducts.push({ ...fillProduct });
  }
}
      
      allPagesHtml += this.generatePageHtml(
        pageProducts, columns, rows, labelWidth, labelHeight,
        horizontalGap, verticalGap, margin, displayOptions,
        page + 1, totalPages
      );
    }
    
    return this.getFullHtmlTemplate(allPagesHtml, labelWidth, labelHeight, displayOptions.labelSize);
  }

  private generatePageHtml(
    products: BarcodeLabel[], columns: number, rows: number,
    labelWidth: number, labelHeight: number, horizontalGap: number,
    verticalGap: number, margin: number, displayOptions: any,
    pageNumber: number, totalPages: number
  ): string {
    let html = `<div class="page" style="padding: ${margin}mm;">`;
    
    for (let row = 0; row < rows; row++) {
      const marginBottom = row === rows - 1 ? 0 : verticalGap;
      html += `<div class="label-row" style="margin-bottom: ${marginBottom}mm;">`;
      
      for (let col = 0; col < columns; col++) {
        const index = (row * columns) + col;
        const product = products[index];
        const marginRight = col === columns - 1 ? 0 : horizontalGap;
        
        if (product) {
          const canvasId = `barcode-${pageNumber}-${row}-${col}`;
          const nameFontSize = labelHeight >= 30 ? '10pt' : '8pt';
          const priceFontSize = labelHeight >= 30 ? '9pt' : '7pt';
          const barcodeNumberFontSize = labelHeight >= 30 ? '8pt' : '6pt';
                // ${displayOptions.showSku && product.sku ? `<div class="product-sku">SKU: ${product.sku}</div>` : ''}
          
          html += `
            <div class="label" style="width: ${labelWidth}mm; height: ${labelHeight}mm; margin-right: ${marginRight}mm;">
              <div class="label-content">
                ${displayOptions.showProductName ? `<div class="product-name" style="font-size: ${nameFontSize};">${this.escapeHtml(product.productName)}</div>` : ''}
                <div class="barcode-wrapper">
                 <canvas 
                    id="${canvasId}" 
                    class="barcode-canvas"
                    width="300"
                    height="80"
                    data-barcode="${this.escapeHtml(product.code)}"
                  ></canvas>
                </div>
                <div class="barcode-number" style="font-size: ${barcodeNumberFontSize};">${product.code}</div>
                ${displayOptions.showPrice && product.price ? `<div class="product-price" style="font-size: ${priceFontSize};">PKR ${product.price.toFixed(2)}</div>` : ''}
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="label empty" style="width: ${labelWidth}mm; height: ${labelHeight}mm; margin-right: ${marginRight}mm;">
              <div class="label-content"></div>
            </div>
          `;
        }
      }
      html += `</div>`;
    }
    
    if (totalPages > 1) {
      html += `<div class="page-number">Page ${pageNumber} of ${totalPages}</div>`;
    }
    html += `</div>`;
    
    return html;
  }

  private getFullHtmlTemplate(content: string, labelWidth: number, labelHeight: number, labelSize: string): string {
    // Calculate optimal barcode dimensions based on label size
    const barcodeConfig = this.getBarcodeConfig(labelHeight);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Barcode Labels</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            background: white;
            margin: 0;
            padding: 0;
          }
          
          .page {
            page-break-after: always;
            break-after: page;
            position: relative;
            min-height: 297mm;
            background: white;
          }
          
          .page:last-child {
            page-break-after: auto;
          }
          
          .label-row {
            display: flex;
            justify-content: flex-start;
            margin: 0;
            padding: 0;
          }
          
          .label {
            background: white;
            border: 0.5px dashed #ccc;
            border-radius: 2mm;
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .label.empty {
            border: 0.5px dashed #eee;
            background: #fafafa;
          }
          
          .label-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            height: 100%;
            padding: 2mm;
            box-sizing: border-box;
          }
          
          .product-name {
            font-weight: bold;
            color: #000;
            margin-bottom: 1mm;
            line-height: 1.2;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            word-break: break-word;
            width: 100%;
          }
          
          .product-sku {
            font-size: 6pt;
            color: #666;
            margin-bottom: 1mm;
          }
          
          .barcode-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 1mm 0;
            width: 100%;
            min-height: ${barcodeConfig.height}px;
          }
          
          .barcode-canvas {
            max-width: 100%;
            height: auto;
            display: block;
          }
          
          .barcode-number {
            font-family: 'Courier New', monospace;
            color: #333;
            margin: 1mm 0;
            letter-spacing: 0.5px;
            word-break: break-all;
          }
          
          .product-price {
            font-weight: bold;
            color: #2e7d32;
            margin-top: 1mm;
          }
          
          .page-number {
            position: absolute;
            bottom: 5mm;
            right: 5mm;
            font-size: 8pt;
            color: #999;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .page {
              page-break-after: always;
              break-after: page;
              margin: 0;
              padding: 0;
              box-shadow: none;
            }
            
            .label {
              border: 0.5px solid #ddd;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .label.empty {
              border: 0.5px solid #f0f0f0;
            }
            
            @page {
              size: A4;
              margin: 0;
            }
          }
          
          @media screen {
            body {
              background: #e0e0e0;
              padding: 20px;
            }
            
            .page {
              margin: 0 auto 20px auto;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              background: white;
            }
          }
        </style>
      </head>
      <body>
        ${content}
        
        <!-- Load JsBarcode first -->
     <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

<script>
  function waitForJsBarcode(callback) {
    if (typeof JsBarcode !== "undefined") {
      callback();
    } else {
      setTimeout(() => waitForJsBarcode(callback), 50);
    }
  }

  function renderAllBarcodes() {
    const canvases = document.querySelectorAll('.barcode-canvas');

    canvases.forEach((canvas, index) => {
      const value = canvas.getAttribute('data-barcode');

      if (!value) return;

      try {
        JsBarcode(canvas, value, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: false,
          margin: 0
        });
      } catch (e) {
        console.error('Barcode error:', e);
      }
    });
  }

  window.onload = function () {
    waitForJsBarcode(() => {
      renderAllBarcodes();

      setTimeout(() => {
        window.print();
      }, 500);
    });
  };
</script>
      </body>
      </html>
    `;
  }

  private getBarcodeConfig(labelHeight: number): { width: number; height: number } {
    if (labelHeight >= 35) {
      return { width: 2.5, height: 50 };
    } else if (labelHeight >= 30) {
      return { width: 2, height: 40 };
    } else {
      return { width: 1.5, height: 30 };
    }
  }

  private openPrintWindow(htmlContent: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600,toolbar=yes,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print barcodes');
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}