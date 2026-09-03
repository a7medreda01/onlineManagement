import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SaasService } from '../../services/saas.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit {
  step = 1; // 1: Details, 2: Success / Activation

  ownerName = '';
  storeName = '';
  email = '';
  phone = '';
  password = '';

  loading = false;
  registered = false;
  activationToken = '';
  errorMessage = '';
  resending = false;
  isDarkMode = true;

  constructor(private saasService: SaasService, private router: Router) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      this.isDarkMode = false;
      document.body.classList.add('light-mode');
    } else {
      this.isDarkMode = true;
      document.body.classList.remove('light-mode');
    }
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
    this.ownerName = this.ownerName.trim();
    this.storeName = this.storeName.trim();
    this.email = this.email.trim();
    this.phone = this.normalizeArabicDigits(this.phone.trim());
    this.password = this.normalizeArabicDigits(this.password.trim());

    if (!this.ownerName || !this.storeName || !this.email || !this.phone || !this.password) {
      this.errorMessage = 'يرجى استكمال جميع البيانات المطلوبة';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'كلمة المرور يجب ألا تقل عن 8 أحرف';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.saasService.registerStore({
      ownerName: this.ownerName,
      storeName: this.storeName,
      email: this.email,
      phone: this.phone,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.registered = true;
        this.step = 2;
        this.activationToken = res.activationToken;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.Message || 'حدث خطأ أثناء إنشاء المتجر. يرجى المحاولة مرة أخرى.';
      }
    });
  }

  resendToken(): void {
    if (!this.email) return;
    this.resending = true;
    this.saasService.resendToken(this.email).subscribe({
      next: (res) => {
        this.resending = false;
        this.activationToken = res.activationToken;
        alert('تم إرسال رابط التفعيل الجديد إلى بريدك الإلكتروني بنجاح!');
      },
      error: (err) => {
        this.resending = false;
        alert(err?.error?.Message || 'خطأ أثناء إعادة إرسال الرابط');
      }
    });
  }
}
