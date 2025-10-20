import { Component, inject, input, output } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { Router,RouterLink,RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: ('admin' | 'manager' | 'sales')[];
  isActive?: boolean;
} 


@Component({
  selector: 'app-sidebar',
  imports: [RouterLink,RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  isCollapsed = input(false);
  isMobileOpen = input(false);
  closeMobile = output();
  
  authService = inject(AuthService);
  private router = inject(Router);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard', roles: ['admin', 'manager'] },
    { label: 'Point of Sale', icon: '💰', route: '/sales/new', roles: ['admin', 'manager', 'sales'] },
    { label: 'Categories', icon: '📁', route: '/categories', roles: ['admin', 'manager'] },
    { label: 'Products', icon: '📦', route: '/products', roles: ['admin', 'manager'] },
    { label: 'Customers', icon: '👥', route: '/customers', roles: ['admin', 'manager', 'sales'] },
    { label: 'Inventory', icon: '🏢', route: '/inventory', roles: ['admin', 'manager'] },
    { label: 'Sales', icon: '🧾', route: '/sales', roles: ['admin', 'manager', 'sales'] },
    { label: 'Suppliers', icon: '🚚', route: '/suppliers', roles: ['admin', 'manager'] },
    { label: 'Purchases', icon: '🚚', route: '/purchases', roles: ['admin', 'manager'] },
    { label: 'Reports', icon: '📈', route: '/reports', roles: ['admin', 'manager'] },
    { label: 'Users', icon: '👨‍💼', route: '/users', roles: ['admin'] }
  ];

  hasAccess(roles: ('admin' | 'manager' | 'sales')[]): boolean {
    const userRole = this.authService.currentUser()?.role;
    return userRole ? roles.includes(userRole) : false;
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