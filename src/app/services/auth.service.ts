import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, SubscriptionDetails, UserRole, Plan } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  public currentUser = signal<AuthResponse | null>(this.getStoredUser());

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.storeAuthSession(res);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshTok = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken: refreshTok }).pipe(
      tap((res) => {
        this.storeAuthSession(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
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
    return localStorage.getItem('auth_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
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


  private storeAuthSession(res: AuthResponse): void {
    if (res.token) localStorage.setItem('auth_token', res.token);
    if (res.refreshToken) localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('user_data', JSON.stringify(res));
    this.currentUser.set(res);
  }

  private getStoredUser(): AuthResponse | null {
    const data = localStorage.getItem('user_data');
    return data ? JSON.parse(data) : null;
  }
}
