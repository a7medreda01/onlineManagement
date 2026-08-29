import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreatePurchaseInvoiceDto, PagedResult, PurchaseInvoice, Supplier } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {
  private readonly suppliersUrl = `${environment.apiUrl}/suppliers`;
  private readonly invoicesUrl = `${environment.apiUrl}/purchaseinvoices`;

  constructor(private http: HttpClient) {}

  // Suppliers API
  getSuppliers(search?: string, pageNumber: number = 1, pageSize: number = 10): Observable<PagedResult<Supplier>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PagedResult<Supplier>>(this.suppliersUrl, { params });
  }

  getSuppliersList(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.suppliersUrl}/list`);
  }

  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.suppliersUrl}/${id}`);
  }

  createSupplier(supplier: any): Observable<Supplier> {
    return this.http.post<Supplier>(this.suppliersUrl, supplier);
  }

  updateSupplier(id: number, supplier: any): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.suppliersUrl}/${id}`, supplier);
  }

  deleteSupplier(id: number): Observable<any> {
    return this.http.delete(`${this.suppliersUrl}/${id}`);
  }

  // Purchase Invoices API
  getPurchaseInvoices(
    search?: string,
    supplierId?: number,
    fromDate?: string,
    toDate?: string,
    isPaid?: boolean | null,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<PurchaseInvoice>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search && search.trim()) params = params.set('search', search.trim());
    if (supplierId) params = params.set('supplierId', supplierId.toString());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (isPaid !== undefined && isPaid !== null) params = params.set('isPaid', isPaid.toString());

    return this.http.get<PagedResult<PurchaseInvoice>>(this.invoicesUrl, { params });
  }

  getPurchaseInvoiceById(id: number): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.invoicesUrl}/${id}`);
  }

  createPurchaseInvoice(dto: CreatePurchaseInvoiceDto): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(this.invoicesUrl, dto);
  }

  deletePurchaseInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.invoicesUrl}/${id}`);
  }
}
