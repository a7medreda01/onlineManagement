import { Routes } from '@angular/router';
import { authGuard, adminGuard, managerGuard, financialGuard, loginGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/super-admin.guard';
import { LoginComponent } from './components/login/login.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password.component';
import { ResetPasswordComponent } from './components/auth/reset-password.component';
import { LayoutComponent } from './components/layout/layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductsComponent } from './components/products/products.component';
import { OrdersComponent } from './components/orders/orders.component';
import { CreateOrderComponent } from './components/orders/create-order.component';
import { OrderDetailComponent } from './components/orders/order-detail.component';
import { CustomersComponent } from './components/customers/customers.component';
import { ShippingComponent } from './components/shipping/shipping.component';
import { ReportsComponent } from './components/reports/reports.component';
import { UsersComponent } from './components/users/users.component';
import { LandingComponent } from './components/landing/landing.component';
import { SignupComponent } from './components/signup/signup.component';
import { ActivateComponent } from './components/signup/activate.component';
import { SuperAdminComponent } from './components/super-admin/super-admin.component';
import { SuperAdminLoginComponent } from './components/super-admin/login/super-admin-login.component';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { PurchaseInvoicesComponent } from './components/purchases/invoices/purchase-invoices.component';
import { CreatePurchaseInvoiceComponent } from './components/purchases/create-invoice/create-purchase-invoice.component';
import { SuppliersComponent } from './components/purchases/suppliers/suppliers.component';
import { WalletsComponent } from './components/wallets/wallets.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UnauthorizedComponent } from './components/shared/unauthorized/unauthorized.component';

import { StoreSettingsComponent } from './components/store-settings/store-settings.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { StorefrontComponent } from './components/storefront/storefront.component';
import { PublicStoreComponent } from './components/public-store/public-store.component';
import { PublicLandingPageComponent } from './components/public-store/public-landing-page.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'activate-account', component: ActivateComponent },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'super-admin/login', component: SuperAdminLoginComponent },
  { path: 'super-admin', component: SuperAdminComponent, canActivate: [superAdminGuard] },
  // Public Storefront & AI Landing Pages (Accessible without login)
  { path: 'store/:subdomain', component: PublicStoreComponent },
  { path: 'store/:subdomain/:slug', component: PublicLandingPageComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'storefront', component: StorefrontComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'orders/create', component: CreateOrderComponent },
      { path: 'orders/:id', component: OrderDetailComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'shipping', component: ShippingComponent },
      { path: 'store-settings', component: StoreSettingsComponent },
      { path: 'wallets', component: WalletsComponent, canActivate: [financialGuard] },
      { path: 'expenses', component: ExpensesComponent, canActivate: [financialGuard] },
      { path: 'purchases/invoices', component: PurchaseInvoicesComponent, canActivate: [financialGuard] },
      { path: 'purchases/create', component: CreatePurchaseInvoiceComponent, canActivate: [financialGuard] },
      { path: 'purchases/suppliers', component: SuppliersComponent, canActivate: [financialGuard] },
      { path: 'reports', component: ReportsComponent, canActivate: [financialGuard] },
      { path: 'users', component: UsersComponent, canActivate: [managerGuard] },
      { path: 'profile', component: ProfileComponent },
      { path: 'unauthorized', component: UnauthorizedComponent }
    ]
  },
  // Direct subdomain & slug route fallback (e.g. besnesy.com/storename/product-slug)
  { path: ':subdomain/:slug', component: PublicLandingPageComponent },
  { path: '**', redirectTo: '' }
];
