import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Wallet,
  CreateWalletDto,
  UpdateWalletDto,
  WalletTransaction,
  RecordOrderDepositDto,
  TransferFundsDto,
  AdjustBalanceDto,
  WalletSummaryDto,
  WalletTransactionType
} from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly apiUrl = `${environment.apiUrl}/wallets`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<WalletSummaryDto> {
    return this.http.get<WalletSummaryDto>(`${this.apiUrl}/summary`);
  }

  getAll(includeInactive: boolean = false): Observable<Wallet[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<Wallet[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateWalletDto): Observable<Wallet> {
    return this.http.post<Wallet>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateWalletDto): Observable<Wallet> {
    return this.http.put<Wallet>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  transfer(dto: TransferFundsDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/transfer`, dto);
  }

  recordDeposit(dto: RecordOrderDepositDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/deposits`, dto);
  }

  adjustBalance(dto: AdjustBalanceDto): Observable<WalletTransaction> {
    return this.http.post<WalletTransaction>(`${this.apiUrl}/adjust`, dto);
  }

  getTransactions(
    walletId?: number,
    orderId?: number,
    type?: WalletTransactionType,
    fromDate?: string,
    toDate?: string
  ): Observable<WalletTransaction[]> {
    let params = new HttpParams();
    if (walletId) params = params.set('walletId', walletId.toString());
    if (orderId) params = params.set('orderId', orderId.toString());
    if (type) params = params.set('type', type.toString());
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<WalletTransaction[]>(`${this.apiUrl}/transactions`, { params });
  }
}
