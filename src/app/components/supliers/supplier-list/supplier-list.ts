import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SupplierService } from '../../../services/supplier/supplier-service';
import { AuthService } from '../../../services/auth';
import { Router, RouterModule } from '@angular/router';
import { Supplier } from '../../../interfaces/supplier.Interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from "primeng/confirmdialog";
import { UtilsModule } from '../../../utils.module';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-supplier-list',
  imports: [TooltipModule,CommonModule,UtilsModule,
    RouterModule,
    FormsModule, ConfirmDialog],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.css',
  providers: [ConfirmationService, MessageService]
})
export class SupplierList  implements OnInit {
  private supplierService = inject(SupplierService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  
  // Pagination
  pagination = signal({
    currentPage: 1,
    totalPages: 0,
    totalSuppliers: 0,
    limit: 10
  });

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    const filters = {
      search: this.searchTerm(),
      page: this.pagination().currentPage,
      limit: this.pagination().limit
    };

    this.supplierService.getSuppliers(filters).subscribe({
      next: (response) => {
        this.suppliers.set(response.data as Supplier[] || []);
        if (response.pagination) {
          this.pagination.set({
            ...this.pagination(),
            currentPage: response.pagination.currentPage,
            totalPages: response.pagination.totalPages,
            totalSuppliers: response.pagination.totalSuppliers
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load suppliers'
        });
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.pagination.set({ ...this.pagination(), currentPage: 1 });
    this.loadSuppliers();
  }

  onPageChange(event: any): void {
    this.pagination.set({ 
      ...this.pagination(), 
      currentPage: event.page + 1,
      limit: event.rows
    });
    this.loadSuppliers();
  }

  confirmDelete(supplier: Supplier): void {
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
        this.loadSuppliers();
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

  getContactInfo(supplier: Supplier): string {
    const info = [];
    if (supplier.phone) info.push(supplier.phone);
    if (supplier.email) info.push(supplier.email);
    return info.join(' • ') || 'No contact info';
  }
}