import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Plan } from '../../../models/models';

@Component({
  selector: 'app-super-admin-plans-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Plan Form -->
      <div class="glass-card p-6 border-indigo-500/30 bg-slate-900/90">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <h3 class="font-bold text-base text-slate-100 flex items-center gap-2">
            <i class="bi bi-sliders text-sky-400"></i>
            <span>{{ editingPlanId ? 'تعديل إعدادات الباقة' : 'إنشاء باقة جديدة بالمنصة' }}</span>
          </h3>
          <button *ngIf="editingPlanId" (click)="cancelEdit.emit()" class="btn btn-secondary btn-sm text-xs">إلغاء التعديل</button>
        </div>

        <form (ngSubmit)="submitPlan.emit()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="form-group">
              <label class="form-label">اسم الباقة</label>
              <input type="text" [(ngModel)]="planForm.name" name="name" class="form-control" placeholder="مثال: الباقة الاحترافية Pro" required />
            </div>
            <div class="form-group">
              <label class="form-label">الشارة / البادج</label>
              <input type="text" [(ngModel)]="planForm.badge" name="badge" class="form-control" placeholder="مثال: الأكثر طلباً 🔥" />
            </div>
            <div class="form-group">
              <label class="form-label">الوصف المختصر</label>
              <input type="text" [(ngModel)]="planForm.description" name="description" class="form-control" placeholder="وصف الباقة..." />
            </div>
          </div>

          <!-- Pricing & Annual Offer -->
          <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-4">
            <div class="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <i class="bi bi-tag-fill"></i>
              <span>التسعير وعرض السعر السنوي</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div class="form-group">
                <label class="form-label">السعر الشهري (ج.م)</label>
                <input type="number" [(ngModel)]="planForm.price" name="price" class="form-control" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">السعر الأساسي المشطوب (ج.م)</label>
                <input type="number" [(ngModel)]="planForm.originalPrice" name="originalPrice" class="form-control" placeholder="5000" />
              </div>
              <div class="form-group">
                <label class="form-label">السعر السنوي الرسمي (ج.م)</label>
                <input type="number" [(ngModel)]="planForm.annualPrice" name="annualPrice" class="form-control" placeholder="3000" />
              </div>
              <div class="form-group">
                <label class="form-label">عرض السعر السنوي الفعلي (0 = مجاناً)</label>
                <input type="number" [(ngModel)]="planForm.annualOfferPrice" name="annualOfferPrice" class="form-control font-bold text-emerald-400" placeholder="0" />
              </div>
            </div>
          </div>

          <!-- Feature Toggles & Limits -->
          <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-4">
            <div class="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <i class="bi bi-check-circle-fill"></i>
              <span>الحدود والمميزات المفعلة في الباقة</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="form-group">
                <label class="form-label">الحد الأقصى للمودريتورز</label>
                <input type="number" [(ngModel)]="planForm.maxModerators" name="maxModerators" class="form-control" min="1" />
              </div>
              <div class="form-group">
                <label class="form-label">الحد الأقصى للمنتجات (اتركه فارغاً للا محدود)</label>
                <input type="number" [(ngModel)]="planForm.maxProducts" name="maxProducts" class="form-control" placeholder="غير محدود" />
              </div>
              <div class="form-group">
                <label class="form-label">الحد الأقصى للأوردرات شهرياً</label>
                <input type="number" [(ngModel)]="planForm.maxOrdersPerMonth" name="maxOrdersPerMonth" class="form-control" placeholder="غير محدود" />
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.allowWalletsAndDeposits" name="allowWalletsAndDeposits" class="rounded bg-slate-800 border-slate-700" />
                <span>الخزائن والعربونات</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.allowBostaIntegration" name="allowBostaIntegration" class="rounded bg-slate-800 border-slate-700" />
                <span>ربط شركة شحن بوسطة</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.allowExpensesTracking" name="allowExpensesTracking" class="rounded bg-slate-800 border-slate-700" />
                <span>إدارة المصروفات</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.allowFinancialReports" name="allowFinancialReports" class="rounded bg-slate-800 border-slate-700" />
                <span>التقارير المالية المتقدمة</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.allowPurchasesManagement" name="allowPurchasesManagement" class="rounded bg-slate-800 border-slate-700" />
                <span>المشتريات والموردين</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.allowPayrollAndShifts" name="allowPayrollAndShifts" class="rounded bg-slate-800 border-slate-700" />
                <span>المرتبات والسلف والشيفتات</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" [(ngModel)]="planForm.isActive" name="isActive" class="rounded bg-slate-800 border-slate-700" />
                <span>الباقة مفعلة ومتاحة</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="submit" class="btn btn-primary px-8 flex items-center gap-2">
              <i class="bi bi-check-lg"></i>
              <span>{{ editingPlanId ? 'تحديث الباقة' : 'إنشاء الباقة' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Current Plans List -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div *ngFor="let p of plans" class="glass-card p-5 border-slate-700/60 bg-slate-900/80 space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 class="font-bold text-slate-100 text-base">{{ p.name }}</h4>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">{{ p.badge }}</span>
            </div>
            <button (click)="editPlan.emit(p)" class="btn btn-secondary btn-sm py-1 px-2.5 text-xs text-sky-400 flex items-center gap-1">
              <i class="bi bi-pencil"></i> تعديل
            </button>
          </div>

          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">السعر السنوي المعروض:</span>
              <span class="font-bold text-emerald-400">{{ p.annualOfferPrice }} ج.م</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">الحد الأقصى للمودريتورز:</span>
              <span>{{ p.maxModerators }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">الخزائن والعربونات:</span>
              <span [ngClass]="p.allowWalletsAndDeposits ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowWalletsAndDeposits ? 'نعم' : 'لا' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">ربط بوسطة:</span>
              <span [ngClass]="p.allowBostaIntegration ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowBostaIntegration ? 'نعم' : 'لا' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">المرتبات والسلف:</span>
              <span [ngClass]="p.allowPayrollAndShifts ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowPayrollAndShifts ? 'نعم' : 'لا' }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SuperAdminPlansManagerComponent {
  @Input() plans: Plan[] = [];
  @Input() planForm: any;
  @Input() editingPlanId: number | null = null;
  @Output() submitPlan = new EventEmitter<void>();
  @Output() editPlan = new EventEmitter<Plan>();
  @Output() cancelEdit = new EventEmitter<void>();
}
