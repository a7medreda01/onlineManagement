import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-super-admin-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="glass-card bg-slate-900/95 border-slate-700/80 sticky top-0 z-40 shadow-xl backdrop-blur-md px-4 py-3 rounded-2xl">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        <!-- Right Section: Logo, Title, and SuperAdmin Badge -->
        <div class="flex items-center justify-between sm:justify-start gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white text-lg shadow-md shadow-indigo-950/40 shrink-0">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-slate-100 text-sm sm:text-base leading-tight">Besnesy SuperAdmin</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">الإدارة المركزية</span>
              </div>
              <span class="text-[11px] text-slate-400 hidden sm:block">إدارة المتاجر والاشتراكات والباقات والحسابات</span>
            </div>
          </div>

          <!-- Mobile Action Quick Buttons -->
          <div class="flex items-center gap-2 lg:hidden">
            <button (click)="refresh.emit()" [disabled]="loading" class="btn btn-secondary btn-sm p-1.5 text-xs text-sky-400 border-slate-700" title="تحديث البيانات">
              <i class="bi bi-arrow-clockwise" [class.animate-spin]="loading"></i>
            </button>
            <button (click)="logout.emit()" class="btn bg-rose-500/20 text-rose-300 border border-rose-500/30 btn-sm p-1.5 text-xs" title="خروج">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- Center Section: Quick Stats Pills -->
        <div class="flex items-center gap-2 overflow-x-auto py-1 sm:py-0 text-xs no-scrollbar">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 shrink-0">
            <i class="bi bi-shop text-sky-400"></i>
            <span>المتاجر:</span>
            <strong class="text-white font-mono">{{ totalStores }}</strong>
          </div>

          <div (click)="tabChange.emit('requests')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl cursor-pointer transition shrink-0"
               [ngClass]="pendingRequests > 0 ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30' : 'bg-slate-800/80 border border-slate-700 text-slate-300'">
            <i class="bi bi-credit-card text-emerald-400"></i>
            <span>الطلبات المعلقة:</span>
            <strong class="font-mono" [class.text-rose-300]="pendingRequests > 0" [class.text-white]="pendingRequests === 0">{{ pendingRequests }}</strong>
            <span *ngIf="pendingRequests > 0" class="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-0.5"></span>
          </div>

          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 shrink-0">
            <i class="bi bi-cash-stack text-emerald-400"></i>
            <span>الإيرادات:</span>
            <strong class="text-emerald-400 font-mono">{{ totalRevenue | number:'1.0-0' }} ج.م</strong>
          </div>
        </div>

        <!-- Left Section: Navigation Tabs & Actions -->
        <div class="flex items-center justify-between sm:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          
          <!-- Navigation Tabs Switcher -->
          <div class="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button (click)="tabChange.emit('stores')"
                    [ngClass]="activeTab === 'stores' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0">
              <i class="bi bi-shop"></i>
              <span>المتاجر</span>
            </button>

            <button (click)="tabChange.emit('requests')"
                    [ngClass]="activeTab === 'requests' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 relative">
              <i class="bi bi-credit-card-fill"></i>
              <span>الطلبات</span>
              <span *ngIf="pendingRequests > 0" class="px-1 text-[9px] rounded-full bg-rose-500 text-white font-mono font-bold">{{ pendingRequests }}</span>
            </button>

            <button (click)="tabChange.emit('plans')"
                    [ngClass]="activeTab === 'plans' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0">
              <i class="bi bi-sliders"></i>
              <span>الباقات</span>
            </button>

            <button (click)="tabChange.emit('email')"
                    [ngClass]="activeTab === 'email' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0">
              <i class="bi bi-envelope-fill"></i>
              <span>حملات</span>
            </button>
          </div>

          <!-- Desktop Quick Actions -->
          <div class="hidden lg:flex items-center gap-2">
            <button (click)="refresh.emit()" [disabled]="loading" class="btn btn-secondary btn-sm py-1.5 px-3 text-xs text-sky-400 border-slate-700 flex items-center gap-1 font-bold" title="تحديث البيانات">
              <i class="bi bi-arrow-clockwise" [class.animate-spin]="loading"></i>
              <span>تحديث</span>
            </button>

            <a routerLink="/" target="_blank" class="btn btn-secondary btn-sm py-1.5 px-3 text-xs text-slate-300 border-slate-700 flex items-center gap-1" title="معاينة الواجهة">
              <i class="bi bi-box-arrow-up-right text-[10px]"></i>
              <span>الموقع</span>
            </a>

            <button (click)="logout.emit()" class="btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs py-1.5 px-3 flex items-center gap-1 font-bold">
              <i class="bi bi-box-arrow-right"></i>
              <span>خروج</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  `
})
export class SuperAdminToolbarComponent {
  @Input() activeTab: 'stores' | 'requests' | 'plans' | 'email' = 'stores';
  @Input() totalStores = 0;
  @Input() pendingRequests = 0;
  @Input() totalRevenue = 0;
  @Input() loading = false;

  @Output() tabChange = new EventEmitter<'stores' | 'requests' | 'plans' | 'email'>();
  @Output() refresh = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
}
