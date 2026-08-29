import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary, FinancialSummary, ProductPerformance, TeamActivitySummary, ModeratorPkBattleResult } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getFinancialSummary(fromDate?: string, toDate?: string): Observable<FinancialSummary> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<FinancialSummary>(`${this.apiUrl}/financial-summary`, { params });
  }

  getProductPerformance(fromDate?: string, toDate?: string): Observable<ProductPerformance[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<ProductPerformance[]>(`${this.apiUrl}/product-performance`, { params });
  }

  getOrderStatusDistribution(fromDate?: string, toDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<any[]>(`${this.apiUrl}/status-distribution`, { params });
  }

  getSalesTrendReport(fromDate?: string, toDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<any[]>(`${this.apiUrl}/sales-trend`, { params });
  }

  getTeamActivitySummary(fromDate?: string, toDate?: string): Observable<TeamActivitySummary[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<TeamActivitySummary[]>(`${this.apiUrl}/team-activity`, { params });
  }

  getModeratorPkBattle(): Observable<ModeratorPkBattleResult> {
    return this.http.get<ModeratorPkBattleResult>(`${this.apiUrl}/moderator-pk-battle`);
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard-summary`);
  }
}
