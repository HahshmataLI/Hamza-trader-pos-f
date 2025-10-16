import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl  } from '@angular/forms';
import { ProductService } from '../../../services/products/product-service';
import { CategoryService } from '../../../services/categories/category';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';
import { CategoryAttribute } from '../../../interfaces/category.interface';
import { CreateProductRequest, Product } from '../../../interfaces/product.interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
interface CategoryOption {
  label: string;
  value: string;
  level: number;
  attributes: CategoryAttribute[];
}
interface ExtendedCategoryAttribute extends CategoryAttribute {
  categoryName: string;
  inherited: boolean;
}
@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule,UtilsModule,CommonModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
  providers: [ConfirmationService, MessageService],
})
export class ProductForm  implements OnInit{
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
  error = signal('');
  isEditMode = signal(false);
  productId = signal<string | null>(null);
  categoryOptions = signal<CategoryOption[]>([]);
  allCategoryAttributes = signal<CategoryAttribute[]>([]);
  autoGenerateSku = signal(true);
  skuSuggestions = signal<string[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
    this.checkEditMode();
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
      images: [[]],
      isActive: [true],
      attributes: this.fb.group({})
    });

    // Auto-generate SKU when product name changes (only for new products)
    if (!this.isEditMode()) {
      this.productForm.get('name')?.valueChanges.subscribe(name => {
        if (this.autoGenerateSku() && name) {
          this.generateSkuSuggestions(name);
        }
      });

      this.productForm.get('category')?.valueChanges.subscribe(categoryId => {
        if (this.autoGenerateSku() && categoryId) {
          const name = this.productForm.get('name')?.value;
          if (name) {
            this.generateSkuSuggestions(name);
          }
        }
      });
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
    
    // Auto-select the first suggestion
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

  isFormValid(): boolean {
    console.log('=== Checking Form Validity ===');
    
    // First check the main form controls
    const mainControls = ['name', 'sku', 'category', 'costPrice', 'mrp', 'minSalePrice', 'stock', 'minStockLevel'];
    let mainFormValid = true;
    
    for (const controlName of mainControls) {
      const control = this.productForm.get(controlName);
      if (control?.invalid) {
        console.log(`Invalid main control ${controlName}:`, control.errors);
        mainFormValid = false;
      }
    }

    console.log('Main form valid:', mainFormValid);
    
    if (!mainFormValid) {
      return false;
    }

    // Check attributes separately
    const attributesGroup = this.productForm.get('attributes') as FormGroup;
    let attributesValid = true;
    
    if (attributesGroup && this.allCategoryAttributes().length > 0) {
      const requiredAttributes = this.allCategoryAttributes().filter(attr => attr.required);
      console.log('Required attributes:', requiredAttributes.map(a => a.name));
      
      for (const attribute of requiredAttributes) {
        const control = attributesGroup.get(attribute.name);
        const value = control?.value;
        
        // For boolean attributes, any value is valid (including false)
        if (attribute.type === 'boolean') {
          const isValid = control && value !== null && value !== undefined;
          console.log(`Boolean attribute ${attribute.name}:`, { value, isValid });
          
          if (!isValid) {
            console.log(`❌ Missing required boolean attribute: ${attribute.name}`);
            attributesValid = false;
            break;
          }
        } else {
          // For other attribute types, check for empty values
          const isValid = control && value !== null && value !== '' && value !== undefined;
          
          console.log(`Attribute ${attribute.name}:`, { 
            value: value, 
            valid: control?.valid, 
            errors: control?.errors,
            isValid: isValid 
          });
          
          if (!isValid) {
            console.log(`❌ Missing required attribute: ${attribute.name}`);
            attributesValid = false;
            break;
          }
        }
      }
    } else {
      console.log('No attributes to validate or attributes group not ready');
      attributesValid = true;
    }

    console.log('Attributes valid:', attributesValid);
    console.log('Final form valid:', mainFormValid && attributesValid);
    console.log('=== End Form Validity Check ===');
    
    return mainFormValid && attributesValid;
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.isEditMode.set(true);
        this.productId.set(id);
        this.loadProduct(id);
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
        this.error.set('Failed to load product');
        this.loading.set(false);
      }
    });
  }

  populateForm(product: Product): void {
    this.autoGenerateSku.set(false);

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
      images: product.images || [],
      isActive: product.isActive
    });

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
          attributes: category.attributes || [],
          parentId: typeof category.parent === 'string' ? category.parent : category.parent?._id
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
    console.log('Selected category:', categoryId);
    
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
      
      console.log('Creating attribute controls for:', selectedCategory.attributes);
      
      // Create dynamic form controls for attributes
      const attributeControls: { [key: string]: any } = {};
      selectedCategory.attributes.forEach(attr => {
        const existingValue = existingAttributes ? existingAttributes[attr.name] : null;
        const validators = attr.required ? [Validators.required] : [];
        
        // Set default values for different attribute types
        let defaultValue: any = null;
        
        if (existingValue !== null && existingValue !== undefined) {
          defaultValue = existingValue;
        } else {
          // Set sensible defaults for required fields
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
        
        console.log(`Attribute control: ${attr.name}`, { 
          existingValue: existingValue,
          defaultValue: defaultValue,
          validators: validators 
        });
      });
      
      const attributesGroup = this.fb.group(attributeControls);
      console.log('Created attributes group:', attributesGroup);
      
      // Update the form
      this.productForm.setControl('attributes', attributesGroup);
      
      // Trigger change detection after a brief delay
      setTimeout(() => {
        this.cdr.detectChanges();
      });
    }
  }

  getAttributeOptions(attribute: CategoryAttribute): { label: string; value: any }[] {
    return attribute.options?.map(option => ({ label: option, value: option })) || [];
  }

  onImageSelect(event: any): void {
    const files = event.files;
    if (files && files.length > 0) {
      const currentImages = this.productForm.get('images')?.value || [];
      const newImages = [...currentImages];
      
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          newImages.push(e.target.result);
          this.productForm.patchValue({ images: newImages });
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    const images = this.productForm.get('images')?.value || [];
    images.splice(index, 1);
    this.productForm.patchValue({ images });
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
        // For boolean, any value (including false) counts as filled
        if (control && value !== null && value !== undefined) {
          count++;
        }
      } else {
        // For other types, check for non-empty values
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
    
    if (this.isFormValid()) {
      this.loading.set(true);
      this.error.set('');

      const formValue = this.productForm.value;
      const productData: CreateProductRequest = {
        name: formValue.name,
        sku: formValue.sku,
        barcode: formValue.barcode,
        category: formValue.category,
        costPrice: formValue.costPrice,
        mrp: formValue.mrp,
        minSalePrice: formValue.minSalePrice,
        stock: formValue.stock,
        minStockLevel: formValue.minStockLevel,
        description: formValue.description,
        images: formValue.images,
        attributes: formValue.attributes
      };

      const request = this.isEditMode() 
        ? this.productService.updateProduct(this.productId()!, productData)
        : this.productService.createProduct(productData);

      request.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Product ${this.isEditMode() ? 'updated' : 'created'} successfully`
          });
          this.router.navigate(['/products']);
        },
        error: (error) => {
          this.error.set(error.error?.error || 'An error occurred');
          this.loading.set(false);
        }
      });
    } else {
      this.error.set('Please fix all form errors before submitting');
    }
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete product'
          });
        }
      });
    }
  }
}