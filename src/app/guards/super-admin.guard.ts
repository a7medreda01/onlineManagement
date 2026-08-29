import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const superAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (currentUser && currentUser.isSuperAdmin) {
    return true;
  }

  router.navigate(['/super-admin/login']);
  return false;
};
