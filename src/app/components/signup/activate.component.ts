import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SaasService } from '../../services/saas.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './activate.component.html'
})
export class ActivateComponent implements OnInit, OnDestroy {
  loading = true;
  success = false;
  pendingEmail = false;
  error = false;
  errorMessage = '';

  email = '';
  resendCooldown = 0;
  sendingResend = false;
  resendMessage = '';
  private timerInterval: any;

  constructor(private route: ActivatedRoute, private saasService: SaasService, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const emailParam = this.route.snapshot.queryParamMap.get('email');

    if (token) {
      this.saasService.activateStore(token).subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
        },
        error: () => {
          // If already activated or token used, still show success
          this.loading = false;
          this.success = true;
        }
      });
    } else {
      this.loading = false;
      this.success = true;
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resendActivation(): void {
    if (!this.email || this.resendCooldown > 0) return;

    this.sendingResend = true;
    this.resendMessage = '';

    this.saasService.resendToken(this.email).subscribe({
      next: () => {
        this.sendingResend = false;
        this.resendMessage = 'تم إعادة إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح!';
        this.startCooldownTimer(30);
      },
      error: (err: any) => {
        this.sendingResend = false;
        this.resendMessage = err?.error?.Message || 'فشل إعادة الإرسال. يرجى المحاولة لاحقاً.';
        this.startCooldownTimer(10);
      }
    });
  }

  private startCooldownTimer(seconds: number): void {
    this.resendCooldown = seconds;
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.timerInterval);
        this.resendCooldown = 0;
      }
    }, 1000);
  }
}
