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
            <div class="text-xs font-bold text-sky-400 flex items-center justify-between">
              <span class="flex items-center gap-1.5"><i class="bi bi-check-circle-fill"></i> التحكم في أقسام ومميزات الباقة (تفعيل / تعطيل)</span>
              <span class="text-[11px] text-slate-400 font-normal">ينعكس فوراً على صلاحيات المشتركين بهذه الخطة</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="form-group">
                <label class="form-label">الحد الأقصى لحسابات الموظفين (0 = معطل)</label>
                <input type="number" [(ngModel)]="planForm.maxModerators" name="maxModerators" class="form-control" min="0" placeholder="0" />
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

            <!-- Department Toggles -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-amber-500/40 transition">
                <input type="checkbox" [(ngModel)]="planForm.allowWalletsAndDeposits" name="allowWalletsAndDeposits" class="rounded w-4 h-4 text-amber-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-wallet2 text-amber-400"></i> قسم الخزائن والمحافظ والعربونات</div>
                  <div class="text-[10px] text-slate-400">إدارة الخزن والمحافظ الإلكترونية وتتبع العربون</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-rose-500/40 transition">
                <input type="checkbox" [(ngModel)]="planForm.allowExpensesTracking" name="allowExpensesTracking" class="rounded w-4 h-4 text-rose-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-receipt text-rose-400"></i> قسم المصروفات اليومية</div>
                  <div class="text-[10px] text-slate-400">تسجيل وتصنيف المصاريف اليومية والتشغيلية</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-amber-500/40 transition">
                <input type="checkbox" [(ngModel)]="planForm.allowPurchasesManagement" name="allowPurchasesManagement" class="rounded w-4 h-4 text-amber-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-boxes text-amber-400"></i> قسم المشتريات والموردين</div>
                  <div class="text-[10px] text-slate-400">فواتير التوريد، كشوف حسابات الموردين والمديونيات</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-indigo-500/40 transition">
                <input type="checkbox" [(ngModel)]="planForm.allowFinancialReports" name="allowFinancialReports" class="rounded w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-file-earmark-bar-graph text-indigo-400"></i> قسم التقارير المالية والأرباح P&L</div>
                  <div class="text-[10px] text-slate-400">صافي الأرباح، تقرير المبيعات والمصروفات</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-red-500/40 transition">
                <input type="checkbox" [(ngModel)]="planForm.allowBostaIntegration" name="allowBostaIntegration" class="rounded w-4 h-4 text-red-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-truck text-rose-400"></i> الربط الآلي مع بوسطة Bosta API</div>
                  <div class="text-[10px] text-slate-400">إرسال الطلبات آلياً ومزامنة الحالات وبوالص الشحن</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-emerald-500/40 transition">
                <input type="checkbox" [(ngModel)]="planForm.allowPayrollAndShifts" name="allowPayrollAndShifts" class="rounded w-4 h-4 text-emerald-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-cash-stack text-emerald-400"></i> قسم المرتبات والسلف والشيفتات</div>
                  <div class="text-[10px] text-slate-400">إدارة رواتب الموظفين والسلف المالية والشيفتات</div>
                </div>
              </label>

              <label class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50 cursor-pointer text-xs text-slate-200 hover:border-sky-500/40 transition sm:col-span-2 lg:col-span-3">
                <input type="checkbox" [(ngModel)]="planForm.isActive" name="isActive" class="rounded w-4 h-4 text-sky-500 bg-slate-800 border-slate-600" />
                <div>
                  <div class="font-bold flex items-center gap-1.5"><i class="bi bi-eye text-sky-400"></i> الباقة مفعلة وتظهر في الموقع للعملاء</div>
                  <div class="text-[10px] text-slate-400">إذا تم تعطيلها، لن تظهر في صفحة الأسعار أو موديل الترقية</div>
                </div>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="submit" class="btn btn-primary px-8 flex items-center gap-2 font-bold shadow-lg shadow-sky-600/20">
              <i class="bi bi-check-lg"></i>
              <span>{{ editingPlanId ? 'حفظ تعديلات الباقة 💾' : 'إنشاء الباقة ➕' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Current Plans List -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div *ngFor="let p of plans" class="glass-card p-5 border-slate-700/60 bg-slate-900/80 space-y-3 relative overflow-hidden">
          <div *ngIf="!p.isActive" class="absolute top-2 left-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
            معطلة 🚫
          </div>

          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h4 class="font-black text-slate-100 text-base">{{ p.name }}</h4>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold">{{ p.badge }}</span>
            </div>
            <button (click)="editPlan.emit(p)" class="btn btn-secondary btn-sm py-1 px-2.5 text-xs text-sky-400 flex items-center gap-1 font-bold border-slate-700 hover:border-sky-500">
              <i class="bi bi-pencil"></i> تعديل
            </button>
          </div>

          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex justify-between py-1 border-b border-slate-800/40">
              <span class="text-slate-400">السعر الشهري / السنوي:</span>
              <span class="font-bold text-emerald-400">{{ p.price }} ج.م / {{ p.annualOfferPrice }} ج.م</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">حسابات الموظفين:</span>
              <span class="font-bold" [class.text-emerald-400]="p.maxModerators > 0" [class.text-slate-500]="p.maxModerators === 0">{{ p.maxModerators > 0 ? (p.maxModerators > 100 ? 'غير محدود' : p.maxModerators + ' موظف') : 'معطل' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">الخزائن والمحافظ:</span>
              <span class="font-bold" [ngClass]="p.allowWalletsAndDeposits ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowWalletsAndDeposits ? 'مفعل ✅' : 'معطل ❌' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">المصروفات اليومية:</span>
              <span class="font-bold" [ngClass]="p.allowExpensesTracking ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowExpensesTracking ? 'مفعل ✅' : 'معطل ❌' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">المشتريات والموردين:</span>
              <span class="font-bold" [ngClass]="p.allowPurchasesManagement ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowPurchasesManagement ? 'مفعل ✅' : 'معطل ❌' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">التقارير المالية P&L:</span>
              <span class="font-bold" [ngClass]="p.allowFinancialReports ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowFinancialReports ? 'مفعل ✅' : 'معطل ❌' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">ربط بوسطة Bosta API:</span>
              <span class="font-bold" [ngClass]="p.allowBostaIntegration ? 'text-emerald-400' : 'text-slate-500'">{{ p.allowBostaIntegration ? 'مفعل ✅' : 'معطل ❌' }}</span>
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
