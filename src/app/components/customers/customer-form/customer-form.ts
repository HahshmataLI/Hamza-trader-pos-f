import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CustomerService } from '../../../services/customer/customer-service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { CreateCustomerRequest, Customer, UpdateCustomerRequest } from '../../../interfaces/customer.Interface';
import { CUSTOMER_TYPES } from '../../../utils/constants';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-form',
  imports: [ CommonModule,
    FormsModule,
    RouterModule,
    UtilsModule
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
  providers: [MessageService]
})
export class CustomerForm  implements OnInit {
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  // Make CUSTOMER_TYPES available to template
  readonly CUSTOMER_TYPES = CUSTOMER_TYPES;

  customer = signal<Customer | null>(null);
  loading = signal(false);
  isEdit = signal(false);
  customerId = signal<string | null>(null);

  // Form model
  formData = signal<CreateCustomerRequest>({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: CUSTOMER_TYPES.REGULAR,
    isActive: true
  });

  // Customer type options
  customerTypeOptions = [
    { label: 'Regular Customer', value: CUSTOMER_TYPES.REGULAR },
    { label: 'VIP Customer', value: CUSTOMER_TYPES.VIP },
    { label: 'Wholesale Customer', value: CUSTOMER_TYPES.WHOLESALE }
  ];

  // Computed properties
  pageTitle = computed(() => 
    this.isEdit() ? `Edit Customer: ${this.customer()?.name}` : 'Add New Customer'
  );

  submitButtonText = computed(() => 
    this.loading() ? 'Saving...' : (this.isEdit() ? 'Update Customer' : 'Create Customer')
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.customerId.set(id);
      this.loadCustomer(id);
    } else {
      this.isEdit.set(false);
    }
  }

  loadCustomer(id: string): void {
    this.loading.set(true);
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        const customer = response.data;
        this.customer.set(customer);
        this.formData.set({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address || '',
          customerType: customer.customerType,
          isActive: customer.isActive
        });
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load customer'
        });
        this.loading.set(false);
        this.router.navigate(['/customers']);
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

    if (this.isEdit() && this.customerId()) {
      // Update existing customer
      this.customerService.updateCustomer(this.customerId()!, this.formData() as UpdateCustomerRequest)
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Customer updated successfully'
            });
            this.loading.set(false);
            this.router.navigate(['/customers']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update customer'
            });
            this.loading.set(false);
          }
        });
    } else {
      // Create new customer
      this.customerService.createCustomer(this.formData())
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Customer created successfully'
            });
            this.loading.set(false);
            this.router.navigate(['/customers']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create customer'
            });
            this.loading.set(false);
          }
        });
    }
  }

  isFormValid(): boolean {
    const data = this.formData();
    return !!(data.name && data.phone);
  }

  onCancel(): void {
    this.router.navigate(['/customers']);
  }
}