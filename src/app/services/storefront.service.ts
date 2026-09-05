import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  StorefrontSettings,
  ProductLandingPage,
  AiGenerateLandingPageRequest,
  AiGeneratedLandingPageResponse,
  PublicLandingOrderRequest,
  PublicLandingOrderResponse
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class StorefrontService {
  private readonly baseUrl = `${environment.apiUrl}/storefront`;
  private readonly publicUrl = `${environment.apiUrl}/public/store`;

  constructor(private http: HttpClient) {}

  // ==========================================
  // Merchant Protected APIs
  // ==========================================

  getSettings(): Observable<StorefrontSettings> {
    return this.http.get<StorefrontSettings>(`${this.baseUrl}/settings`);
  }

  updateSettings(data: Partial<StorefrontSettings>): Observable<StorefrontSettings> {
    return this.http.put<StorefrontSettings>(`${this.baseUrl}/settings`, data);
  }

  checkSubdomain(subdomain: string): Observable<{ subdomain: string; available: boolean }> {
    return this.http.get<{ subdomain: string; available: boolean }>(`${this.baseUrl}/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);
  }

  deleteStore(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/store`);
  }

  getLandingPages(): Observable<ProductLandingPage[]> {
    return this.http.get<ProductLandingPage[]>(`${this.baseUrl}/pages`);
  }

  getLandingPage(id: number): Observable<ProductLandingPage> {
    return this.http.get<ProductLandingPage>(`${this.baseUrl}/pages/${id}`);
  }

  createLandingPage(data: any): Observable<ProductLandingPage> {
    return this.http.post<ProductLandingPage>(`${this.baseUrl}/pages`, data);
  }

  updateLandingPage(id: number, data: any): Observable<ProductLandingPage> {
    return this.http.put<ProductLandingPage>(`${this.baseUrl}/pages/${id}`, data);
  }

  deleteLandingPage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pages/${id}`);
  }

  togglePublish(id: number): Observable<{ id: number; isPublished: boolean }> {
    return this.http.patch<{ id: number; isPublished: boolean }>(`${this.baseUrl}/pages/${id}/toggle-publish`, {});
  }

  generateAi(request: AiGenerateLandingPageRequest): Observable<AiGeneratedLandingPageResponse> {
    return this.http.post<AiGeneratedLandingPageResponse>(`${this.baseUrl}/generate-ai`, request);
  }

  generateStoreIdentity(request: { storeDescriptionOrIdea: string; niche?: string; preferredName?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/generate-store-identity`, request);
  }

  recreateStoreWithAi(request: { storeDescriptionOrIdea: string; niche?: string; preferredName?: string; productTypes?: string; brandVibe?: string }): Observable<StorefrontSettings> {
    return this.http.post<StorefrontSettings>(`${this.baseUrl}/recreate-store-ai`, request);
  }

  uploadMedia(file: File): Observable<{ url: string; relativeUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; relativeUrl: string; fileName: string }>(`${environment.apiUrl}/uploads/storefront-media`, formData);
  }

  uploadImage(file: File): Observable<{ url: string; relativeUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; relativeUrl: string; fileName: string }>(`${this.baseUrl}/upload-image`, formData);
  }

  // ==========================================
  // Public Customer Facing APIs
  // ==========================================

  getPublicStore(subdomain: string): Observable<StorefrontSettings> {
    return this.http.get<StorefrontSettings>(`${this.publicUrl}/${encodeURIComponent(subdomain)}`);
  }

  getPublicStorePages(subdomain: string): Observable<ProductLandingPage[]> {
    return this.http.get<ProductLandingPage[]>(`${this.publicUrl}/${encodeURIComponent(subdomain)}/pages`);
  }

  getPublicLandingPage(subdomain: string, slug: string): Observable<ProductLandingPage> {
    return this.http.get<ProductLandingPage>(`${this.publicUrl}/${encodeURIComponent(subdomain)}/${encodeURIComponent(slug)}`);
  }

  submitPublicOrder(subdomain: string, slug: string, order: PublicLandingOrderRequest): Observable<PublicLandingOrderResponse> {
    return this.http.post<PublicLandingOrderResponse>(`${this.publicUrl}/${encodeURIComponent(subdomain)}/${encodeURIComponent(slug)}/order`, order);
  }
}
