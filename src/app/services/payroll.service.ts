import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaffMemberPayrollSummary, StaffPayrollRecord } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private readonly apiUrl = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  getStaffSummaries(): Observable<StaffMemberPayrollSummary[]> {
    return this.http.get<StaffMemberPayrollSummary[]>(`${this.apiUrl}/staff`);
  }

  getStaffSummary(userId: number): Observable<StaffMemberPayrollSummary> {
    return this.http.get<StaffMemberPayrollSummary>(`${this.apiUrl}/staff/${userId}`);
  }

  getHistory(userId?: number): Observable<StaffPayrollRecord[]> {
    const url = userId ? `${this.apiUrl}/history?userId=${userId}` : `${this.apiUrl}/history`;
    return this.http.get<StaffPayrollRecord[]>(url);
  }

  recordAdvance(data: { userId: number; amount: number; walletId: number; reason?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/advance`, data);
  }

  recordBonusPenalty(data: { userId: number; type: number; amount: number; reason?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/bonus-penalty`, data);
  }

  disburseSalary(data: { userId: number; amount: number; walletId: number; notes?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/disburse`, data);
  }
}
