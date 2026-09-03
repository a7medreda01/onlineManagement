import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

export interface PlanOption {
  id: number;
  name: string;
  badge: string;
  description: string;
  price: number;
  annualPrice: number;
  annualOfferPrice: number;
  icon: string;
  color: string;
  badgeBg: string;
  borderColor: string;
}

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upgrade-modal.component.html'
})
export class UpgradeModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() preselectedPlanName: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() upgraded = new EventEmitter<void>();

  isAnnual = false;
  selectedPlan: PlanOption | null = null;
  plans: PlanOption[] = [];
  loadingPlans = false;

  // Payment Form
  paymentNumber = '01148472670';
  copiedNumber = false;
  senderPhone = '';
  transferTime = '';
  referenceNumber = '';
  notes = '';

  submitting = false;
  submitSuccess = false;
  errorMessage = '';

  defaultPlans: PlanOption[] = [
    {
      id: 1,
      name: 'خطة مجانية',
      badge: 'مجاناً',
      description: 'المميزات الأساسية بدون قيود، مناسبة للمشاريع الصغيرة مدى الحياة',
      price: 0,
      annualPrice: 0,
      annualOfferPrice: 0,
      icon: 'bi-flower1',
      color: 'text-slate-300',
      badgeBg: 'bg-slate-700/50 text-slate-200 border-slate-600',
      borderColor: 'border-slate-700/70'
    },
    {
      id: 2,
      name: 'خطة قياسية',
      badge: 'الأكثر طلباً',
      description: 'مميزات متقدمة، حسابات موظفين، ودعم فني للمشاريع المتنامية',
      price: 400,
      annualPrice: 4800,
      annualOfferPrice: 4000,
      icon: 'bi-award-fill',
      color: 'text-teal-400',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      borderColor: 'border-teal-500/60'
    },
    {
      id: 3,
      name: 'خطة متقدمة',
      badge: 'متقدمة',
      description: 'تقارير مالية متقدمة وخصائص متعددة تلائم المشاريع المتوسطة',
      price: 750,
      annualPrice: 9000,
      annualOfferPrice: 7500,
      icon: 'bi-shield-fill-check',
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      borderColor: 'border-purple-500/60'
    },
    {
      id: 4,
      name: 'خطة مميزة',
      badge: 'VIP شاملة',
      description: 'كل المميزات بدون أي قيود، وحسابات موظفين لا نهائية للمشاريع الكبيرة',
      price: 1250,
      annualPrice: 15000,
      annualOfferPrice: 12500,
      icon: 'bi-crown-fill',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderColor: 'border-amber-500/60'
    }
  ];

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.plans = [...this.defaultPlans];
    this.selectedPlan = this.plans[1]; // default standard
    this.transferTime = new Date().toISOString().slice(0, 16);
    this.loadPlansFromBackend();
  }

  loadPlansFromBackend(): void {
    this.loadingPlans = true;
    this.http.get<any[]>(`${environment.apiUrl}/plans`).subscribe({
      next: (data) => {
        this.loadingPlans = false;
        if (data && data.length > 0) {
          this.plans = data.map((d, index) => {
            const fallback = this.defaultPlans[index] || this.defaultPlans[0];
            return {
              id: d.id,
              name: d.name,
              badge: d.badge || fallback.badge,
              description: d.description || fallback.description,
              price: d.price,
              annualPrice: d.annualPrice || d.price * 12,
              annualOfferPrice: d.annualOfferPrice > 0 ? d.annualOfferPrice : (d.annualPrice || d.price * 10),
              icon: fallback.icon,
              color: fallback.color,
              badgeBg: fallback.badgeBg,
              borderColor: fallback.borderColor
            };
          });

          if (this.preselectedPlanName) {
            const found = this.plans.find(p => p.name.includes(this.preselectedPlanName!));
            if (found) this.selectedPlan = found;
          } else {
            this.selectedPlan = this.plans.find(p => p.price > 0) || this.plans[0];
          }
        }
      },
      error: () => {
        this.loadingPlans = false;
      }
    });
  }

  selectPlan(plan: PlanOption): void {
    this.selectedPlan = plan;
    this.errorMessage = '';
  }

  getAmount(): number {
    if (!this.selectedPlan) return 0;
    if (this.isAnnual) {
      return this.selectedPlan.annualOfferPrice > 0 ? this.selectedPlan.annualOfferPrice : this.selectedPlan.annualPrice;
    }
    return this.selectedPlan.price;
  }

  isFreePlan(): boolean {
    return this.getAmount() === 0;
  }

  copyNumber(): void {
    navigator.clipboard.writeText(this.paymentNumber).then(() => {
      this.copiedNumber = true;
      setTimeout(() => this.copiedNumber = false, 2500);
    });
  }

  submitUpgrade(): void {
    if (!this.selectedPlan) return;

    if (!this.isFreePlan() && !this.senderPhone.trim()) {
      this.errorMessage = 'يرجى كتابة رقم الهاتف أو الحساب المحول منه المبلغ';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const payload = {
      planId: this.selectedPlan.id,
      billingCycle: this.isAnnual ? 'Yearly' : 'Monthly',
      senderPhone: this.senderPhone.trim() || 'ترقية مجانية',
      amount: this.getAmount(),
      transferDate: this.transferTime ? new Date(this.transferTime) : new Date(),
      referenceNumber: this.referenceNumber.trim() || null,
      notes: this.notes.trim() || null
    };

    this.http.post(`${environment.apiUrl}/plans/upgrade-request`, payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitSuccess = true;
        this.upgraded.emit();
        // Refresh token / subscription in auth service
        this.authService.refreshToken().subscribe({ error: () => {} });
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.Message || 'حدث خطأ أثناء إرسال طلب الترقية. يرجى مراجعة الدعم.';
      }
    });
  }

  onClose(): void {
    this.submitSuccess = false;
    this.errorMessage = '';
    this.close.emit();
  }
}
