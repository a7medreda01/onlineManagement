import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { AuthResponse, SubscriptionDetails, UserRole, Plan } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  public currentUser = signal<AuthResponse | null>(this.getStoredUser());
  private refreshTokenSubject: Observable<AuthResponse> | null = null;

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }, rememberMe: boolean = false): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.storeAuthSession(res, rememberMe);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    if (this.refreshTokenSubject) {
      return this.refreshTokenSubject;
    }

    const refreshTok = this.getRefreshToken();
    if (!refreshTok) {
      this.logout();
      return throwError(() => new Error('رمز التحديث غير موجود'));
    }

    const rememberMe = this.isRemembered();
    this.refreshTokenSubject = this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken: refreshTok }).pipe(
      tap((res) => {
        this.storeAuthSession(res, rememberMe);
        this.refreshTokenSubject = null;
      }),
      catchError((err) => {
        this.refreshTokenSubject = null;
        this.logout();
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    return this.refreshTokenSubject;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');
    this.currentUser.set(null);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: { email: string; token: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  getSubscriptionDetails(): Observable<SubscriptionDetails> {
    return this.http.get<SubscriptionDetails>(`${this.apiUrl}/subscription-details`);
  }

  getPublicPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${environment.apiUrl}/plans`);
  }

  getToken(): string | null {
    const isRemembered = localStorage.getItem('remember_me') === 'true';
    if (isRemembered) {
      return localStorage.getItem('auth_token');
    }
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  }

  getRefreshToken(): string | null {
    const isRemembered = localStorage.getItem('remember_me') === 'true';
    if (isRemembered) {
      return localStorage.getItem('refresh_token');
    }
    return sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (!this.isTokenExpired(token)) return true;
    return !!this.getRefreshToken();
  }

  isRemembered(): boolean {
    return localStorage.getItem('remember_me') === 'true';
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === UserRole.Admin;
  }

  isManager(): boolean {
    const user = this.currentUser();
    return user?.role === UserRole.Admin || user?.role === UserRole.Manager;
  }

  isFinancial(): boolean {
    const user = this.currentUser();
    return user?.role === UserRole.Admin || user?.role === UserRole.Manager || user?.role === UserRole.FinancialManager;
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser();
    return !!user?.role && roles.includes(user.role);
  }

  public parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  public isTokenExpired(token?: string | null): boolean {
    const t = token || this.getToken();
    if (!t) return true;
    const payload = this.parseJwt(t);
    if (!payload || !payload.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  private storeAuthSession(res: AuthResponse, rememberMe: boolean): void {
    // Clear both storages first to ensure no leftover mixed keys
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_data');

    const storage = rememberMe ? localStorage : sessionStorage;

    if (rememberMe) {
      localStorage.setItem('remember_me', 'true');
    }

    if (res.token) storage.setItem('auth_token', res.token);
    if (res.refreshToken) storage.setItem('refresh_token', res.refreshToken);
    storage.setItem('user_data', JSON.stringify(res));
    this.currentUser.set(res);
  }

  private getStoredUser(): AuthResponse | null {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    const isRemembered = this.isRemembered();
    const data = isRemembered ? localStorage.getItem('user_data') : (sessionStorage.getItem('user_data') || localStorage.getItem('user_data'));
    if (!data) return null;
    try {
      return JSON.parse(data) as AuthResponse;
    } catch {
      return null;
    }
  }
}
