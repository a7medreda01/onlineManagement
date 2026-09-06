import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-super-admin-toolbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Sticky Top Header (Visible only on mobile lg:hidden) -->
    <header class="lg:hidden sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-xl">
      <div class="flex items-center gap-3">
        <button (click)="mobileMenuOpen = !mobileMenuOpen" class="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700">
          <i class="bi" [ngClass]="mobileMenuOpen ? 'bi-x-lg text-rose-400' : 'bi-list text-sky-400'"></i>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <span class="font-black text-slate-100 text-sm">Besnesy SuperAdmin</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button (click)="refresh.emit()" [disabled]="loading" class="btn btn-secondary btn-sm p-1.5 text-xs text-sky-400 border-slate-700">
          <i class="bi bi-arrow-clockwise" [class.animate-spin]="loading"></i>
        </button>
        <button (click)="logout.emit()" class="btn bg-rose-500/20 text-rose-300 border border-rose-500/30 btn-sm p-1.5 text-xs">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </header>

    <!-- Mobile Drawer Overlay & Sidebar (Visible on Mobile when Opened) -->
    <div *ngIf="mobileMenuOpen" class="lg:hidden fixed inset-0 z-50 flex">
      <div (click)="mobileMenuOpen = false" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      <aside class="relative w-72 h-full bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto mr-auto rtl:mr-0 rtl:ml-auto">
        <!-- Reusable Sidebar Content -->
        <ng-container *ngTemplateOutlet="sidebarContent"></ng-container>
      </aside>
    </div>

    <!-- Permanent Desktop Lateral Sidebar Toolbar (Visible on Desktop lg:flex) -->
    <aside class="hidden lg:flex flex-col justify-between w-72 shrink-0 h-screen sticky top-0 bg-slate-900/95 border-l border-slate-800/80 p-4 shadow-2xl backdrop-blur-xl z-30 overflow-y-auto">
      <ng-container *ngTemplateOutlet="sidebarContent"></ng-container>
    </aside>

    <!-- Shared Sidebar Content Template -->
    <ng-template #sidebarContent>
      <div class="space-y-5">
        
        <!-- Logo & SuperAdmin Badge -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-950/60 shrink-0">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h2 class="font-black text-slate-100 text-base truncate leading-tight">Besnesy</h2>
                <span class="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">SuperAdmin</span>
              </div>
              <p class="text-[11px] text-slate-400 truncate">لوحة التحكم والإدارة المركزية</p>
            </div>
          </div>
          <button (click)="mobileMenuOpen = false" class="lg:hidden text-slate-400 hover:text-white p-1">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Quick Platform Stats Widget Box -->
        <div class="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs shadow-inner">
          <div class="flex items-center justify-between text-slate-400">
            <span class="flex items-center gap-1.5"><i class="bi bi-shop text-sky-400"></i> المتاجر المسجلة:</span>
            <strong class="text-white font-mono font-bold text-sm">{{ totalStores }}</strong>
          </div>
          <div (click)="selectTab('requests')" class="flex items-center justify-between text-slate-400 cursor-pointer hover:text-rose-300 transition py-0.5">
            <span class="flex items-center gap-1.5"><i class="bi bi-credit-card text-emerald-400"></i> الطلبات المعلقة:</span>
            <div class="flex items-center gap-1.5">
              <strong class="font-mono font-bold text-sm" [class.text-rose-400]="pendingRequests > 0" [class.text-slate-200]="pendingRequests === 0">{{ pendingRequests }}</strong>
              <span *ngIf="pendingRequests > 0" class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            </div>
          </div>
          <div class="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80">
            <span class="flex items-center gap-1.5"><i class="bi bi-cash-stack text-emerald-400"></i> إجمالي الإيرادات:</span>
            <strong class="text-emerald-400 font-mono font-bold text-sm">{{ totalRevenue | number:'1.0-0' }} ج.م</strong>
          </div>
        </div>

        <!-- Lateral Toolbar Pages Navigation Links -->
        <div class="space-y-1.5 pt-1">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3">أدوات وبوابات الإدارة</span>
          
          <!-- Button 1: Stores Manager -->
          <button (click)="selectTab('stores')"
                  [ngClass]="activeTab === 'stores' ? 'bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-950/50 font-bold border-sky-400/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent'"
                  class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all duration-200 border group">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                   [ngClass]="activeTab === 'stores' ? 'bg-white/20 text-white' : 'bg-slate-800 text-sky-400 group-hover:bg-slate-700'">
                <i class="bi bi-shop"></i>
              </div>
              <div class="text-right">
                <div class="font-bold">المتاجر والاشتراكات</div>
                <div class="text-[10px] opacity-75 font-normal">إدارة وتمديد حسابات المتجر</div>
              </div>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-950/60 text-slate-300 border border-slate-700/60">{{ totalStores }}</span>
          </button>

          <!-- Button 2: InstaPay Requests -->
          <button (click)="selectTab('requests')"
                  [ngClass]="activeTab === 'requests' ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/50 font-bold border-emerald-400/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent'"
                  class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all duration-200 border group relative">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                   [ngClass]="activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400 group-hover:bg-slate-700'">
                <i class="bi bi-credit-card-fill"></i>
              </div>
              <div class="text-right">
                <div class="font-bold">طلبات التحويل والمعاملات</div>
                <div class="text-[10px] opacity-75 font-normal">مراجعة وتحويلات InstaPay</div>
              </div>
            </div>
            <span *ngIf="pendingRequests > 0" class="px-2 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-mono font-bold animate-pulse">{{ pendingRequests }} معلق</span>
          </button>

          <!-- Button 3: Plans Manager -->
          <button (click)="selectTab('plans')"
                  [ngClass]="activeTab === 'plans' ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-950/50 font-bold border-indigo-400/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent'"
                  class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all duration-200 border group">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                   [ngClass]="activeTab === 'plans' ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400 group-hover:bg-slate-700'">
                <i class="bi bi-sliders"></i>
              </div>
              <div class="text-right">
                <div class="font-bold">إدارة وتخصيص الباقات</div>
                <div class="text-[10px] opacity-75 font-normal">عرض وتفعيل وتعديل الباقات</div>
              </div>
            </div>
            <i class="bi bi-chevron-left text-[10px] text-slate-500"></i>
          </button>

          <!-- Button 4: Broadcast Email -->
          <button (click)="selectTab('email')"
                  [ngClass]="activeTab === 'email' ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white shadow-lg shadow-amber-950/50 font-bold border-amber-400/50' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent'"
                  class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs transition-all duration-200 border group">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                   [ngClass]="activeTab === 'email' ? 'bg-white/20 text-white' : 'bg-slate-800 text-amber-400 group-hover:bg-slate-700'">
                <i class="bi bi-envelope-fill"></i>
              </div>
              <div class="text-right">
                <div class="font-bold">حملات الإيميل الجماعية</div>
                <div class="text-[10px] opacity-75 font-normal">إرسال العروض والتحديثات للمتاجر</div>
              </div>
            </div>
            <i class="bi bi-chevron-left text-[10px] text-slate-500"></i>
          </button>

        </div>

      </div>

      <!-- Bottom Toolbar Footer Actions -->
      <div class="pt-4 mt-6 border-t border-slate-800 space-y-2">
        <button (click)="refresh.emit()" [disabled]="loading" class="w-full btn btn-secondary btn-sm py-2 px-3 text-xs text-sky-400 border-slate-700 hover:border-sky-500 flex items-center justify-center gap-2 font-bold transition">
          <i class="bi bi-arrow-clockwise text-sm" [class.animate-spin]="loading"></i>
          <span>تحديث كافة البيانات</span>
        </button>

        <div class="flex items-center gap-2 pt-1">
          <a routerLink="/" target="_blank" class="flex-1 btn btn-secondary btn-sm py-2 px-2 text-xs text-slate-300 border-slate-700 hover:border-slate-500 flex items-center justify-center gap-1.5">
            <i class="bi bi-box-arrow-up-right text-[10px]"></i>
            <span>الموقع الرئيسي</span>
          </a>
          <button (click)="logout.emit()" class="btn bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 btn-sm py-2 px-3 flex items-center gap-1.5 font-bold text-xs transition">
            <i class="bi bi-box-arrow-right"></i>
            <span>خروج</span>
          </button>
        </div>
      </div>
    </ng-template>
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

  mobileMenuOpen = false;

  selectTab(tab: 'stores' | 'requests' | 'plans' | 'email'): void {
    this.tabChange.emit(tab);
    this.mobileMenuOpen = false;
  }
}
