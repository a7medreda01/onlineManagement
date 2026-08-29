import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SaasService } from '../../../services/saas.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-super-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-cairo" dir="rtl">
      <div class="glass-card w-full max-w-md p-8 fade-in border-amber-500/30 bg-slate-900/95 shadow-2xl rounded-2xl">
        
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/40 text-3xl shadow-lg">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2 class="text-2xl font-black text-slate-100 mb-1">دخول SuperAdmin — Besnesy</h2>
          <p class="text-slate-400 text-xs">بوابة مالك ومطور المنصة فقط</p>
        </div>

        <!-- Info Warning Box for Merchants -->
        <div class="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs mb-6 space-y-1">
          <div class="font-bold flex items-center gap-1.5">
            <i class="bi bi-info-circle-fill text-amber-400"></i>
            <span>تنبيه هام للمتاجر:</span>
          </div>
          <p class="text-slate-300 leading-relaxed">
            هذه الشاشة خاصة بإدارة منصة Besnesy (<code class="text-amber-400 font-bold font-mono">superadmin</code>).
          </p>
          <div class="pt-1">
            <a routerLink="/login" class="text-sky-400 hover:underline font-bold text-xs">
              إذا كنت تاجر صاحب متجر، اضغط هنا لتسجيل الدخول ←
            </a>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
          <i class="bi bi-exclamation-octagon-fill"></i>
          <span>{{ errorMessage }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="form-group">
            <label class="form-label">اسم المستخدم (SuperAdmin Username)</label>
            <input type="text" [(ngModel)]="username" name="username" class="form-control" placeholder="superadmin" required />
          </div>

          <div class="form-group mb-6">
            <label class="form-label">كلمة المرور</label>
            <input type="password" [(ngModel)]="password" name="password" class="form-control" placeholder="••••••••" required />
          </div>

          <button type="submit" [disabled]="loading" class="btn btn-primary w-full py-3.5 text-base font-bold bg-gradient-to-r from-amber-600 to-indigo-600 shadow-lg flex items-center justify-center gap-2">
            <i *ngIf="loading" class="bi bi-arrow-repeat animate-spin"></i>
            <span *ngIf="!loading">تسجيل دخول SuperAdmin</span>
          </button>
        </form>
      </div>
    </div>
  `
})
export class SuperAdminLoginComponent {
  username = 'superadmin';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(private saasService: SaasService, private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'يرجى إدخال اسم المستخدم وكلمة المرور الخاصة بـ SuperAdmin';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.saasService.superAdminLogin({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('user_data', JSON.stringify(res));
        this.authService.currentUser.set(res);
        this.router.navigate(['/super-admin']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.Message || 'فشل تسجيل الدخول كـ SuperAdmin. يرجى التأكد من اسم المستخدم وكلمة المرور.';
      }
    });
  }
}
