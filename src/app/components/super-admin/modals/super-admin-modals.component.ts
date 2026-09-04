import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tenant, SubscriptionPaymentRequest } from '../../../models/models';

@Component({
  selector: 'app-super-admin-modals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Suspend Modal -->
    <div *ngIf="showSuspendModal" class="app-modal-overlay">
      <div class="glass-card w-full max-w-md p-6 fade-in my-auto max-h-[90vh] overflow-y-auto shadow-2xl border-rose-500/30 bg-slate-900/95 rounded-2xl">
        <div class="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
            <i class="bi bi-pause-circle-fill text-rose-400 text-lg"></i>
            <span>إيقاف اشتراك متجر: {{ selectedTenant?.storeName }}</span>
          </h3>
          <button (click)="closeSuspend.emit()" class="text-slate-400 hover:text-white p-1"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="space-y-4">
          <div class="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            تنبيه: سيتم إيقاف صلاحيات المتجر فوراً وسيظهر لصاحب المتجر عند تسجيل الدخول إشعار بأن المتجر موقوف مع زر التواصل بالدعم الفني.
          </div>

          <div class="form-group">
            <label class="form-label">سبب الإيقاف (سيظهر لصاحب المتجر)</label>
            <textarea [(ngModel)]="suspendReason" rows="3" class="form-control" placeholder="مثال: انتهاء صلاحية الاشتراك أو مخالفة الشروط..." required></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="closeSuspend.emit()" class="btn btn-secondary text-xs">إلغاء</button>
            <button type="button" (click)="confirmSuspend.emit(suspendReason)" class="btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5">تأكيد الإيقاف</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Extend Modal -->
    <div *ngIf="showExtendModal" class="app-modal-overlay">
      <div class="glass-card w-full max-w-md p-6 fade-in my-auto max-h-[90vh] overflow-y-auto shadow-2xl border-emerald-500/30 bg-slate-900/95 rounded-2xl">
        <div class="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
            <i class="bi bi-calendar-plus-fill text-emerald-400 text-lg"></i>
            <span>تمديد اشتراك متجر: {{ selectedTenant?.storeName }}</span>
          </h3>
          <button (click)="closeExtend.emit()" class="text-slate-400 hover:text-white p-1"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">عدد الأيام الإضافية المراد إضافتها للاشتراك</label>
            <input type="number" [(ngModel)]="additionalDays" min="1" max="3650" class="form-control" required />
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="closeExtend.emit()" class="btn btn-secondary text-xs">إلغاء</button>
            <button type="button" (click)="confirmExtend.emit(additionalDays)" class="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5">تأكيد التمديد</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Payment Modal -->
    <div *ngIf="showRejectModal" class="app-modal-overlay">
      <div class="glass-card w-full max-w-md p-6 fade-in my-auto max-h-[90vh] overflow-y-auto shadow-2xl border-rose-500/30 bg-slate-900/95 rounded-2xl">
        <div class="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
          <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
            <i class="bi bi-x-circle-fill text-rose-400 text-lg"></i>
            <span>رفض طلب التحويل لمتجر: {{ selectedRequest?.storeName }}</span>
          </h3>
          <button (click)="closeReject.emit()" class="text-slate-400 hover:text-white p-1"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">سبب الرفض</label>
            <textarea [(ngModel)]="rejectReason" rows="3" class="form-control" placeholder="مثال: لم يتم استلام التحويل على إنستاباي، رقم تحويل غير مطابق..." required></textarea>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="closeReject.emit()" class="btn btn-secondary text-xs">إلغاء</button>
            <button type="button" (click)="confirmReject.emit(rejectReason)" class="btn bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5">تأكيد الرفض</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminModalsComponent {
  @Input() showSuspendModal = false;
  @Input() selectedTenant: Tenant | null = null;
  @Input() suspendReason = '';

  @Input() showExtendModal = false;
  @Input() additionalDays = 30;

  @Input() showRejectModal = false;
  @Input() selectedRequest: SubscriptionPaymentRequest | null = null;
  @Input() rejectReason = '';

  @Output() closeSuspend = new EventEmitter<void>();
  @Output() confirmSuspend = new EventEmitter<string>();

  @Output() closeExtend = new EventEmitter<void>();
  @Output() confirmExtend = new EventEmitter<number>();

  @Output() closeReject = new EventEmitter<void>();
  @Output() confirmReject = new EventEmitter<string>();
}
