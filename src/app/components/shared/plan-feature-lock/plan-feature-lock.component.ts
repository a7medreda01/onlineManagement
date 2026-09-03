import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-plan-feature-lock',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="glass-card max-w-xl mx-auto my-8 p-6 sm:p-8 text-center rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 shadow-2xl relative overflow-hidden font-cairo" dir="rtl">
      <div class="absolute -right-16 -top-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-16 -bottom-16 w-44 h-44 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Icon with orange badge -->
      <div class="relative w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400 text-3xl shadow-lg shadow-amber-950/40">
        <i class="bi bi-lock-fill"></i>
        <span class="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white text-xs flex items-center justify-center shadow">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 1.141a1 1 0 0 1 1.506 0l4.5 5.5A1 1 0 0 1 12.5 8.25h-9a1 1 0 0 1-.753-1.609l4.5-5.5z"/><path d="M2 10.5h12v1.5H2v-1.5zm0 3h12V15H2v-1.5z"/></svg>
        </span>
      </div>

      <h2 class="text-xl sm:text-2xl font-black text-slate-100 mb-2">
        ميزة مقفلة: {{ featureName }}
      </h2>

      <div class="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-3">
        <i class="bi bi-stars"></i>
        <span>متاحة في {{ requiredPlan }} فما فوق</span>
      </div>

      <p class="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed max-w-md mx-auto">
        {{ featureDescription || 'هذه الميزة غير مفعلة في باقتك الحالية. قم بترقية باقة متجرك الآن لتفعيلها فورياً والاستفادة من كافة خصائص ومميزات المنظومة.' }}
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button (click)="onUpgradeClick()" type="button"
                class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 cursor-pointer">
          <span>قم بترقية خطتك الآن</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 1.141a1 1 0 0 1 1.506 0l4.5 5.5A1 1 0 0 1 12.5 8.25h-9a1 1 0 0 1-.753-1.609l4.5-5.5z"/><path d="M2 10.5h12v1.5H2v-1.5zm0 3h12V15H2v-1.5z"/></svg>
        </button>

        <a routerLink="/pricing"
           class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
          <i class="bi bi-eye"></i>
          <span>استعراض الباقات والأسعار</span>
        </a>
      </div>
    </div>
  `
})
export class PlanFeatureLockComponent {
  @Input() featureName = '';
  @Input() requiredPlan = 'خطة قياسية';
  @Input() featureDescription = '';
  @Output() upgrade = new EventEmitter<string>();

  onUpgradeClick(): void {
    this.upgrade.emit(this.requiredPlan);
  }
}
