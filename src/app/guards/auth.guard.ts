import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Redirects already-logged-in users away from /login to their appropriate dashboard
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    if (authService.isSuperAdmin()) {
      router.navigate(['/super-admin']);
    } else {
      router.navigate(['/dashboard']);
    }
    return false;
  }

  // Wipe any stale token or storage state when navigating to login
  authService.logout();
  return true;
};

// General Auth Guard for Store Users (Redirects SuperAdmin to /super-admin and unauthenticated to /login)
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  if (authService.isSuperAdmin()) {
    router.navigate(['/super-admin']);
    return false;
  }

  return true;
};

// Guard: Strictly Admin Only (صاحب المتجر)
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

// Guard: Admin & Manager (الإدارة العامة والمدير العام)
export const managerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  if (authService.isManager()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

// Guard: Financial (المالية: صاحب المتجر، المدير العام، والمدير المالي)
export const financialGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  if (authService.isFinancial()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

// Guard: Moderator Only / Store Staff (المودريتورز)
export const moderatorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.logout();
    router.navigate(['/login']);
    return false;
  }

  if (authService.isModerator() || authService.isAdmin() || authService.isManager()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
