import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../../services/categories/category';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { UtilsModule } from '../../../utils.module';
import { CategoryTreeNode } from "../category-tree-node/category-tree-node";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CategoryTree as ICategoryTree } from '../../../interfaces/category.interface';
@Component({
  selector: 'app-category-tree',
  imports: [ProgressSpinnerModule,RouterLink,UtilsModule, CategoryTreeNode],
  templateUrl: './category-tree.html',
  styleUrl: './category-tree.css',
   providers: [ConfirmationService, MessageService],
})
export class CategoryTree  implements OnInit {
  private categoryService = inject(CategoryService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  authService = inject(AuthService);

  categoryTree = signal<ICategoryTree[]>([]); // Use ICategoryTree interface
  loading = signal(true);

  ngOnInit(): void {
    this.loadCategoryTree();
  }

  loadCategoryTree(): void {
    this.loading.set(true);
    this.categoryService.getCategoryTree().subscribe({
      next: (response) => {
        this.categoryTree.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load category tree'
        });
        this.loading.set(false);
      }
    });
  }

  expandAll(): void {
    // Implementation for expand all
  }

  collapseAll(): void {
    // Implementation for collapse all
  }

  private getAllCategoryIds(categories: ICategoryTree[]): string[] {
    let ids: string[] = [];
    categories.forEach(category => {
      ids.push(category._id);
      if (category.subcategories && category.subcategories.length > 0) {
        ids = ids.concat(this.getAllCategoryIds(category.subcategories));
      }
    });
    return ids;
  }

  onViewCategory(categoryId: string): void {
    this.router.navigate(['/categories', categoryId]);
  }

  onEditCategory(categoryId: string): void {
    this.router.navigate(['/categories', categoryId, 'edit']);
  }

  onDeleteCategory(category: ICategoryTree): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${category.name}"? This will affect all subcategories.`,
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
        this.loadCategoryTree();
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

  getLevelLabel(level: number): string {
    switch (level) {
      case 1: return 'Main Category';
      case 2: return 'Sub Category';
      case 3: return 'Sub-Sub Category';
      default: return 'Unknown';
    }
  }

  getLevelSeverity(level: number): string {
    switch (level) {
      case 1: return 'info';
      case 2: return 'success';
      case 3: return 'warn';
      default: return 'secondary';
    }
  }
}