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
  requiresActivation = false;
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
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.requiresActivation = false;

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
        const msg = err?.error?.Message || 'فشل تسجيل الدخول. اسم المستخدم أو كلمة المرور غير صحيحة.';
        this.errorMessage = msg;

        if (msg.includes('تفعيل') || msg.includes('تأكيد')) {
          this.requiresActivation = true;
          setTimeout(() => {
            this.router.navigate(['/activate-account'], { queryParams: { email: normalizedUsername } });
          }, 1800);
        }
      }
    });
  }
}
