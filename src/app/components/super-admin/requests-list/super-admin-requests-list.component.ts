import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionPaymentRequest } from '../../../models/models';

@Component({
  selector: 'app-super-admin-requests-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="glass-card overflow-hidden">
        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>تاريخ الطلب</th>
                <th>المتجر والمالك</th>
                <th>الباقة المطلوبة</th>
                <th>رقم المحول منه</th>
                <th>المبلغ المحول</th>
                <th>الرقم المرجعي والملاحظات</th>
                <th>الحالة</th>
                <th class="text-center">إجراء</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of requests">
                <td class="text-xs font-mono">
                  <div class="text-slate-200">{{ req.createdAt | date:'yyyy/MM/dd HH:mm' }}</div>
                  <div *ngIf="req.transferDate" class="text-[10px] text-amber-400">توقيت التحويل: {{ req.transferDate | date:'yyyy/MM/dd HH:mm' }}</div>
                </td>
                <td>
                  <div class="font-bold text-slate-100">{{ req.storeName }}</div>
                  <div class="text-xs text-slate-400">{{ req.ownerName }} ({{ req.ownerEmail }})</div>
                </td>
                <td>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    {{ req.planName }}
                  </span>
                </td>
                <td class="font-mono text-emerald-400 font-bold text-xs">{{ req.senderPhone }}</td>
                <td class="font-mono text-slate-100 font-bold">{{ req.amount | number }} ج.م</td>
                <td class="text-xs text-slate-300">
                  <div>{{ req.referenceNumber || 'بدون رقم مرجعي' }}</div>
                  <div *ngIf="req.notes" class="text-slate-400 italic text-[11px]">{{ req.notes }}</div>
                </td>
                <td>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border"
                        [ngClass]="{
                          'bg-amber-500/15 text-amber-400 border-amber-500/30': req.status === 'Pending',
                          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30': req.status === 'Approved',
                          'bg-rose-500/15 text-rose-400 border-rose-500/30': req.status === 'Rejected'
                        }">
                    {{ req.statusName }}
                  </span>
                </td>
                <td class="text-center">
                  <div *ngIf="req.status === 'Pending'" class="flex items-center justify-center gap-1.5">
                    <button (click)="approve.emit(req)" class="btn bg-emerald-600 hover:bg-emerald-500 text-white btn-sm py-1 px-3 text-xs flex items-center gap-1">
                      <i class="bi bi-check-lg"></i> موافقة وتفعيل
                    </button>
                    <button (click)="reject.emit(req)" class="btn bg-rose-600 hover:bg-rose-500 text-white btn-sm py-1 px-2 text-xs">
                      <i class="bi bi-x-lg"></i> رفض
                    </button>
                  </div>
                  <span *ngIf="req.status !== 'Pending'" class="text-xs text-slate-500">تمت المعالجة</span>
                </td>
              </tr>

              <tr *ngIf="requests.length === 0">
                <td colspan="8" class="text-center py-12 text-slate-400">لا توجد طلبات تحويل حالياً</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminRequestsListComponent {
  @Input() requests: SubscriptionPaymentRequest[] = [];
  @Output() approve = new EventEmitter<SubscriptionPaymentRequest>();
  @Output() reject = new EventEmitter<SubscriptionPaymentRequest>();
}
