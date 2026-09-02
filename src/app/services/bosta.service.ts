import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum BostaDeliveryType {
  ForwardOrder = 10,
  CustomerReturn = 25,
  ExchangeOrder = 30
}

export enum BostaShipmentSource {
  MerchantWarehouse = 1,
  BostaFulfillment = 2
}

export enum BostaShipmentStatus {
  Pending = 0,
  Created = 1,
  PickedUp = 2,
  InTransit = 3,
  Delivered = 4,
  ReturnedToSender = 5,
  Cancelled = 6
}

export interface CreateBostaShipmentDto {
  orderId: number;
  deliveryType: BostaDeliveryType;
  source: BostaShipmentSource;
  codAmount?: number;
  notes?: string;
  isFulfillment?: boolean;
  exchangeItemDetails?: string;
  cityId?: string;
  districtId?: string;
  cityName?: string;
}

export interface BostaShipmentDto {
  id: number;
  orderId: number;
  orderNumber: string;
  bostaTrackingNumber: string;
  bostaShipmentId: string;
  deliveryType: BostaDeliveryType;
  deliveryTypeName: string;
  source: BostaShipmentSource;
  sourceName: string;
  shipmentStatus: BostaShipmentStatus;
  shipmentStatusName: string;
  shippingFee: number;
  codAmount: number;
  trackingUrl?: string;
  notes?: string;
  createdAt: string;
  lastStatusUpdate?: string;
}

export interface BostaFulfillmentStockDto {
  productCode: string;
  productName: string;
  localStockQuantity: number;
  bostaFulfillmentQuantity: number;
  isMatchedInBosta: boolean;
}

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BostaService {
  private readonly apiUrl = `${environment.apiUrl}/bosta`;

  constructor(private http: HttpClient) {}

  createShipment(dto: CreateBostaShipmentDto): Observable<BostaShipmentDto> {
    return this.http.post<BostaShipmentDto>(`${this.apiUrl}/shipments`, dto);
  }

  createBulkShipments(orderIds: number[], isFulfillment: boolean = false): Observable<{
    success: boolean;
    message: string;
    totalProcessed: number;
    successCount: number;
    results: { orderId: number; orderNumber: string; success: boolean; trackingNumber?: string; errorMessage?: string }[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/create-bulk-shipments`, { orderIds, isFulfillment });
  }

  getShipmentByOrderId(orderId: number): Observable<BostaShipmentDto> {
    return this.http.get<BostaShipmentDto>(`${this.apiUrl}/shipments/order/${orderId}`);
  }

  getAwbPdfUrl(trackingNumber: string): string {
    const safeUrl = this.apiUrl.replace('http://', 'https://');
    return `${safeUrl}/shipments/${trackingNumber}/awb`;
  }

  getAwbPdfBlob(trackingNumber: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/shipments/${trackingNumber}/awb`, { responseType: 'blob' });
  }

  getFulfillmentStock(): Observable<BostaFulfillmentStockDto[]> {
    return this.http.get<BostaFulfillmentStockDto[]>(`${this.apiUrl}/fulfillment/stock`);
  }

  importRates(companyId: number, customTiers?: any): Observable<{ success: boolean; message: string; ratesUpdatedCount: number }> {
    return this.http.post<{ success: boolean; message: string; ratesUpdatedCount: number }>(`${this.apiUrl}/import-rates/${companyId}`, customTiers || {});
  }

  syncProductsAndStock(): Observable<{ success: boolean; message: string; productsImportedCount: number; stockUpdatedCount: number }> {
    return this.http.post<{ success: boolean; message: string; productsImportedCount: number; stockUpdatedCount: number }>(`${this.apiUrl}/sync-products-stock`, {});
  }

  getZones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/zones`);
  }

  verifyApiKey(apiKey: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/verify-key`, { apiKey });
  }

  syncShipmentStatus(orderId: number): Observable<BostaShipmentDto> {
    return this.http.get<BostaShipmentDto>(`${this.apiUrl}/shipments/sync/${orderId}`);
  }

  syncAllPendingShipments(): Observable<{ success: boolean; message: string; stockUpdatedCount?: number }> {
    return this.http.post<{ success: boolean; message: string; stockUpdatedCount?: number }>(`${this.apiUrl}/sync-all-pending-shipments`, {});
  }
}
