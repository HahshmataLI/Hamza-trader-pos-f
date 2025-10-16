import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { UtilsModule } from '../../../utils.module';
@Component({
  selector: 'app-header',
  imports: [UtilsModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  toggleSidebar = output();
  toggleMobileSidebar = output();
  
  authService = inject(AuthService);
  private router = inject(Router);

  getPageTitle(): string {
    const route = this.router.url.split('/')[1];
    const titles: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'pos': 'Point of Sale',
      'products': 'Products',
      'categories': 'Categories',
      'suppliers': 'Suppliers',
      'purchases': 'Purchases',

      'customers': 'Customers',
      'inventory': 'Inventory',
      'sales': 'Sales History',
      'reports': 'Reports',
      'users': 'User Management'
    };
    return titles[route] || 'Dashboard';
  }

  getInitials(): string {
    const name = this.authService.currentUser()?.name || '';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  logout(): void {
    this.authService.logout();
  }
}