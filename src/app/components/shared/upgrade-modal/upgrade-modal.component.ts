import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
export class UpgradeModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() preselectedPlanName: string | null = null;
  @Input() set preselectedPlan(value: string | null) {
    if (value) this.preselectedPlanName = value;
  }
  get preselectedPlan(): string | null {
    return this.preselectedPlanName;
  }
  @Output() close = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() upgraded = new EventEmitter<void>();

  // Multi-step modal navigation (Step 1: اختيار الباقة والدورة, Step 2: بيانات الدفع والتحويل)
  currentStep = 1;

  isAnnual = false;
  selectedPlan: PlanOption | null = null;
  plans: PlanOption[] = [];
  loadingPlans = false;

  // Payment Form (Vodafone Cash & InstaPay)
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
      description: 'المميزات الأساسية بدون قيود، مناسبة للمشاريع الناشئة والصغيرة مدى الحياة',
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
      badge: 'الأكثر طلباً 🔥',
      description: 'الخزائن، المصروفات، المشتريات، التقارير المالية، وموظفين 2',
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
      name: 'خطة مميزة',
      badge: 'VIP شاملة 👑',
      description: 'كل المميزات بدون أي قيود، ربط بوسطة API، وموظفين غير محدود',
      price: 1000,
      annualPrice: 12000,
      annualOfferPrice: 10000,
      icon: 'bi-crown-fill',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderColor: 'border-amber-500/60'
    }
  ];

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.plans = [...this.defaultPlans];
    this.selectedPlan = this.plans[1]; // default standard
    this.transferTime = new Date().toISOString().slice(0, 16);
    this.loadPlansFromBackend();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      // Guard: Do not open upgrade modal if user is not logged in
      if (!this.authService.isLoggedIn()) {
        this.close.emit();
        this.closeModal.emit();
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        return;
      }
      this.currentStep = 1;
      this.submitSuccess = false;
      this.errorMessage = '';
      this.transferTime = new Date().toISOString().slice(0, 16);

      if (this.preselectedPlanName && this.plans.length > 0) {
        const found = this.plans.find(p => p.name.includes(this.preselectedPlanName!));
        if (found) this.selectedPlan = found;
      }
    }
  }

  loadPlansFromBackend(): void {
    this.loadingPlans = true;
    this.http.get<any[]>(`${environment.apiUrl}/plans`).subscribe({
      next: (data) => {
        this.loadingPlans = false;
        if (data && data.length > 0) {
          // Deduplicate by trimmed name
          const map = new Map<string, any>();
          data.filter(d => d.isActive).forEach(d => {
            const key = d.name.trim();
            if (!map.has(key) || d.id > map.get(key).id) {
              map.set(key, d);
            }
          });

          const uniqueList = Array.from(map.values()).sort((a, b) => a.price - b.price);

          this.plans = uniqueList.map((d, index) => {
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
          } else if (!this.selectedPlan) {
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

  goToStep2(): void {
    if (!this.selectedPlan) return;
    if (this.isFreePlan()) {
      this.submitUpgrade();
      return;
    }
    this.errorMessage = '';
    this.currentStep = 2;
  }

  goToStep1(): void {
    this.errorMessage = '';
    this.currentStep = 1;
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
      this.errorMessage = 'يرجى كتابة رقم الهاتف أو المحفظة المحول منها المبلغ';
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
        this.errorMessage = err?.error?.Message || 'حدث خطأ أثناء إرسال طلب الترقية. يرجى مراجعة الدعم الفني.';
      }
    });
  }

  onClose(): void {
    this.submitSuccess = false;
    this.errorMessage = '';
    this.currentStep = 1;
    this.close.emit();
    this.closeModal.emit();
  }
}
