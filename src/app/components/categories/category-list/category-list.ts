import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UtilsModule } from '../../../utils.module';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/categories/category';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Category } from '../../../interfaces/category.interface';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
@Component({
  selector: 'app-category-list',
  imports: [IconFieldModule,InputIconModule,RouterLink,CommonModule,UtilsModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
  providers: [ConfirmationService, MessageService],
})
export class CategoryList implements OnInit {
  private categoryService = inject(CategoryService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  categories = signal<Category[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories'
        });
        this.loading.set(false);
      }
    });
  }

  getLevelLabel(level: number): string {
    switch (level) {
      case 1: return 'Main Category';
      case 2: return 'Sub Category';
      case 3: return 'Sub-Sub Category';
      default: return 'Unknown';
    }
  }

getLevelSeverity(level: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null {
  switch (level) {
    case 1: return 'info';     // Main Category - Blue
    case 2: return 'success';  // Sub Category - Green
    case 3: return 'warn';     // Sub-Sub Category - Orange/Yellow
    default: return 'secondary'; // Unknown - Gray
  }
}

  getParentName(category: Category): string {
    if (!category.parent) return '-';
    if (typeof category.parent === 'string') return 'Loading...';
    return category.parent.name;
  }

  confirmDelete(category: Category): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${category.name}"? This will make the category inactive.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCategory(category._id)
    });
  }

  deleteCategory(id: string): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Category deleted successfully'
        });
        this.loadCategories();
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