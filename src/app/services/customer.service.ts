import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, CustomerProfileDto, CustomerSearchDto, Governorate, PagedResult } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, isBlacklisted?: boolean | null, pageNumber: number = 1, pageSize: number = 10): Observable<PagedResult<Customer>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    if (isBlacklisted !== undefined && isBlacklisted !== null) {
      params = params.set('isBlacklisted', isBlacklisted.toString());
    }

    return this.http.get<PagedResult<Customer>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  create(customer: any): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer);
  }

  update(id: number, customer: any): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
  }

  toggleBlacklist(id: number): Observable<Customer> {
    return this.http.patch<Customer>(`${this.apiUrl}/${id}/toggle-blacklist`, {});
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  searchCustomers(query: string): Observable<CustomerSearchDto[]> {
    return this.http.get<CustomerSearchDto[]>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`);
  }

  getByPhone(phone: string): Observable<CustomerSearchDto> {
    return this.http.get<CustomerSearchDto>(`${this.apiUrl}/by-phone/${encodeURIComponent(phone)}`);
  }

  getCustomerProfile(id: number): Observable<CustomerProfileDto> {
    return this.http.get<CustomerProfileDto>(`${this.apiUrl}/${id}/profile`);
  }

  getGovernorates(): Observable<Governorate[]> {
    return this.http.get<Governorate[]>(`${environment.apiUrl}/governorates`);
  }
}
