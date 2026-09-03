import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UpgradeModalComponent } from '../shared/upgrade-modal/upgrade-modal.component';

interface PricingPlan {
  id: number;
  name: string;
  badge: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthlyEquivalent: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  btnBorder: string;
  btnText: string;
  btnHoverBg: string;
  btnIcon: string;
  isFree?: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, UpgradeModalComponent],
  templateUrl: './pricing.component.html'
})
export class PricingComponent implements OnInit {
  isDarkMode = true;
  isAnnual = false;
  isLoggedIn = false;

  // Modal control
  isUpgradeModalOpen = false;
  selectedPlanForUpgrade: string | null = null;

  plans: PricingPlan[] = [
    {
      id: 1,
      name: 'خطة مجانية',
      badge: 'مجاناً',
      description: 'تحتوي على المميزات الأساسية بدون قيود أو حدود، مناسبة لفئة المشاريع الصغيرة وتلبي كافة احتياجاتها مدى الحياة',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyMonthlyEquivalent: 0,
      icon: 'bi-flower1',
      iconBg: 'bg-slate-800 text-slate-300',
      iconColor: 'text-slate-300',
      btnBorder: 'border-slate-600 text-slate-300 hover:bg-slate-800',
      btnText: 'اشترك الآن',
      btnHoverBg: '',
      btnIcon: 'bi-flower1',
      isFree: true
    },
    {
      id: 2,
      name: 'خطة قياسية',
      badge: 'الأكثر طلباً',
      description: 'تحتوي على العديد من المميزات المتقدمة، وحسابات متعددة، ودعم مميز، مناسبة للمشاريع المتوسطة ذات عدد موظفين قليل',
      monthlyPrice: 400,
      yearlyPrice: 4000,
      yearlyMonthlyEquivalent: 333,
      icon: 'bi-award-fill',
      iconBg: 'bg-teal-500/20 text-teal-400',
      iconColor: 'text-teal-400',
      btnBorder: 'border-teal-500 text-teal-400 hover:bg-teal-500/20',
      btnText: 'اشترك الآن',
      btnHoverBg: '',
      btnIcon: 'bi-award-fill'
    },
    {
      id: 3,
      name: 'خطة متقدمة',
      badge: 'متقدمة',
      description: 'تحتوي على مميزات وتقارير متقدمة وخصائص أعلى في جوانب متعددة من السيستم، الخطة الأنسب للمشاريع المتوسطة',
      monthlyPrice: 750,
      yearlyPrice: 7500,
      yearlyMonthlyEquivalent: 625,
      icon: 'bi-shield-fill-check',
      iconBg: 'bg-purple-600 text-white',
      iconColor: 'text-purple-400',
      btnBorder: 'border-purple-500 text-purple-400 hover:bg-purple-500/20',
      btnText: 'اشترك الآن',
      btnHoverBg: '',
      btnIcon: 'bi-shield-fill-check'
    },
    {
      id: 4,
      name: 'خطة مميزة',
      badge: 'VIP شاملة',
      description: 'تحتوي على كل الخصائص المميزة والمتقدمة بدون أي حدود، وحسابات موظفين لا نهائية، الخطة الأنسب للمشاريع الكبيرة',
      monthlyPrice: 1250,
      yearlyPrice: 12500,
      yearlyMonthlyEquivalent: 1041,
      icon: 'bi-crown-fill',
      iconBg: 'bg-amber-500 text-white',
      iconColor: 'text-amber-400',
      btnBorder: 'border-amber-500 text-amber-400 hover:bg-amber-500/20',
      btnText: 'اشترك الآن',
      btnHoverBg: '',
      btnIcon: 'bi-crown-fill'
    }
  ];

  comparisonRows = [
    {
      title: 'عدد لا نهائي من المنتجات',
      subtext: 'إمكانية إضافة عدد لا نهائي من المنتجات إلى مخزن المشروع',
      free: 'check',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    },
    {
      title: 'عدد لا نهائي من الطلبات',
      subtext: 'إمكانية إضافة عدد لا نهائي من الطلبات (فواتير البيع) بدون قيود',
      free: 'check',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    },
    {
      title: 'عدد لا نهائي من العملاء',
      subtext: 'إمكانية إضافة عدد لا نهائي من العملاء وبياناتهم إلى قائمة العملاء',
      free: 'check',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    },
    {
      title: 'عدد لا نهائي من فواتير الشراء',
      subtext: 'إمكانية إضافة عدد لا نهائي من فواتير الشراء وربطها مع الموردين',
      free: 'check',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    },
    {
      title: 'الدعم المميز والسريع',
      subtext: 'الحصول على دعم مميز مع إمكانية التواصل المباشر (شات) مع فريق الدعم على مدار اليوم لحل أي مشكلة تواجهك بأسرع وقت',
      free: 'cross',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    },
    {
      title: 'عدد حسابات الموردين',
      subtext: 'عدد حسابات الموردين المتاح إضافتهم إلى المشروع',
      free: '5',
      standard: '25',
      advanced: 'عدد لا نهائي',
      premium: 'عدد لا نهائي'
    },
    {
      title: 'عدد حسابات الموظفين',
      subtext: 'حسابات متعددة لموظفين المشروع بصلاحيات مقيدة لكل موظف',
      free: 'cross',
      standard: '2',
      advanced: '10',
      premium: 'عدد لا نهائي'
    },
    {
      title: 'الحسابات المالية للعملاء',
      subtext: 'إمكانية تحديد المبلغ المدفوع لكل طلب وتسجيل المتبقي على رصيد العميل، وإتاحة العمليات المالية على حسابات العملاء، وصفحتي العملاء الدائنين والعملاء المدينين',
      free: 'cross',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    },
    {
      title: 'الحسابات المالية للموردين',
      subtext: 'إمكانية تحديد الدفعات للموردين وتسجيل المتبقي، وإتاحة العمليات المالية على حسابات الموردين، وإدارة الموردين الدائنين والمدينين',
      free: 'cross',
      standard: 'check',
      advanced: 'check',
      premium: 'check'
    }
  ];

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

    this.isLoggedIn = this.authService.isLoggedIn();
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

  onPlanAction(plan: PricingPlan): void {
    if (!this.isLoggedIn) {
      if (plan.isFree) {
        this.router.navigate(['/signup']);
      } else {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/pricing' } });
      }
      return;
    }

    if (plan.isFree) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // If logged in, open upgrade modal
    this.selectedPlanForUpgrade = plan.name;
    this.isUpgradeModalOpen = true;
  }
}
