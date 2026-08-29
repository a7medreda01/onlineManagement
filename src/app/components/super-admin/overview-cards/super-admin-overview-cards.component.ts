import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperAdminOverview } from '../../../models/models';

@Component({
  selector: 'app-super-admin-overview-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Overview Numbers -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <!-- Total Stores -->
        <div class="glass-card p-4 border-slate-700/60 bg-slate-900/80 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>إجمالي المتاجر</span>
            <i class="bi bi-shop text-sky-400 text-base"></i>
          </div>
          <div class="text-2xl font-black text-slate-100">{{ overview?.totalStoresCount || 0 }}</div>
          <div class="text-[11px] text-emerald-400 mt-1">{{ overview?.activeStoresCount || 0 }} متجر نشط</div>
        </div>

        <!-- Total Orders -->
        <div class="glass-card p-4 border-slate-700/60 bg-slate-900/80 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>أوردرات المنصة</span>
            <i class="bi bi-box-seam-fill text-indigo-400 text-base"></i>
          </div>
          <div class="text-2xl font-black text-indigo-400">{{ overview?.totalPlatformOrdersCount || 0 }}</div>
          <div class="text-[11px] text-slate-400 mt-1">على مدار تشغيل المنصة</div>
        </div>

        <!-- Total Subscriptions Count -->
        <div class="glass-card p-4 border-slate-700/60 bg-slate-900/80 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>إجمالي الاشتراكات</span>
            <i class="bi bi-award-fill text-amber-400 text-base"></i>
          </div>
          <div class="text-2xl font-black text-amber-400">{{ overview?.totalSubscriptionsCount || 0 }}</div>
          <div class="text-[11px] text-slate-400 mt-1">المتاجر والمشتركين</div>
        </div>

        <!-- Total Platform Revenue -->
        <div class="glass-card p-4 border-slate-700/60 bg-slate-900/80 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>أرباح واشتراكات المنصة</span>
            <i class="bi bi-cash-stack text-emerald-400 text-base"></i>
          </div>
          <div class="text-2xl font-black text-emerald-400">{{ overview?.totalPlatformRevenue || 0 | number:'1.0-0' }} <span class="text-xs font-normal">ج.م</span></div>
          <div class="text-[11px] text-emerald-300 mt-1">التحويلات المعتمدة</div>
        </div>

        <!-- Pending Requests -->
        <div class="glass-card p-4 border-slate-700/60 bg-slate-900/80 flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>طلبات التحويل المعلقة</span>
            <i class="bi bi-clock-history text-rose-400 text-base"></i>
          </div>
          <div class="text-2xl font-black text-rose-400">{{ overview?.pendingPaymentRequestsCount || 0 }}</div>
          <div class="text-[11px] text-slate-400 mt-1">تحتاج مراجعة وتفعيل</div>
        </div>

      </div>

      <!-- Plan Subscribers Breakdown Card -->
      <div *ngIf="overview?.planBreakdowns?.length" class="glass-card p-5 border-slate-700/60 bg-slate-900/80">
        <div class="flex items-center gap-2 mb-4">
          <i class="bi bi-pie-chart-fill text-sky-400"></i>
          <h2 class="text-sm font-bold text-slate-100">توزيع المشتركين وأرباح الباقات</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div *ngFor="let pb of overview?.planBreakdowns" class="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-slate-100 text-sm">{{ pb.planName }}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{{ pb.badge }}</span>
              </div>
              <div class="text-xs text-slate-400">
                السعر السنوي: <strong class="text-emerald-400">{{ pb.annualOfferPrice }} ج.م</strong> 
                <span *ngIf="pb.annualOfferPrice === 0" class="text-amber-400">(عرض مجاني)</span>
              </div>
            </div>

            <div class="text-right">
              <div class="text-xl font-black text-sky-400">{{ pb.subscribersCount }}</div>
              <div class="text-[11px] text-slate-400">{{ pb.percentage }}% من المتاجر</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminOverviewCardsComponent {
  @Input() overview: SuperAdminOverview | null = null;
}
