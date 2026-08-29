import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse, Plan, SuperAdminOverview, SubscriptionPaymentRequest, Tenant } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaasService {
  private readonly saasUrl = `${environment.apiUrl}/saas`;
  private readonly superAdminUrl = `${environment.apiUrl}/superadmin`;

  constructor(private http: HttpClient) {}

  registerStore(data: { ownerName: string; storeName: string; email: string; phone: string; password: string; selectedPlanId?: number }): Observable<{ message: string; activationToken: string }> {
    return this.http.post<{ message: string; activationToken: string }>(`${this.saasUrl}/register`, data);
  }

  activateStore(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.saasUrl}/activate`, { token });
  }

  resendToken(email: string): Observable<{ message: string; activationToken: string }> {
    return this.http.post<{ message: string; activationToken: string }>(`${this.saasUrl}/resend-token`, { email });
  }

  superAdminLogin(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.superAdminUrl}/login`, credentials);
  }

  getTenants(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(`${this.superAdminUrl}/tenants`);
  }

  suspendTenant(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/tenants/${id}/suspend`, { reason });
  }

  extendSubscription(id: number, additionalDays: number): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/tenants/${id}/extend`, { additionalDays });
  }

  reactivateTenant(id: number): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/tenants/${id}/reactivate`, {});
  }

  getOverview(): Observable<SuperAdminOverview> {
    return this.http.get<SuperAdminOverview>(`${this.superAdminUrl}/overview`);
  }

  exportTenantCustomers(tenantId: number): Observable<Blob> {
    return this.http.get(`${this.superAdminUrl}/tenants/${tenantId}/export-customers`, { responseType: 'blob' });
  }

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${environment.apiUrl}/plans`);
  }

  createPlan(data: any): Observable<Plan> {
    return this.http.post<Plan>(`${this.superAdminUrl}/plans`, data);
  }

  updatePlan(id: number, data: any): Observable<Plan> {
    return this.http.put<Plan>(`${this.superAdminUrl}/plans/${id}`, data);
  }

  // InstaPay Subscription Payment Requests
  submitPaymentRequest(data: { planId: number; senderPhone: string; amount: number; transferDate?: string; referenceNumber?: string; notes?: string }): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/subscription-requests/submit`, data);
  }

  getSubscriptionRequests(): Observable<SubscriptionPaymentRequest[]> {
    return this.http.get<SubscriptionPaymentRequest[]>(`${this.superAdminUrl}/subscription-requests`);
  }

  approveSubscriptionRequest(id: number): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/subscription-requests/${id}/approve`, {});
  }

  rejectSubscriptionRequest(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/subscription-requests/${id}/reject`, { reason });
  }

  // SuperAdmin Broadcast Email Campaign
  broadcastEmail(data: { subject: string; title: string; messageContent: string; offerBadge?: string; actionButtonText?: string; actionButtonUrl?: string; targetPlanId?: number }): Observable<any> {
    return this.http.post(`${this.superAdminUrl}/broadcast-email`, data);
  }
}
