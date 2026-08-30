import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatus, PagedResult, SalesPlatform } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getAll(
    status?: OrderStatus, 
    fromDate?: string, 
    toDate?: string, 
    shippingCompanyId?: number,
    pageNumber: number = 1,
    pageSize: number = 10,
    search?: string
  ): Observable<PagedResult<Order>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (shippingCompanyId) params = params.set('shippingCompanyId', shippingCompanyId.toString());
    if (search) params = params.set('search', search);
    params = params.set('pageNumber', pageNumber.toString());
    params = params.set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<Order>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  calculateCosts(req: { governorateId: number; shippingCompanyId: number; items: { productId: number; quantity: number }[] }): Observable<{ subTotal: number; shippingCost: number; totalAmount: number }> {
    return this.http.post<{ subTotal: number; shippingCost: number; totalAmount: number }>(`${this.apiUrl}/calculate-costs`, req);
  }

  create(order: any): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateStatus(id: number, status: OrderStatus, notes?: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  update(id: number, orderData: any): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, orderData);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getSalesPlatforms(): Observable<SalesPlatform[]> {
    return this.http.get<SalesPlatform[]>(`${environment.apiUrl}/sales-platforms`);
  }

  createSalesPlatform(data: string | { name: string }): Observable<SalesPlatform> {
    const payload = typeof data === 'string' ? { name: data } : data;
    return this.http.post<SalesPlatform>(`${environment.apiUrl}/sales-platforms`, payload);
  }

  deleteSalesPlatform(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/sales-platforms/${id}`);
  }
}
