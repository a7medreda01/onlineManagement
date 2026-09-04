import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

export interface PlanDto {
  id: number;
  name: string;
  description: string;
  badge: string;
  price: number;
  originalPrice: number;
  annualPrice: number;
  annualOfferPrice: number;
  durationInDays: number;
  maxModerators: number;
  maxProducts: number | null;
  maxOrdersPerMonth: number | null;
  allowBostaIntegration: boolean;
  allowWalletsAndDeposits: boolean;
  allowExpensesTracking: boolean;
  allowFinancialReports: boolean;
  allowPurchasesManagement: boolean;
  allowPayrollAndShifts: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html'
})
export class LandingComponent implements OnInit {
  imageError = false;
  isDarkMode = true;
  isAnnual = false;

  plans = signal<PlanDto[]>([]);
  loadingPlans = signal<boolean>(true);

  // Feature list for the system
  systemFeatures = [
    {
      icon: 'bi-box-seam-fill',
      color: 'sky',
      title: 'إدارة الأوردرات والشحن',
      desc: 'إنشاء ومتابعة الطلبات لحظياً مع الربط المباشر بشركات الشحن وتوليد بوليصات التتبع تلقائياً.'
    },
    {
      icon: 'bi-graph-up-arrow',
      color: 'emerald',
      title: 'تقارير الأرباح P&L',
      desc: 'تحليل مالي شامل ومخططات بيانية لإجمالي الإيرادات والمصروفات وصافي الأرباح يومياً وشهرياً.'
    },
    {
      icon: 'bi-people-fill',
      color: 'indigo',
      title: 'فريق العمل والمرتبات',
      desc: 'إدارة موظفين بأدوار مختلفة (مودريتور، مدير مالي)، سلف المرتبات، والصرف التلقائي.'
    },
    {
      icon: 'bi-wallet2',
      color: 'amber',
      title: 'الخزائن والعربونات',
      desc: 'تتبع خزائن متعددة وعربونات الطلبات تلقائياً مع خصم COD من إجمالي الطلب عند التوصيل.'
    },
    {
      icon: 'bi-tags-fill',
      color: 'purple',
      title: 'إدارة المنتجات والمخزون',
      desc: 'صور المنتجات، تتبع المخزون بدقة، تنبيهات نقص المخزون، وإدارة الأسعار والأكواد.'
    },
    {
      icon: 'bi-receipt',
      color: 'rose',
      title: 'المصروفات اليومية',
      desc: 'تسجيل مصروفات العمل اليومية بالفئات وتضمينها تلقائياً في تقارير الأرباح والخسائر.'
    },
    {
      icon: 'bi-truck',
      color: 'teal',
      title: 'ربط Bosta API الآلي',
      desc: 'إرسال وتتبع الشحنات مع بوسطة ببضع نقرات، شحن جماعي للطلبات واستخراج بوليصات PDF.'
    },
    {
      icon: 'bi-shield-lock-fill',
      color: 'slate',
      title: 'صلاحيات وأمان متقدم',
      desc: 'نظام صلاحيات دقيق لكل دور: إدارة، مودريتور، مالية — مع عزل تام لبيانات كل متجر.'
    }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    public authService: AuthService
  ) {}

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
    this.loadingPlans.set(true);
    this.http.get<PlanDto[]>(`${environment.apiUrl}/plans`).subscribe({
      next: (plans) => {
        this.loadingPlans.set(false);
        if (plans && plans.length > 0) {
          // Deduplicate by trimmed name and keep highest ID
          const map = new Map<string, PlanDto>();
          plans.filter(p => p.isActive).forEach(p => {
            const key = p.name.trim();
            if (!map.has(key)) {
              map.set(key, p);
            }
          });
          const sorted = Array.from(map.values()).sort((a, b) => a.price - b.price);
          this.plans.set(sorted);
        }
      },
      error: () => {
        this.loadingPlans.set(false);
      }
    });
  }

  onPlanAction(plan: PlanDto): void {
    if (this.isFree(plan)) {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/signup']);
      }
    } else {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/pricing'], { queryParams: { upgrade: plan.name } });
      } else {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/pricing' } });
      }
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

  getDisplayPrice(plan: PlanDto): number {
    if (this.isAnnual) {
      return plan.annualOfferPrice > 0 ? plan.annualOfferPrice : (plan.annualPrice || plan.price * 10);
    }
    return plan.price;
  }

  getOriginalPrice(plan: PlanDto): number {
    if (this.isAnnual) return plan.annualPrice || (plan.originalPrice ? plan.originalPrice * 12 : 0);
    return plan.originalPrice;
  }

  isLimitedFreeOffer(plan: PlanDto): boolean {
    if (this.isAnnual) {
      const hasAnnualBase = (plan.annualPrice && plan.annualPrice > 0) || (plan.originalPrice && plan.originalPrice > 0);
      return Boolean(hasAnnualBase) && plan.annualOfferPrice === 0;
    }
    const hasBase = (plan.originalPrice && plan.originalPrice > 0) || (plan.annualPrice && plan.annualPrice > 0);
    return Boolean(hasBase) && plan.price === 0;
  }

  isPermanentFree(plan: PlanDto): boolean {
    return this.getDisplayPrice(plan) === 0 && !this.isLimitedFreeOffer(plan);
  }

  isFree(plan: PlanDto): boolean {
    return this.isPermanentFree(plan) || this.isLimitedFreeOffer(plan);
  }

  isPopular(plan: PlanDto, plans: PlanDto[]): boolean {
    if (plans.length < 2) return false;
    const mid = Math.floor(plans.length / 2);
    return plans[mid]?.id === plan.id;
  }

  getPlanColorClass(index: number): { border: string; bg: string; badge: string; btn: string; price: string } {
    const colors = [
      { border: 'border-slate-700/60', bg: '', badge: 'bg-slate-800 text-slate-300 border-slate-700', btn: 'btn-secondary', price: 'text-slate-200' },
      { border: 'border-amber-500/80', bg: 'from-amber-500/10 via-slate-900 to-slate-950', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', btn: 'btn-amber', price: 'text-amber-400' },
      { border: 'border-indigo-500/60', bg: 'from-indigo-500/10 via-slate-900 to-slate-950', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', btn: 'btn-primary', price: 'text-sky-400' },
    ];
    return colors[index % colors.length];
  }

  getFeatureColorClass(color: string): string {
    const map: Record<string, string> = {
      sky:    'from-sky-500/20 to-blue-600/20 border-sky-500/30 text-sky-400',
      emerald:'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
      indigo: 'from-indigo-500/20 to-blue-600/20 border-indigo-500/30 text-indigo-400',
      amber:  'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400',
      purple: 'from-purple-500/20 to-indigo-600/20 border-purple-500/30 text-purple-400',
      rose:   'from-rose-500/20 to-pink-600/20 border-rose-500/30 text-rose-400',
      teal:   'from-teal-500/20 to-emerald-600/20 border-teal-500/30 text-teal-400',
      slate:  'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-400',
    };
    return map[color] || map['sky'];
  }

  openWhatsApp(): void {
    window.open('https://wa.me/201080225502?text=مرحباً، أريد الاستفسار عن باقات Besnesy', '_blank');
  }
}
