import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Redirects already-logged-in users away from /login to /dashboard
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    router.navigate(['/dashboard']);
    return false;
  }

  // Wipe any stale token or storage state when navigating to login
  authService.logout();
  return true;
};

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Token missing or expired -> perform complete logout & redirect to /login
  authService.logout();
  router.navigate(['/login']);
  return false;
};

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
