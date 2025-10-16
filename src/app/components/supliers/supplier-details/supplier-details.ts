import { Component, inject, OnInit, signal } from '@angular/core';
import { SupplierService } from '../../../services/supplier/supplier-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Supplier } from '../../../interfaces/supplier.Interface';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
@Component({
  selector: 'app-supplier-details',
  imports: [
     CommonModule,
    RouterModule,
    UtilsModule,
    ProgressSpinnerModule
  ],
  templateUrl: './supplier-details.html',
  styleUrl: './supplier-details.css',
  providers: [ConfirmationService, MessageService]
})
export class SupplierDetails  implements OnInit {
  private supplierService = inject(SupplierService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);

  supplier = signal<Supplier | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSupplier(id);
    }
  }

  loadSupplier(id: string): void {
    this.loading.set(true);
    this.supplierService.getSupplier(id).subscribe({
      next: (response) => {
        this.supplier.set(response.data as Supplier);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load supplier details'
        });
        this.loading.set(false);
        this.router.navigate(['/suppliers']);
      }
    });
  }

  confirmDelete(): void {
    const supplier = this.supplier();
    if (!supplier) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${supplier.name}"? This will make the supplier inactive.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteSupplier(supplier._id)
    });
  }

  deleteSupplier(id: string): void {
    this.supplierService.deleteSupplier(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Supplier deleted successfully'
        });
        this.router.navigate(['/suppliers']);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete supplier'
        });
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}