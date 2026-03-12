import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/products/product-service';
import { CategoryService } from '../../../services/categories/category';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';
import { CategoryAttribute } from '../../../interfaces/category.interface';
import { Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

interface CategoryOption {
  label: string;
  value: string;
  level: number;
  attributes: CategoryAttribute[];
}

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, UtilsModule, CommonModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
  providers: [ConfirmationService, MessageService],
})
export class ProductForm implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  productForm!: FormGroup;
  loading = signal(false);
  submitting = signal(false);
  error = signal('');
  isEditMode = signal(false);
  productId = signal<string | null>(null);
  categoryOptions = signal<CategoryOption[]>([]);
  allCategoryAttributes = signal<CategoryAttribute[]>([]);
  autoGenerateSku = signal(true);
  autoGenerateBarcode = signal(true);
  skuSuggestions = signal<string[]>([]);

  // SIMPLIFIED IMAGE STATE
  existingImages = signal<string[]>([]); // URLs from server
  newImageFiles = signal<File[]>([]); // Files to upload
  newImagePreviews = signal<string[]>([]); // Previews for new files
  isUploading = signal(false);

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.checkEditMode();
    this.setupBarcodeGeneration();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clean up object URLs
    this.newImagePreviews().forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  initializeForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      sku: ['', [Validators.required, Validators.minLength(2)]],
      barcode: [''],
      category: ['', [Validators.required]],
      costPrice: [0.01, [Validators.required, Validators.min(0.01)]],
      mrp: [0.01, [Validators.required, Validators.min(0.01)]],
      minSalePrice: [0.01, [Validators.required, Validators.min(0.01)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [5, [Validators.required, Validators.min(0)]],
      description: [''],
      isActive: [true],
      attributes: this.fb.group({})
    });

    // Auto-generate SKU when product name changes (only for new products)
    if (!this.isEditMode()) {
      this.productForm.get('name')?.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(name => {
          if (this.autoGenerateSku() && name) {
            this.generateSkuSuggestions(name);
          }
        });

      this.productForm.get('category')?.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(categoryId => {
          if (this.autoGenerateSku() && categoryId) {
            const name = this.productForm.get('name')?.value;
            if (name) {
              this.generateSkuSuggestions(name);
            }
          }
        });
    }
  }

  // Barcode Generation Methods
  private setupBarcodeGeneration(): void {
    if (!this.isEditMode() && this.autoGenerateBarcode()) {
      this.generateBarcode();
    }
  }

  generateBarcode(): void {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode = `PROD${timestamp}${random}`;
    this.productForm.patchValue({ barcode });
  }

  toggleBarcodeGeneration(): void {
    this.autoGenerateBarcode.set(!this.autoGenerateBarcode());
    
    if (this.autoGenerateBarcode() && !this.isEditMode()) {
      this.generateBarcode();
    } else if (!this.isEditMode()) {
      this.productForm.patchValue({ barcode: '' });
    }
  }

  // SKU Generation Methods
  generateSkuSuggestions(productName: string): void {
    const category = this.categoryOptions().find(cat => cat.value === this.productForm.get('category')?.value);
    const categoryPrefix = category ? this.getCategoryPrefix(category.label) : 'PROD';
    
    const baseSku = this.generateBaseSku(productName, categoryPrefix);
    
    const suggestions = [
      baseSku,
      `${baseSku}-${this.generateRandomSuffix()}`,
      `${baseSku}-${Date.now().toString().slice(-4)}`
    ];
    
    this.skuSuggestions.set(suggestions);
    
    if (suggestions.length > 0) {
      this.productForm.patchValue({ sku: suggestions[0] });
    }
  }

  generateBaseSku(productName: string, categoryPrefix: string): string {
    const cleanName = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
    
    return `${categoryPrefix}-${cleanName}`;
  }

  getCategoryPrefix(categoryLabel: string): string {
    const cleanLabel = categoryLabel.replace(/[^a-zA-Z0-9\s]/g, '');
    const words = cleanLabel.split(' ');
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    
    return words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
  }

  generateRandomSuffix(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  onSkuSuggestionSelect(sku: string): void {
    this.productForm.patchValue({ sku });
  }

  toggleSkuGeneration(): void {
    this.autoGenerateSku.set(!this.autoGenerateSku());
    
    if (this.autoGenerateSku() && !this.isEditMode()) {
      const name = this.productForm.get('name')?.value;
      if (name) {
        this.generateSkuSuggestions(name);
      }
    } else {
      this.skuSuggestions.set([]);
      if (!this.isEditMode()) {
        this.productForm.patchValue({ sku: '' });
      }
    }
  }

  // FIXED IMAGE UPLOAD
  onImageSelect(event: any): void {
    const files = event.files as File[];
    
    if (files && files.length > 0) {
      // Show uploading indicator
      this.isUploading.set(true);
      
      // Validate files
      const validFiles: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: `${file.name} is not an image`
          });
          continue;
        }
        
        if (file.size > 10 * 1024 * 1024) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: `${file.name} is too large (max 10MB)`
          });
          continue;
        }
        
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        this.isUploading.set(false);
        return;
      }

      // Process each file
      let processedCount = 0;
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (e: ProgressEvent<FileReader>) => {
          // Add file and preview
          this.newImageFiles.update(files => [...files, file]);
          this.newImagePreviews.update(previews => [...previews, e.target?.result as string]);
          
          processedCount++;
          
          // When all files are processed, hide uploading indicator
          if (processedCount === validFiles.length) {
            this.isUploading.set(false);
            
            // Force change detection
            this.cdr.detectChanges();
            
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `${validFiles.length} image(s) added`
            });
          }
        };
        
        reader.onerror = () => {
          processedCount++;
          if (processedCount === validFiles.length) {
            this.isUploading.set(false);
          }
        };
        
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(type: 'existing' | 'new', index: number): void {
    if (type === 'existing') {
      // Remove from existing images
      this.existingImages.update(images => images.filter((_, i) => i !== index));
    } else {
      // Remove from new images
      this.newImageFiles.update(files => files.filter((_, i) => i !== index));
      this.newImagePreviews.update(previews => previews.filter((_, i) => i !== index));
    }
  }

  getAllImages(): { url: string; type: 'existing' | 'new' }[] {
    const existing = this.existingImages().map(url => ({ url, type: 'existing' as const }));
    const newImages = this.newImagePreviews().map(url => ({ url, type: 'new' as const }));
    return [...existing, ...newImages];
  }

  // Form Validation
  isFormValid(): boolean {
    // Check main controls
    const mainControls = ['name', 'sku', 'category', 'costPrice', 'mrp', 'minSalePrice', 'stock', 'minStockLevel'];
    let mainFormValid = true;
    
    for (const controlName of mainControls) {
      const control = this.productForm.get(controlName);
      if (control?.invalid) {
        mainFormValid = false;
        break;
      }
    }

    if (!mainFormValid) {
      return false;
    }

    // Check required attributes
    const attributesGroup = this.productForm.get('attributes') as FormGroup;
    let attributesValid = true;
    
    if (attributesGroup && this.allCategoryAttributes().length > 0) {
      const requiredAttributes = this.allCategoryAttributes().filter(attr => attr.required);
      
      for (const attribute of requiredAttributes) {
        const control = attributesGroup.get(attribute.name);
        const value = control?.value;
        
        if (attribute.type === 'boolean') {
          if (value === null || value === undefined) {
            attributesValid = false;
            break;
          }
        } else {
          if (!value || value === '' || value === null || value === undefined) {
            attributesValid = false;
            break;
          }
        }
      }
    }
    
    return attributesValid;
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.isEditMode.set(true);
        this.productId.set(id);
        this.autoGenerateSku.set(false);
        this.autoGenerateBarcode.set(false);
        this.loadProduct(id);
      } else {
        // Generate barcode for new product
        this.generateBarcode();
      }
    });
  }

  loadProduct(id: string): void {
    this.loading.set(true);
    this.productService.getProduct(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.populateForm(response.data);
        } else {
          this.error.set('Product not found');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error.set('Failed to load product');
        this.loading.set(false);
      }
    });
  }

  populateForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: typeof product.category === 'string' ? product.category : product.category._id,
      costPrice: product.costPrice,
      mrp: product.mrp,
      minSalePrice: product.minSalePrice,
      stock: product.stock,
      minStockLevel: product.minStockLevel,
      description: product.description || '',
      isActive: product.isActive
    });

    // Set existing images
    if (product.images && product.images.length > 0) {
      this.existingImages.set(product.images);
    }

    const categoryId = typeof product.category === 'string' ? product.category : product.category._id;
    this.loadCategoryAttributes(categoryId, product.attributes);
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        const categories = response.data || [];
        const options: CategoryOption[] = categories.map(category => ({
          label: `${'— '.repeat(category.level - 1)}${category.name} (Level ${category.level})`,
          value: category._id,
          level: category.level,
          attributes: category.attributes || []
        }));
        this.categoryOptions.set(options);
      },
      error: (error) => {
        console.error('Failed to load categories', error);
      }
    });
  }

  onCategoryChange(): void {
    const categoryId = this.productForm.get('category')?.value;
    
    if (categoryId) {
      this.loadCategoryAttributes(categoryId);
    } else {
      this.allCategoryAttributes.set([]);
      this.productForm.setControl('attributes', this.fb.group({}));
    }
  }

  loadCategoryAttributes(categoryId: string, existingAttributes?: any): void {
    const selectedCategory = this.categoryOptions().find(cat => cat.value === categoryId);
    if (selectedCategory) {
      this.allCategoryAttributes.set(selectedCategory.attributes);
      
      // Create dynamic form controls for attributes
      const attributeControls: { [key: string]: any } = {};
      selectedCategory.attributes.forEach(attr => {
        const existingValue = existingAttributes ? existingAttributes[attr.name] : null;
        const validators = attr.required ? [Validators.required] : [];
        
        let defaultValue: any = null;
        
        if (existingValue !== null && existingValue !== undefined) {
          defaultValue = existingValue;
        } else {
          if (attr.required) {
            switch (attr.type) {
              case 'text':
                defaultValue = '';
                break;
              case 'number':
                defaultValue = 0;
                break;
              case 'boolean':
                defaultValue = false;
                break;
              case 'select':
                if (attr.options && attr.options.length > 0) {
                  defaultValue = attr.options[0];
                } else {
                  defaultValue = '';
                }
                break;
              default:
                defaultValue = '';
            }
          } else {
            defaultValue = null;
          }
        }
        
        attributeControls[attr.name] = [defaultValue, validators];
      });
      
      const attributesGroup = this.fb.group(attributeControls);
      this.productForm.setControl('attributes', attributesGroup);
      
      setTimeout(() => {
        this.cdr.detectChanges();
      });
    }
  }

  getAttributeOptions(attribute: CategoryAttribute): { label: string; value: any }[] {
    return attribute.options?.map(option => ({ label: option, value: option })) || [];
  }

  getProfitMargin(): number {
    const costPrice = this.productForm.get('costPrice')?.value || 0;
    const mrp = this.productForm.get('mrp')?.value || 0;
    if (costPrice === 0) return 0;
    return Math.round(((mrp - costPrice) / costPrice) * 100);
  }

  getStockStatus(): string {
    const stock = this.productForm.get('stock')?.value || 0;
    const minStock = this.productForm.get('minStockLevel')?.value || 0;
    
    if (stock === 0) return 'Out of Stock';
    if (stock <= minStock) return 'Low Stock';
    return 'In Stock';
  }

  getStockStatusClass(): string {
    const status = this.getStockStatus();
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-orange-100 text-orange-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRequiredAttributesCount(): number {
    const attributesGroup = this.productForm.get('attributes') as FormGroup;
    if (!attributesGroup) return 0;
    
    const requiredAttributes = this.allCategoryAttributes().filter(attr => attr.required);
    let count = 0;
    
    for (const attribute of requiredAttributes) {
      const control = attributesGroup.get(attribute.name);
      const value = control?.value;
      
      if (attribute.type === 'boolean') {
        if (control && value !== null && value !== undefined) {
          count++;
        }
      } else {
        if (control && value !== null && value !== '' && value !== undefined) {
          count++;
        }
      }
    }
    
    return count;
  }

  getRequiredAttributesTotal(): number {
    return this.allCategoryAttributes().filter(attr => attr.required).length;
  }

  onSubmit(): void {
    this.productForm.markAllAsTouched();
    
    if (!this.isFormValid()) {
      this.error.set('Please fix all form errors before submitting');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const formValue = this.productForm.value;
    
    // Create FormData for file upload
    const formData = new FormData();
    
    // Append form fields
    formData.append('name', formValue.name);
    formData.append('sku', formValue.sku);
    if (formValue.barcode) {
      formData.append('barcode', formValue.barcode);
    }
    formData.append('category', formValue.category);
    formData.append('costPrice', formValue.costPrice.toString());
    formData.append('mrp', formValue.mrp.toString());
    formData.append('minSalePrice', formValue.minSalePrice.toString());
    formData.append('stock', formValue.stock.toString());
    formData.append('minStockLevel', formValue.minStockLevel.toString());
    
    if (formValue.description) {
      formData.append('description', formValue.description);
    }
    
    formData.append('isActive', formValue.isActive.toString());
    
    // Append attributes as JSON string
    if (formValue.attributes) {
      formData.append('attributes', JSON.stringify(formValue.attributes));
    }
    
    // Append new image files
    this.newImageFiles().forEach(file => {
      formData.append('images', file);
    });

    // Append existing image paths (for edit mode)
    if (this.isEditMode() && this.existingImages().length > 0) {
      formData.append('existingImages', JSON.stringify(this.existingImages()));
    }

    const request = this.isEditMode() 
      ? this.productService.updateProduct(this.productId()!, formData)
      : this.productService.createProduct(formData);

    request.subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Product ${this.isEditMode() ? 'updated' : 'created'} successfully`
        });
        
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1500);
      },
      error: (error) => {
        console.error('Submission error:', error);
        this.error.set(error.error?.error || 'An error occurred while saving the product');
        this.submitting.set(false);
      }
    });
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this product? This will make the product inactive.',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteProduct()
    });
  }

  deleteProduct(): void {
    if (this.productId()) {
      this.productService.deleteProduct(this.productId()!).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product deleted successfully'
          });
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.error || 'Failed to delete product'
          });
        }
      });
    }
  }

  hasError(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) {
      return `${controlName} is required`;
    }
    if (control.errors['min']) {
      return `${controlName} must be at least ${control.errors['min'].min}`;
    }
    if (control.errors['minlength']) {
      return `${controlName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    
    return 'Invalid value';
  }
}