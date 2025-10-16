import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login').then(c => c.Login)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/auth/register/register').then(c => c.Register)
  },
  { 
    path: '', 
    loadComponent: () => import('./components/layout/main-layout/main-layout').then(c => c.MainLayout),
    canActivate: [authGuard],
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard/dashboard').then(c => c.Dashboard)
      },
      { 
  path: 'categories', 
  loadComponent: () => import('./components/categories/category-list/category-list').then(c => c.CategoryList),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},{ 
path: 'categories/tree', 
  loadComponent: () => import('./components/categories/category-tree/category-tree').then(c => c.CategoryTree),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'categories/new', 
  loadComponent: () => import('./components/categories/category-form/category-form').then(c => c.CategoryForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'categories/:id/edit', 
  loadComponent: () => import('./components/categories/category-form/category-form').then(c => c.CategoryForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{
  path: 'products', 
  loadComponent: () => import('./components/products/product-list/product-list').then(c => c.ProductList),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{
  path: 'products/new', 
  loadComponent: () => import('./components/products/product-form/product-form').then(c => c.ProductForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{
  path: 'products/:id/edit', 
  loadComponent: () => import('./components/products/product-form/product-form').then(c => c.ProductForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
// Add to children array in main layout route
{ 
  path: 'suppliers', 
  loadComponent: () => import('./components/supliers/supplier-list/supplier-list').then(c => c.SupplierList),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'suppliers/new', 
  loadComponent: () => import('./components/supliers/supplier-form/supplier-form').then(c => c.SupplierForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'suppliers/:id/edit', 
  loadComponent: () => import('./components/supliers/supplier-form/supplier-form').then(c => c.SupplierForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'suppliers/:id', 
  loadComponent: () => import('./components/supliers/supplier-details/supplier-details').then(c => c.SupplierDetails),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
// Add to children array in main layout route
{ 
  path: 'purchases', 
  loadComponent: () => import('./components/purchases/purchase-list/purchase-list').then(c => c.PurchaseList),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'purchases/new', 
  loadComponent: () => import('./components/purchases/purchase-form/purchase-form').then(c => c.PurchaseForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'purchases/:id', 
  loadComponent: () => import('./components/purchases/purchase-details/purchase-details').then(c => c.PurchaseDetails),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
},
{ 
  path: 'purchases/:id/edit', 
  loadComponent: () => import('./components/purchases/purchase-form/purchase-form').then(c => c.PurchaseForm),
  canActivate: [roleGuard],
  data: { roles: ['admin', 'manager'] }
}
      // We'll add more routes here as we build modules
    ]
  },
  // Add to the children array in the main layout route

   { path: '**', redirectTo: '/dashboard' }
];