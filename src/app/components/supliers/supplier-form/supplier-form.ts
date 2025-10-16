import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { SupplierService } from '../../../services/supplier/supplier-service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { CreateSupplierRequest, Supplier, UpdateSupplierRequest } from '../../../interfaces/supplier.Interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-supplier-form',
  imports: [FormsModule,
    RouterModule,UtilsModule,CommonModule],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.css',
  providers: [MessageService]
})
export class SupplierForm implements OnInit {
  private supplierService = inject(SupplierService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  supplier = signal<Supplier | null>(null);
  loading = signal(false);
  isEdit = signal(false);
  supplierId = signal<string | null>(null);

  // Form model
  formData = signal<CreateSupplierRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: '',
    isActive: true
  });

  // Computed properties
  pageTitle = computed(() => 
    this.isEdit() ? `Edit Supplier: ${this.supplier()?.name}` : 'Add New Supplier'
  );

  submitButtonText = computed(() => 
    this.loading() ? 'Saving...' : (this.isEdit() ? 'Update Supplier' : 'Create Supplier')
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.supplierId.set(id);
      this.loadSupplier(id);
    } else {
      this.isEdit.set(false);
    }
  }

  loadSupplier(id: string): void {
    this.loading.set(true);
    this.supplierService.getSupplier(id).subscribe({
      next: (response) => {
        this.supplier.set(response.data as Supplier);
        this.formData.set({
          name: response.data.name,
          phone: response.data.phone,
          email: response.data.email || '',
          address: response.data.address || '',
          contactPerson: response.data.contactPerson || '',
          isActive: response.data.isActive
        });
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load supplier'
        });
        this.loading.set(false);
        this.router.navigate(['/suppliers']);
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    this.loading.set(true);

    if (this.isEdit() && this.supplierId()) {
      // Update existing supplier
      this.supplierService.updateSupplier(this.supplierId()!, this.formData() as UpdateSupplierRequest)
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Supplier updated successfully'
            });
            this.loading.set(false);
            this.router.navigate(['/suppliers']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update supplier'
            });
            this.loading.set(false);
          }
        });
    } else {
      // Create new supplier
      this.supplierService.createSupplier(this.formData())
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Supplier created successfully'
            });
            this.loading.set(false);
            this.router.navigate(['/suppliers']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create supplier'
            });
            this.loading.set(false);
          }
        });
    }
  }

  private isFormValid(): boolean {
    const data = this.formData();
    return !!(data.name && data.phone);
  }

  onCancel(): void {
    this.router.navigate(['/suppliers']);
  }
}