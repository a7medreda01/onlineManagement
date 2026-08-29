import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tenant } from '../../../models/models';

@Component({
  selector: 'app-super-admin-tenants-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <div class="glass-card p-4">
        <div class="relative">
          <i class="bi bi-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input type="text" [(ngModel)]="searchTerm" (input)="onSearchChange()" class="input-glass w-full pr-10 text-sm" placeholder="البحث باسم المتجر أو المالك أو البريد..." />
        </div>
      </div>

      <div class="glass-card overflow-hidden">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>المتجر والمالك</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الباقة الحالية</th>
                <th>المنتجات والأوردرات</th>
                <th>الحالة والمتبقي</th>
                <th class="text-center">إجراءات السوبر أدمن</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of filteredTenants">
                <td>
                  <div class="font-bold text-slate-100">{{ t.storeName }}</div>
                  <div class="text-xs text-sky-400">{{ t.ownerName }}</div>
                </td>
                <td class="text-xs text-slate-300 font-mono">{{ t.email }}</td>
                <td class="text-xs text-slate-300 font-mono">{{ t.phone }}</td>
                <td>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {{ t.activeSubscription?.planName || 'Free Gift' }}
                  </span>
                </td>
                <td class="text-xs text-slate-300">
                  <span>{{ t.totalProductsCount || 0 }} منتج</span>
                  <span class="text-slate-600 mx-1">|</span>
                  <span>{{ t.totalOrdersCount || 0 }} أوردر</span>
                </td>
                <td>
                  <div *ngIf="t.isActive" class="space-y-1">
                    <span class="badge badge-delivered">نشط</span>
                    <div class="text-[11px] text-slate-400">متبقي: {{ t.activeSubscription?.daysRemaining || 0 }} يوم</div>
                  </div>
                  <div *ngIf="!t.isActive">
                    <span class="badge badge-cancelled">موقوف</span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <button (click)="exportCustomers.emit(t)" class="btn btn-secondary btn-sm text-sky-400" title="استخراج عملاء المتجر CSV">
                      <i class="bi bi-file-earmark-spreadsheet"></i>
                    </button>
                    <button (click)="extendTenant.emit(t)" class="btn btn-secondary btn-sm text-emerald-400" title="تمديد الاشتراك">
                      <i class="bi bi-calendar-plus"></i>
                    </button>
                    <button *ngIf="t.isActive" (click)="suspendTenant.emit(t)" class="btn btn-secondary btn-sm text-rose-400" title="إيقاف المتجر">
                      <i class="bi bi-pause-circle"></i>
                    </button>
                    <button *ngIf="!t.isActive" (click)="reactivateTenant.emit(t)" class="btn btn-secondary btn-sm text-emerald-400" title="إعادة التفعيل">
                      <i class="bi bi-play-circle"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredTenants.length === 0">
                <td colspan="7" class="text-center py-12 text-slate-400">لا توجد متاجر مطابقة للبحث</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminTenantsListComponent {
  @Input() tenants: Tenant[] = [];
  @Input() filteredTenants: Tenant[] = [];
  @Output() search = new EventEmitter<string>();
  @Output() exportCustomers = new EventEmitter<Tenant>();
  @Output() extendTenant = new EventEmitter<Tenant>();
  @Output() suspendTenant = new EventEmitter<Tenant>();
  @Output() reactivateTenant = new EventEmitter<Tenant>();

  searchTerm = '';

  onSearchChange(): void {
    this.search.emit(this.searchTerm);
  }
}
