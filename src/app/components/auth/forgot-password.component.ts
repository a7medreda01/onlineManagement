import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  generatedToken = '';
  isDarkMode = true;

  constructor(private authService: AuthService, private router: Router) {}

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
    if (!this.email) {
      this.errorMessage = 'يرجى إدخال البريد الإلكتروني';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.Message || 'تم إنشاء رمز التعيين بنجاح';
        this.generatedToken = res.ResetToken || '';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.Message || 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني';
      }
    });
  }
}
