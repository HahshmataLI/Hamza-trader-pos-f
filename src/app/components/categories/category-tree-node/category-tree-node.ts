import { Component, computed, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { CategoryTree as ICategoryTree } from '../../../interfaces/category.interface'; 
import { UtilsModule } from '../../../utils.module';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-category-tree-node',
  imports: [CommonModule,TooltipModule,UtilsModule],
  templateUrl: './category-tree-node.html',
  styleUrl: './category-tree-node.css'
})
export class CategoryTreeNode {
  authService = inject(AuthService);
  
  category = input.required<ICategoryTree>();
  level = input.required<number>();
  
  onView = output<string>();
  onEdit = output<string>();
  onDelete = output<ICategoryTree>();

  isExpanded = signal(true);
  
  // Computed properties for template
  currentLevel = computed(() => this.level());
  nextLevel = computed(() => this.level() + 1);
  hasChildren = computed(() => {
    const cat = this.category();
    return cat.subcategories && cat.subcategories.length > 0;
  });
  hasIndentation = computed(() => this.level() > 0);

  toggleExpanded(): void {
    this.isExpanded.set(!this.isExpanded());
  }

  getLevelLabel(level: number): string {
    switch (level) {
      case 1: return 'Main';
      case 2: return 'Sub';
      case 3: return 'Sub-Sub';
      default: return 'Unknown';
    }
  }

  getLevelSeverity(level: number): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null {
    switch (level) {
      case 1: return 'info';
      case 2: return 'success';
      case 3: return 'warn';
      default: return 'secondary';
    }
  }

  getLevelIcon(): string {
    switch (this.category().level) {
      case 1: return 'pi pi-folder';
      case 2: return 'pi pi-folder-open';
      case 3: return 'pi pi-tag';
      default: return 'pi pi-question';
    }
  }

  getLevelIconClass(): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center';
    switch (this.category().level) {
      case 1: return `${baseClasses} bg-blue-100 text-blue-600`;
      case 2: return `${baseClasses} bg-green-100 text-green-600`;
      case 3: return `${baseClasses} bg-orange-100 text-orange-600`;
      default: return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  }
}