import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiUrl = `${environment.apiUrl}/profile`;
  private readonly uploadUrl = `${environment.apiUrl}/uploads/avatar`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateProfile(data: { fullName: string; phone: string; avatarUrl?: string }): Observable<any> {
    return this.http.put(this.apiUrl, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }

  uploadAvatar(file: File): Observable<{ url: string; relativeUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; relativeUrl: string; fileName: string }>(this.uploadUrl, formData);
  }
}
