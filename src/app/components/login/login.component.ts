import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  loading = false;
  errorMessage = '';
  isStoreSuspended = false;
  isAccountDisabled = false;
  isInvalidCredentials = false;
  isDarkMode = true;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      this.isDarkMode = false;
      document.body.classList.add('light-mode');
    } else {
      this.isDarkMode = true;
      document.body.classList.remove('light-mode');
    }

    // Restore saved username if remember me was previously checked
    const savedUsername = localStorage.getItem('saved_username');
    if (savedUsername) {
      this.username = savedUsername;
      this.rememberMe = true;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  private normalizeArabicDigits(str: string): string {
    if (!str) return str;
    return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
              .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  }

  onSubmit(): void {
    const normalizedUsername = this.normalizeArabicDigits(this.username.trim());
    const normalizedPassword = this.normalizeArabicDigits(this.password.trim());

    if (!normalizedUsername || !normalizedPassword) {
      this.errorMessage = 'يرجى إدخال اسم المستخدم وكلمة المرور';
      this.isStoreSuspended = false;
      this.isAccountDisabled = false;
      this.isInvalidCredentials = true;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.isStoreSuspended = false;
    this.isAccountDisabled = false;
    this.isInvalidCredentials = false;

    // Save username if remember me is checked
    if (this.rememberMe) {
      localStorage.setItem('saved_username', normalizedUsername);
    } else {
      localStorage.removeItem('saved_username');
    }

    this.authService.login({ username: normalizedUsername, password: normalizedPassword }, this.rememberMe).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.isSuperAdmin) {
          this.router.navigate(['/super-admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        const msg = err?.error?.Message || err?.error?.message || err?.message || '';

        if (status === 0) {
          this.errorMessage = 'تعذر الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى.';
          return;
        }

        if (status === 403 || msg.includes('موقوف') || msg.includes('إيقاف') || msg.includes('المتجر')) {
          if (msg.includes('تعطيل هذا الحساب') || msg.includes('معطل')) {
            this.isAccountDisabled = true;
            this.errorMessage = msg || 'تم تعطيل هذا الحساب من قِبل إدارة المتجر. يرجى مراجعة المسؤول.';
          } else {
            this.isStoreSuspended = true;
            this.errorMessage = msg || 'تم إيقاف هذا المتجر حالياً من قِبل إدارة المنصة. يرجى التواصل مع الدعم الفني لتفعيل المتجر.';
          }
          return;
        }

        if (status === 401 || msg.includes('كلمة المرور') || msg.includes('اسم المستخدم')) {
          this.isInvalidCredentials = true;
          this.errorMessage = msg || 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مجدداً.';
          return;
        }

        this.errorMessage = msg || 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.';
      }
    });
  }
}
