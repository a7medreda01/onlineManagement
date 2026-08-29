import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center p-4 font-cairo">
      <div class="glass-card max-w-md w-full p-8 text-center border-rose-500/30 bg-slate-900/90 shadow-2xl rounded-2xl relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400 text-3xl shadow-lg shadow-rose-950/40">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        
        <h2 class="text-xl font-black text-slate-100 mb-2">عفواً! ليس من صلاحياتك</h2>
        <p class="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          هذا القسم أو الإجراء مخصص لأدوار أخرى ولا يقع ضمن صلاحيات حسابك الحالية. إذا كنت بحاجة للوصول، يرجى التواصل مع مدير المتجر.
        </p>

        <div class="flex items-center justify-center gap-3">
          <a routerLink="/dashboard" class="btn btn-primary btn-sm py-2 px-5 flex items-center gap-2">
            <i class="bi bi-house-door"></i>
            <span>العودة للرئيسية</span>
          </a>
          <a routerLink="/profile" class="btn btn-secondary btn-sm py-2 px-4 flex items-center gap-2 border-slate-700">
            <i class="bi bi-person"></i>
            <span>ملفي الشخصي</span>
          </a>
        </div>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {}
