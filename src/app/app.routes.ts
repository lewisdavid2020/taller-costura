import { Routes } from '@angular/router';
import { authGuard } from './admin/core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent),
    title: 'Nombre del Taller — Sastrería y costura a medida',
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión — Panel del taller',
  },
  {
    path: 'admin/registro',
    loadComponent: () => import('./admin/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Crear administrador — Panel del taller',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      {
        path: 'resumen',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Resumen — Panel del taller',
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./admin/products/products-list/products-list.component').then((m) => m.ProductsListComponent),
        title: 'Productos — Panel del taller',
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./admin/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
        title: 'Agregar producto — Panel del taller',
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () =>
          import('./admin/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
        title: 'Editar producto — Panel del taller',
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./admin/orders/orders.component').then((m) => m.OrdersComponent),
        title: 'Pedidos — Panel del taller',
      },
      {
        path: 'clientes',
        loadComponent: () => import('./admin/clients/clients.component').then((m) => m.ClientsComponent),
        title: 'Clientes — Panel del taller',
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./admin/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Configuración — Panel del taller',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
