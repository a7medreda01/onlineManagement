import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Governorate } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GovernorateService {
  private readonly apiUrl = `${environment.apiUrl}/governorates`;

  constructor(private http: HttpClient) {}

  getGovernorates(): Observable<Governorate[]> {
    return this.http.get<Governorate[]>(this.apiUrl);
  }
}
