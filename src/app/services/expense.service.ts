import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseSummary, PagedResult } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  getAll(
    category?: string,
    startDate?: string,
    endDate?: string,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<Expense>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (category) params = params.set('category', category);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PagedResult<Expense>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getSummary(startDate?: string, endDate?: string): Observable<ExpenseSummary> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/summary`, { params });
  }
}
