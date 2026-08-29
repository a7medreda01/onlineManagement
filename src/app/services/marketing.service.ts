import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MarketingCampaign {
  id: number;
  title: string;
  subject: string;
  bodyHtml: string;
  targetFilter: string;
  targetFilterName: string;
  governorateId?: number;
  governorateName: string;
  totalRecipients: number;
  sentCount: number;
  status: string;
  statusName: string;
  createdAt: string;
  sentAt?: string;
  createdByName: string;
}

export interface CreateMarketingCampaign {
  title: string;
  subject: string;
  bodyHtml: string;
  targetFilter: number;
  governorateId?: number;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketingService {
  private readonly apiUrl = `${environment.apiUrl}/marketing`;

  constructor(private http: HttpClient) {}

  getCampaigns(): Observable<MarketingCampaign[]> {
    return this.http.get<MarketingCampaign[]>(`${this.apiUrl}/campaigns`);
  }

  createCampaign(data: CreateMarketingCampaign): Observable<MarketingCampaign> {
    return this.http.post<MarketingCampaign>(`${this.apiUrl}/campaigns`, data);
  }

  sendCampaign(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/campaigns/${id}/send`, {});
  }
}
