import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UserProfile, UserRole } from '../../models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 font-cairo">
      
      <!-- Header Banner -->
      <div class="glass-card p-6 border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/40 relative overflow-hidden">
        <div class="absolute -left-10 -top-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          <!-- Avatar with Upload Button -->
          <div class="relative group">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-800 border-2 border-sky-500/40 overflow-hidden flex items-center justify-center shadow-xl shadow-sky-950/30">
              <img *ngIf="profile()?.avatarUrl" [src]="getAvatarFullUrl(profile()?.avatarUrl)" alt="Avatar" class="w-full h-full object-cover" />
              <div *ngIf="!profile()?.avatarUrl" class="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                {{ profile()?.fullName?.charAt(0) || 'U' }}
              </div>
            </div>
            
            <label class="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95">
              <i class="bi bi-camera-fill text-sm"></i>
              <input type="file" (change)="onAvatarSelected($event)" accept="image/*" class="hidden" />
            </label>
          </div>

          <!-- User Info Summary -->
          <div class="text-center md:text-right flex-1">
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h1 class="text-2xl font-black text-slate-100">{{ profile()?.fullName || 'الملف الشخصي' }}</h1>
              <span [ngClass]="getRoleBadgeClass(profile()?.role)" class="px-2.5 py-0.5 rounded-full text-xs font-bold border">
                {{ profile()?.roleName }}
              </span>
            </div>
            <p class="text-sm text-slate-400 mb-1 flex items-center justify-center md:justify-start gap-2">
              <i class="bi bi-shop text-sky-400"></i>
              <span>متجر: <strong class="text-slate-200">{{ profile()?.storeName }}</strong></span>
              <span class="text-slate-600">|</span>
              <i class="bi bi-person-badge text-slate-400"></i>
              <span>@{{ profile()?.username }}</span>
            </p>
            <p class="text-xs text-slate-500">
              عضو منذ: {{ profile()?.createdAt | date:'yyyy/MM/dd' }}
            </p>
          </div>

          <!-- Quick WhatsApp Support & Mobile Logout Action -->
          <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <a href="https://wa.me/201080225502?text=مرحباً، لدي استفسار بخصوص حسابي في نظام Besnesy" target="_blank" 
               class="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40">
              <i class="bi bi-whatsapp text-base"></i>
              <span>الدعم الفني والشكاوى</span>
            </a>

            <button (click)="logout()" class="btn bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg transition-colors">
              <i class="bi bi-box-arrow-right text-base"></i>
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Financial & Shift Summary Card (For All Staff / Managers) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- Net Salary Card -->
        <div class="glass-card p-5 border-slate-700/60 bg-slate-900/80 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">المرتب وصافي المستحق</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base">
              <i class="bi bi-cash-stack"></i>
            </div>
          </div>
          <div>
            <div class="text-2xl font-black text-emerald-400 mb-1">
              {{ profile()?.netPayableSalary | number:'1.2-2' }} <span class="text-xs font-normal text-slate-400">ج.م</span>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>المرتب الأساسي: {{ profile()?.baseSalary | number }} ج.م</span>
              <span class="text-sky-400">يوم النزول: {{ profile()?.salaryDueDay }} من كل شهر</span>
            </div>
          </div>
        </div>

        <!-- Advances & Deductions Card -->
        <div class="glass-card p-5 border-slate-700/60 bg-slate-900/80 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">السلف والخصومات</span>
            <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-base">
              <i class="bi bi-wallet2"></i>
            </div>
          </div>
          <div>
            <div class="text-2xl font-black" [ngClass]="(profile()?.currentAdvanceBalance || 0) > 0 ? 'text-rose-400' : 'text-slate-300'">
              - {{ profile()?.currentAdvanceBalance | number:'1.2-2' }} <span class="text-xs font-normal text-slate-400">ج.م (سلف)</span>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>الخصومات هذا الشهر: <strong class="text-rose-400">{{ profile()?.currentMonthDeductions | number }} ج.م</strong></span>
              <span>المكافآت: <strong class="text-emerald-400">+{{ profile()?.currentMonthBonuses | number }} ج.م</strong></span>
            </div>
          </div>
        </div>

        <!-- Shift & Target Card -->
        <div class="glass-card p-5 border-slate-700/60 bg-slate-900/80 relative overflow-hidden flex flex-col justify-between">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-slate-400">مواعيد الشيفت والمستهدف</span>
            <div class="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-base">
              <i class="bi bi-clock-history"></i>
            </div>
          </div>
          <div>
            <div class="text-sm font-bold text-slate-200 mb-1 flex items-center gap-2">
              <i class="bi bi-alarm text-sky-400"></i>
              <span>{{ profile()?.shiftStartTime || '09:00' }} — {{ profile()?.shiftEndTime || '17:00' }}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>مستهدف الأوردرات: <strong class="text-slate-200">{{ profile()?.shiftTargetOrders || 0 }} أوردر</strong></span>
              <span>بونص التارجت: <strong class="text-amber-400">{{ profile()?.shiftBonusAmount | number }} ج.م</strong></span>
            </div>
          </div>
        </div>

      </div>

      <!-- Settings Forms Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Personal Information Edit -->
        <div class="glass-card p-6 border-slate-700/60 bg-slate-900/80">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <i class="bi bi-person-lines-fill text-sky-400 text-lg"></i>
            <h3 class="text-base font-bold text-slate-100">تعديل البيانات الشخصية</h3>
          </div>

          <form (ngSubmit)="onUpdateProfile()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">الاسم بالكامل</label>
              <input type="text" [(ngModel)]="editForm.fullName" name="fullName" required class="input-glass w-full text-sm" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف</label>
              <input type="text" [(ngModel)]="editForm.phone" name="phone" class="input-glass w-full text-sm" placeholder="01xxxxxxxxx" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني (للقراءة فقط)</label>
              <input type="email" [value]="profile()?.email" disabled class="input-glass w-full text-sm bg-slate-950/40 text-slate-500 cursor-not-allowed" />
            </div>

            <div class="pt-2">
              <button type="submit" [disabled]="loadingUpdate()" class="btn btn-primary btn-sm py-2 px-6 w-full flex items-center justify-center gap-2">
                <i *ngIf="loadingUpdate()" class="bi bi-arrow-repeat animate-spin"></i>
                <i *ngIf="!loadingUpdate()" class="bi bi-check-lg"></i>
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password Form -->
        <div class="glass-card p-6 border-slate-700/60 bg-slate-900/80">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <i class="bi bi-shield-lock text-amber-400 text-lg"></i>
            <h3 class="text-base font-bold text-slate-100">تغيير كلمة المرور</h3>
          </div>

          <form (ngSubmit)="onChangePassword()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور الحالية</label>
              <input type="password" [(ngModel)]="passwordForm.currentPassword" name="currentPassword" required class="input-glass w-full text-sm" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور الجديدة (6 أحرف على الأقل)</label>
              <input type="password" [(ngModel)]="passwordForm.newPassword" name="newPassword" required minlength="6" class="input-glass w-full text-sm" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
              <input type="password" [(ngModel)]="passwordForm.confirmPassword" name="confirmPassword" required minlength="6" class="input-glass w-full text-sm" />
            </div>

            <div class="pt-2">
              <button type="submit" [disabled]="loadingPassword()" class="btn bg-amber-600 hover:bg-amber-500 text-white btn-sm py-2 px-6 w-full flex items-center justify-center gap-2">
                <i *ngIf="loadingPassword()" class="bi bi-arrow-repeat animate-spin"></i>
                <i *ngIf="!loadingPassword()" class="bi bi-key-fill"></i>
                <span>تحديث كلمة المرور</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      <!-- Suggestions & WhatsApp Direct Support Section -->
      <div class="glass-card p-6 border-slate-700/60 bg-slate-900/80">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl">
              <i class="bi bi-chat-dots-fill"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-100">نظام الاقتراحات والشكاوى المباشر</h3>
              <p class="text-xs text-slate-400">يسعدنا دائماً سماع رأيك ومقترحاتك لتطوير المنصة، أو تقديم شكوى فورية لفريق الإدارة والدعم الفني.</p>
            </div>
          </div>

          <a href="https://wa.me/201080225502" target="_blank" class="btn bg-emerald-600 hover:bg-emerald-500 text-white btn-sm py-2 px-4 flex items-center gap-2 whitespace-nowrap">
            <i class="bi bi-whatsapp"></i>
            <span>01080225502</span>
          </a>
        </div>

        <div class="mt-4">
          <label class="block text-xs font-semibold text-slate-300 mb-2">اكتب استفسارك أو اقتراحك أو الشكوى وسنقوم بتحويلك مباشرة للواتساب:</label>
          <div class="flex flex-col sm:flex-row gap-3">
            <textarea [(ngModel)]="suggestionText" rows="2" class="input-glass flex-1 text-sm resize-none" placeholder="اكتب رسالتك أو مشكلتك هنا..."></textarea>
            <button (click)="sendWhatsAppMessage()" class="btn bg-emerald-600 hover:bg-emerald-500 text-white px-6 flex items-center justify-center gap-2 shrink-0">
              <i class="bi bi-send-fill"></i>
              <span>إرسال عبر واتساب</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ProfileComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  
  editForm = {
    fullName: '',
    phone: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  suggestionText = '';
  loadingUpdate = signal<boolean>(false);
  loadingPassword = signal<boolean>(false);

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.profile.set(res);
        this.editForm.fullName = res.fullName;
        this.editForm.phone = res.phone;
      },
      error: (err) => console.error(err)
    });
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.profileService.uploadAvatar(file).subscribe({
      next: (res) => {
        this.profileService.updateProfile({
          fullName: this.editForm.fullName,
          phone: this.editForm.phone,
          avatarUrl: res.relativeUrl
        }).subscribe({
          next: () => this.loadProfile(),
          error: (err) => alert(err.error?.message || 'حدث خطأ أثناء حفظ الصورة الشخصية')
        });
      },
      error: (err) => alert(err.error?.message || 'فشل رفع الصورة')
    });
  }

  onUpdateProfile(): void {
    this.loadingUpdate.set(true);
    this.profileService.updateProfile({
      fullName: this.editForm.fullName,
      phone: this.editForm.phone
    }).subscribe({
      next: () => {
        this.loadingUpdate.set(false);
        alert('تم حفظ البيانات الشخصية بنجاح');
        this.loadProfile();
      },
      error: (err) => {
        this.loadingUpdate.set(false);
        alert(err.error?.message || 'فشل تحديث البيانات');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      alert('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    this.loadingPassword.set(true);
    this.profileService.changePassword({
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.loadingPassword.set(false);
        alert('تم تغيير كلمة المرور بنجاح');
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.loadingPassword.set(false);
        alert(err.error?.message || 'فشل تغيير كلمة المرور');
      }
    });
  }

  sendWhatsAppMessage(): void {
    if (!this.suggestionText.trim()) {
      alert('يرجى كتابة نص الرسالة أولاً');
      return;
    }
    const store = this.profile()?.storeName || '';
    const name = this.profile()?.fullName || '';
    const text = encodeURIComponent(`مرحباً دعم Besnesy، أنا ${name} (متجر: ${store}):\n${this.suggestionText}`);
    window.open(`https://wa.me/201080225502?text=${text}`, '_blank');
    this.suggestionText = '';
  }

  getRoleBadgeClass(role?: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case UserRole.Manager:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case UserRole.FinancialManager:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case UserRole.Moderator:
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  }

  getAvatarFullUrl(avatarUrl?: string): string {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `${environment.apiBaseUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
  }
}
