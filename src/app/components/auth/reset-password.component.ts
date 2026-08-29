import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  isDarkMode = true;

  constructor(private authService: AuthService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['email']) this.email = params['email'];
      if (params['token']) this.token = params['token'];
    });
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

  onSubmit(): void {
    if (!this.email || !this.token || !this.newPassword) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'كلمة المرور وتأكيدها غير متطابقين';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.Message || 'تم إعادة تعيين كلمة المرور بنجاح';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.Message || 'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية';
      }
    });
  }
}
