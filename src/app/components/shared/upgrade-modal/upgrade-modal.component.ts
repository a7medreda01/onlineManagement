import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { SubscriptionDetails } from '../../../models/models';

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

  // Current Subscription
  currentSub: SubscriptionDetails | null = null;
  loadingSubscription = false;

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
    this.transferTime = new Date().toISOString().slice(0, 16);
    this.loadCurrentSubscription();
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
      this.loadCurrentSubscription();
      this.autoSelectAppropriatePlan();
    }
  }

  loadCurrentSubscription(): void {
    if (!this.authService.isLoggedIn()) return;
    this.currentSub = this.authService.currentSubscription();
    this.loadingSubscription = true;
    this.authService.getSubscriptionDetails().subscribe({
      next: (sub) => {
        this.currentSub = sub;
        this.loadingSubscription = false;
        this.autoSelectAppropriatePlan();
      },
      error: () => {
        this.currentSub = this.authService.currentSubscription();
        this.loadingSubscription = false;
        this.autoSelectAppropriatePlan();
      }
    });
  }

  getPlanTier(plan: { price?: number; name?: string; planName?: string } | null | undefined): number {
    if (!plan) return 1;
    const name = (plan.planName || plan.name || '').toLowerCase();
    const price = plan.price ?? 0;
    if (price >= 1000 || name.includes('مميزة') || name.includes('premium') || name.includes('vip')) {
      return 3;
    }
    if (price >= 400 || name.includes('قياسية') || name.includes('standard')) {
      return 2;
    }
    return 1;
  }

  getCurrentPlanTier(): number {
    const sub = this.currentSub || this.authService.currentSubscription();
    if (sub) {
      return this.getPlanTier(sub);
    }
    return 1;
  }

  getCurrentPlanName(): string {
    const sub = this.currentSub || this.authService.currentSubscription();
    if (sub?.planName) return sub.planName;
    const tier = this.getCurrentPlanTier();
    if (tier === 3) return 'خطة مميزة';
    if (tier === 2) return 'خطة قياسية';
    return 'خطة مجانية';
  }

  isCurrentPlan(plan: PlanOption): boolean {
    const sub = this.currentSub || this.authService.currentSubscription();
    if (!sub) return this.getPlanTier(plan) === 1;
    if (sub.planId && plan.id === sub.planId) return true;
    return this.getPlanTier(plan) === this.getCurrentPlanTier();
  }

  isLowerPlan(plan: PlanOption): boolean {
    if (this.isCurrentPlan(plan)) return false;
    return this.getPlanTier(plan) < this.getCurrentPlanTier();
  }

  isHigherPlan(plan: PlanOption): boolean {
    if (this.isCurrentPlan(plan)) return false;
    return this.getPlanTier(plan) > this.getCurrentPlanTier();
  }

  canSelectPlan(plan: PlanOption): boolean {
    return this.isHigherPlan(plan);
  }

  isAllMaxedOut(): boolean {
    return this.getCurrentPlanTier() >= 3;
  }

  autoSelectAppropriatePlan(): void {
    if (!this.plans || this.plans.length === 0) return;

    // 1. If preselectedPlanName requested and it is a higher plan
    if (this.preselectedPlanName) {
      const found = this.plans.find(p => p.name.includes(this.preselectedPlanName!));
      if (found && this.canSelectPlan(found)) {
        this.selectedPlan = found;
        return;
      }
    }

    // 2. Auto-select the lowest available higher plan
    const higherPlans = this.plans.filter(p => this.canSelectPlan(p));
    if (higherPlans.length > 0) {
      this.selectedPlan = higherPlans[0];
    } else {
      this.selectedPlan = null;
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
            if (!map.has(key)) {
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
              originalPrice: d.originalPrice,
              annualPrice: d.annualPrice || d.price * 12,
              annualOfferPrice: d.annualOfferPrice > 0 ? d.annualOfferPrice : (d.annualPrice || d.price * 10),
              icon: fallback.icon,
              color: fallback.color,
              badgeBg: fallback.badgeBg,
              borderColor: fallback.borderColor
            };
          });

          this.autoSelectAppropriatePlan();
        }
      },
      error: () => {
        this.loadingPlans = false;
        this.autoSelectAppropriatePlan();
      }
    });
  }

  isLimitedFreeOffer(p: any): boolean {
    if (!p) return false;
    if (this.isAnnual) {
      return ((p.annualPrice ?? 0) > 0 || (p.originalPrice ?? 0) > 0) && (p.annualOfferPrice === 0);
    }
    return ((p.originalPrice ?? 0) > 0 || (p.annualPrice ?? 0) > 0) && p.price === 0;
  }

  getOriginalPrice(p: any): number {
    if (!p) return 0;
    if (this.isAnnual) return p.annualPrice || (p.originalPrice ? p.originalPrice * 12 : 0);
    return p.originalPrice || 0;
  }

  selectPlan(plan: PlanOption): void {
    if (!this.canSelectPlan(plan)) {
      if (this.isCurrentPlan(plan)) {
        this.errorMessage = `أنت مشترك بالفعل في "${plan.name}". الترقية متاحة فقط للباقات الأعلى.`;
      } else if (this.isLowerPlan(plan)) {
        this.errorMessage = `لا يمكن النزول إلى "${plan.name}". الترقية متاحة فقط للباقات الأعلى من باقتك الحالية (${this.getCurrentPlanName()}).`;
      }
      return;
    }
    this.selectedPlan = plan;
    this.errorMessage = '';
  }

  goToStep2(): void {
    if (!this.selectedPlan) {
      this.errorMessage = 'يرجى اختيار باقة للترقية إليها أولاً';
      return;
    }
    if (!this.canSelectPlan(this.selectedPlan)) {
      this.errorMessage = 'لا يمكن الترقية إلى نفس باقتك الحالية أو باقة أقل. يرجى اختيار باقة أعلى.';
      return;
    }
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
    if (!this.canSelectPlan(this.selectedPlan)) {
      this.errorMessage = 'لا يمكن الترقية إلى نفس باقتك الحالية أو باقة أقل.';
      return;
    }

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
