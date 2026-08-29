import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SaasService } from '../../services/saas.service';
import { Plan } from '../../models/models';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit {
  step = 1; // 1: Details, 2: Plan Selection, 3: Success / Payment / Activation

  ownerName = '';
  storeName = '';
  email = '';
  phone = '';
  password = '';

  plans = signal<Plan[]>([]);
  selectedPlanId: number | null = null;
  selectedPlan: Plan | null = null;

  loading = false;
  registered = false;
  showPaymentStep = false;
  activationToken = '';
  errorMessage = '';
  resending = false;
  isDarkMode = true;

  // InstaPay / Vodafone Cash Form
  paymentForm = {
    senderPhone: '',
    amount: 0,
    referenceNumber: '',
    notes: ''
  };
  submittingPayment = signal<boolean>(false);
  paymentSubmitted = false;

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

    this.loadPlans();
  }

  loadPlans(): void {
    this.saasService.getPlans().subscribe({
      next: (res) => {
        const active = res.filter(p => p.isActive);
        this.plans.set(active);
        if (active.length > 0) {
          const defaultPlan = active.find(p => p.price === 0 || p.annualOfferPrice === 0) || active[0];
          this.selectPlan(defaultPlan);
        }
      },
      error: (err) => console.error(err)
    });
  }

  selectPlan(plan: Plan): void {
    this.selectedPlanId = plan.id;
    this.selectedPlan = plan;
    this.paymentForm.amount = plan.annualOfferPrice;
  }

  goToStep2(): void {
    if (!this.ownerName || !this.storeName || !this.email || !this.phone || !this.password) {
      this.errorMessage = 'يرجى استكمال جميع البيانات الأساسية المطلوبة';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'كلمة المرور يجب أن لا تقل عن 8 أحرف';
      return;
    }
    this.errorMessage = '';
    this.step = 2;
  }

  goToStep1(): void {
    this.step = 1;
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
      this.step = 1;
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.saasService.registerStore({
      ownerName: this.ownerName,
      storeName: this.storeName,
      email: this.email,
      phone: this.phone,
      password: this.password,
      selectedPlanId: this.selectedPlanId || undefined
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.registered = true;
        this.step = 3;
        this.activationToken = res.activationToken;

        if (this.selectedPlan && this.selectedPlan.annualOfferPrice > 0) {
          this.showPaymentStep = true;
          this.paymentForm.senderPhone = this.phone;
          this.paymentForm.amount = this.selectedPlan.annualOfferPrice;
        } else {
          this.showPaymentStep = false;
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.Message || 'حدث خطأ أثناء إنشاء المتجر';
      }
    });
  }

  onSubmitInstaPay(): void {
    if (!this.paymentForm.senderPhone || this.paymentForm.amount <= 0) {
      alert('يرجى كتابة رقم الهاتف المحول منه وقيمة المبلغ');
      return;
    }

    this.submittingPayment.set(true);
    this.saasService.submitPaymentRequest({
      planId: this.selectedPlanId || 0,
      senderPhone: this.paymentForm.senderPhone,
      amount: this.paymentForm.amount,
      referenceNumber: this.paymentForm.referenceNumber,
      notes: this.paymentForm.notes
    }).subscribe({
      next: () => {
        this.submittingPayment.set(false);
        this.paymentSubmitted = true;
      },
      error: (err) => {
        this.submittingPayment.set(false);
        alert(err?.error?.Message || 'حدث خطأ أثناء إرسال تفاصيل التحويل');
      }
    });
  }

  resendToken(): void {
    this.resending = true;
    this.saasService.resendToken(this.email).subscribe({
      next: (res) => {
        this.resending = false;
        this.activationToken = res.activationToken;
        alert('تم إعادة إرسال رابط التفعيل إلى بريدك الإلكتروني بنجاح!');
      },
      error: (err) => {
        this.resending = false;
        alert(err?.error?.Message || 'خطأ أثناء إعادة الإرسال');
      }
    });
  }
}
