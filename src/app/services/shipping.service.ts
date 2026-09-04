import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShippingCompany, ShippingRate } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShippingService {
  private readonly apiUrl = `${environment.apiUrl}/shipping-companies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ShippingCompany[]> {
    return this.http.get<ShippingCompany[]>(this.apiUrl);
  }

  getShippingCompanies(): Observable<ShippingCompany[]> {
    return this.getAll();
  }

  getById(id: number): Observable<ShippingCompany> {
    return this.http.get<ShippingCompany>(`${this.apiUrl}/${id}`);
  }

  create(company: any): Observable<ShippingCompany> {
    return this.http.post<ShippingCompany>(this.apiUrl, company);
  }

  updateRates(companyId: number, rates: { governorateId: number; shippingPrice: number; returnPrice: number }[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${companyId}/rates`, rates);
  }

  getRate(companyId: number, governorateId: number): Observable<ShippingRate> {
    return this.http.get<ShippingRate>(`${this.apiUrl}/${companyId}/rate/${governorateId}`);
  }

  updateIntegration(companyId: number, data: { apiKey?: string; fulfillmentApiKey?: string; webhookUrl?: string; isIntegrated?: boolean }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${companyId}/integration`, data);
  }

  disconnectIntegration(companyId: number, type?: 'merchant' | 'fulfillment'): Observable<any> {
    const url = type ? `${this.apiUrl}/${companyId}/disconnect?type=${type}` : `${this.apiUrl}/${companyId}/disconnect`;
    return this.http.post(url, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
