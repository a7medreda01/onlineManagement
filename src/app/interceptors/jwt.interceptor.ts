import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublicUrl = req.url.includes('/api/auth/login') ||
                      req.url.includes('/api/auth/refresh-token') ||
                      req.url.includes('/api/superadmin/login') ||
                      req.url.includes('/api/plans') ||
                      req.url.includes('/api/saas/register') ||
                      req.url.includes('/api/saas/activate') ||
                      req.url.includes('/api/saas/resend-token');

  const token = authService.getToken();

  // Proactive check: If token is expired locally before sending non-public request
  if (token && authService.isTokenExpired(token) && !isPublicUrl) {
    if (authService.getRefreshToken()) {
      return authService.refreshToken().pipe(
        switchMap((newRes) => {
          const newReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newRes.token}`
            }
          });
          return next(newReq);
        }),
        catchError((refreshErr) => {
          authService.logout();
          const currentUrl = router.url;
          if (currentUrl.includes('/super-admin')) {
            router.navigate(['/super-admin/login']);
          } else {
            router.navigate(['/login']);
          }
          return throwError(() => refreshErr);
        })
      );
    } else {
      // Token expired & no refresh token -> perform complete logout & redirect to /login immediately
      authService.logout();
      const currentUrl = router.url;
      if (currentUrl.includes('/super-admin')) {
        router.navigate(['/super-admin/login']);
      } else {
        router.navigate(['/login']);
      }
      return throwError(() => new Error('التوكن منتهي الصلاحية'));
    }
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !isPublicUrl && authService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap((newRes) => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newRes.token}`
              }
            });
            return next(newReq);
          }),
          catchError((refreshErr) => {
            authService.logout();
            const currentUrl = router.url;
            if (currentUrl.includes('/super-admin')) {
              router.navigate(['/super-admin/login']);
            } else {
              router.navigate(['/login']);
            }
            return throwError(() => refreshErr);
          })
        );
      } else if (error.status === 401 && !isPublicUrl) {
        authService.logout();
        const currentUrl = router.url;
        if (currentUrl.includes('/super-admin')) {
          router.navigate(['/super-admin/login']);
        } else {
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        console.warn('Access denied: 403 Forbidden');
      }

      return throwError(() => error);
    })
  );
};
