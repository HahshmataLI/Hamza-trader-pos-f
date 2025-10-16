import { Component, inject, OnInit, signal } from '@angular/core';
import { UtilsModule } from '../../../utils.module';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/categories/category';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';
import { Category, CategoryAttribute, CreateCategoryRequest } from '../../../interfaces/category.interface';
import { CommonModule } from '@angular/common';
// import { Chips } from 'primeng/chips';
import { ChipModule } from 'primeng/chip';
interface CategoryOption {
  label: string;
  value: string;
  level: number;
}

interface AttributeTypeOption {
  label: string;
  value: 'text' | 'number' | 'select' | 'boolean';
}
@Component({
  selector: 'app-category-form',
  imports: [
  UtilsModule,
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  RouterLink,
  ChipModule
],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css',
  providers: [ConfirmationService, MessageService],
})
export class CategoryForm implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  authService = inject(AuthService);

  categoryForm!: FormGroup;
  loading = signal(false);
  error = signal('');
  isEditMode = signal(false);
  categoryId = signal<string | null>(null);
  parentOptions = signal<CategoryOption[]>([]);

  attributeTypes: AttributeTypeOption[] = [
    { label: 'Text Input', value: 'text' },
    { label: 'Number Input', value: 'number' },
    { label: 'Dropdown Select', value: 'select' },
    { label: 'Yes/No Toggle', value: 'boolean' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadParentCategories();
    this.checkEditMode();
  }

  initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      parent: [null],
      level: [1],
      isActive: [true],
      attributes: this.fb.array([])
    });

    // Add one default attribute
    this.addAttribute();
    
    // Debug form changes
    this.categoryForm.valueChanges.subscribe(value => {
      console.log('Form Value:', value);
      console.log('Form Valid:', this.categoryForm.valid);
      console.log('Form Errors:', this.categoryForm.errors);
    });
  }

  get attributes(): FormArray {
    return this.categoryForm.get('attributes') as FormArray;
  }

  checkEditMode(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.isEditMode.set(true);
        this.categoryId.set(id);
        this.loadCategory(id);
      }
    });
  }

  loadCategory(id: string): void {
    this.loading.set(true);
    this.categoryService.getCategory(id).subscribe({
      next: (response) => {
        if (response.data) {
          this.populateForm(response.data);
        } else {
          this.error.set('Category not found');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load category');
        this.loading.set(false);
      }
    });
  }

  populateForm(category: Category): void {
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      parent: typeof category.parent === 'string' ? category.parent : category.parent?._id || null,
      level: category.level,
      isActive: category.isActive !== undefined ? category.isActive : true
    });

    // Clear existing attributes and populate new ones
    this.attributes.clear();
    if (category.attributes && category.attributes.length > 0) {
      category.attributes.forEach(attr => {
        this.addAttribute(attr);
      });
    } else {
      this.addAttribute(); // Add one default if none exist
    }

    // Mark form as touched to show validation
    this.categoryForm.markAllAsTouched();
    
    // Update level info after populating
    this.updateLevel();
  }

  loadParentCategories(): void {
    // For testing, create some dummy parent options
    const dummyOptions: CategoryOption[] = [
      { label: '📁 Electronics (Level 1)', value: 'cat1', level: 1 },
      { label: '📁 Clothing (Level 1)', value: 'cat2', level: 1 },
      { label: '📂 — Smartphones (Level 2)', value: 'cat3', level: 2 },
      { label: '📂 — Laptops (Level 2)', value: 'cat4', level: 2 }
    ];
    
    this.parentOptions.set(dummyOptions);

    // Uncomment when your service is ready:
    
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        const options: CategoryOption[] = [];
        
        response.data?.forEach(category => {
          // Don't include the current category in edit mode
          if (this.isEditMode() && category._id === this.categoryId()) {
            return;
          }

          const indent = '— '.repeat(category.level - 1);
          options.push({
            label: `${indent}${category.name} (Level ${category.level})`,
            value: category._id,
            level: category.level
          });
        });

        this.parentOptions.set(options);
      },
      error: (error) => {
        console.error('Failed to load parent categories', error);
      }
    });
   
  }

  addAttribute(attribute?: CategoryAttribute): void {
    const attributeGroup = this.fb.group({
      name: [attribute?.name || '', [Validators.required]],
      label: [attribute?.label || '', [Validators.required]],
      type: [attribute?.type || 'text', [Validators.required]],
      required: [attribute?.required || false],
      options: [attribute?.options || []],
      min: [attribute?.validation?.min || null],
      max: [attribute?.validation?.max || null],
      pattern: [attribute?.validation?.pattern || '']
    });

    // Add validation for select options
    const type = attribute?.type || 'text';
    if (type === 'select') {
      attributeGroup.get('options')?.setValidators([Validators.required, Validators.minLength(1)]);
    }

    this.attributes.push(attributeGroup);
    
    // Mark the form as touched to trigger validation
    this.categoryForm.markAsTouched();
  }

  removeAttribute(index: number): void {
    if (this.attributes.length > 1) {
      this.attributes.removeAt(index);
      this.categoryForm.markAsDirty();
    }
  }

  getAttributeType(index: number): string {
    return this.attributes.at(index).get('type')?.value || 'text';
  }

  onAttributeTypeChange(index: number): void {
    const attributeControl = this.attributes.at(index);
    const type = attributeControl.get('type')?.value;
    
    if (type === 'select') {
      attributeControl.get('options')?.setValidators([Validators.required, Validators.minLength(1)]);
    } else {
      attributeControl.get('options')?.clearValidators();
      attributeControl.get('options')?.setValue([]);
    }
    attributeControl.get('options')?.updateValueAndValidity();
    this.categoryForm.markAsDirty();
  }

  onStatusChange(event: any): void {
    console.log('Status changed:', event.checked);
    this.categoryForm.markAsDirty();
  }

  onRequiredChange(index: number, event: any): void {
    console.log('Required changed for attribute', index, event.checked);
    this.categoryForm.markAsDirty();
  }

  // New methods for chip-based options management
  addOption(attributeIndex: number, inputElement: HTMLInputElement): void {
    const value = inputElement.value.trim();
    if (value) {
      const attributeControl = this.attributes.at(attributeIndex);
      const currentOptions = attributeControl.get('options')?.value || [];
      
      if (!currentOptions.includes(value)) {
        attributeControl.get('options')?.setValue([...currentOptions, value]);
        attributeControl.get('options')?.markAsTouched();
      }
      
      inputElement.value = '';
      this.categoryForm.markAsDirty();
    }
  }

  removeOption(attributeIndex: number, optionIndex: number): void {
    const attributeControl = this.attributes.at(attributeIndex);
    const currentOptions = attributeControl.get('options')?.value || [];
    const newOptions = currentOptions.filter((_: any, index: number) => index !== optionIndex);
    attributeControl.get('options')?.setValue(newOptions);
    attributeControl.get('options')?.markAsTouched();
    this.categoryForm.markAsDirty();
  }

  onParentChange(): void {
    this.updateLevel();
    this.categoryForm.markAsDirty();
  }

  updateLevel(): void {
    const parentId = this.categoryForm.get('parent')?.value;
    let newLevel = 1;

    if (parentId) {
      const selectedParent = this.parentOptions().find(opt => opt.value === parentId);
      newLevel = (selectedParent?.level || 1) + 1;
      
      // Validate max level
      if (newLevel > 3) {
        this.error.set('Maximum category depth exceeded (max 3 levels)');
        this.categoryForm.get('parent')?.setValue(null);
        newLevel = 1;
      } else {
        this.error.set('');
      }
    }

    this.categoryForm.get('level')?.setValue(newLevel);
  }

  getLevelInfo(): { level: number; label: string; description: string } {
    const level = this.categoryForm.get('level')?.value || 1;

    switch (level) {
      case 1:
        return {
          level: 1,
          label: 'Main Category',
          description: 'Top-level organization'
        };
      case 2:
        return {
          level: 2,
          label: 'Sub Category',
          description: 'Nested under main category'
        };
      case 3:
        return {
          level: 3,
          label: 'Sub-Sub Category',
          description: 'Deepest level of organization'
        };
      default:
        return {
          level: 1,
          label: 'Main Category',
          description: 'Top-level organization'
        };
    }
  }

  getRequiredAttributesCount(): number {
    return this.attributes.controls.filter(attr => attr.get('required')?.value).length;
  }

  onSubmit(): void {
    console.log('Form submitted');
    console.log('Form valid:', this.categoryForm.valid);
    console.log('Form value:', this.categoryForm.value);
    
    this.categoryForm.markAllAsTouched();
    
    if (this.categoryForm.valid) {
      this.loading.set(true);
      this.error.set('');

      const formValue = this.categoryForm.value;
      
      // Prepare attributes data according to backend schema
      const attributes: CategoryAttribute[] = formValue.attributes.map((attr: any) => {
        const attributeData: CategoryAttribute = {
          name: attr.name,
          label: attr.label,
          type: attr.type,
          required: attr.required || false
        };

        // Add options only for select type
        if (attr.type === 'select' && attr.options && attr.options.length > 0) {
          attributeData.options = attr.options;
        }

        // Add validation rules if any are provided
        const validation: any = {};
        if (attr.min !== null && attr.min !== '' && !isNaN(attr.min)) validation.min = Number(attr.min);
        if (attr.max !== null && attr.max !== '' && !isNaN(attr.max)) validation.max = Number(attr.max);
        if (attr.pattern && attr.pattern.trim() !== '') validation.pattern = attr.pattern;

        if (Object.keys(validation).length > 0) {
          attributeData.validation = validation;
        }

        return attributeData;
      });

      const categoryData: CreateCategoryRequest = {
        name: formValue.name,
        description: formValue.description,
        level: formValue.level,
        attributes: attributes,
        isActive: formValue.isActive
      };

      // Add parent only if selected
      if (formValue.parent) {
        categoryData.parent = formValue.parent;
      }

      console.log('Final category data:', categoryData);

      // For testing - just show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `Category ${this.isEditMode() ? 'updated' : 'created'} successfully`
      });
      this.loading.set(false);
      
      // Uncomment when your service is ready:
      
      const request = this.isEditMode() 
        ? this.categoryService.updateCategory(this.categoryId()!, categoryData)
        : this.categoryService.createCategory(categoryData);

      request.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Category ${this.isEditMode() ? 'updated' : 'created'} successfully`
          });
          this.router.navigate(['/categories']);
        },
        error: (error) => {
          this.error.set(error.message || 'An error occurred');
          this.loading.set(false);
        }
      });
      
    } else {
      this.error.set('Please fix the form errors before submitting');
      // Scroll to first invalid field
      const firstInvalid = document.querySelector('.ng-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this category? Products in this category will become uncategorized.',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCategory()
    });
  }

  deleteCategory(): void {
    if (this.categoryId()) {
      this.categoryService.deleteCategory(this.categoryId()!).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Category deleted successfully'
          });
          this.router.navigate(['/categories']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete category'
          });
        }
      });
    }
  }
}