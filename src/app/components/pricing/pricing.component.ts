import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UpgradeModalComponent } from '../shared/upgrade-modal/upgrade-modal.component';
import { Plan } from '../../models/models';

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

export interface ComparisonCategory {
  categoryName: string;
  categoryIcon: string;
  items: {
    title: string;
    subtext: string;
    free: string;
    standard: string;
    premium: string;
  }[];
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
  loadingPlans = false;

  // Modal control
  isUpgradeModalOpen = false;
  selectedPlanForUpgrade: string | null = null;

  plans: PricingPlan[] = [
    {
      id: 1,
      name: 'خطة مجانية',
      badge: 'مجاناً',
      description: 'تحتوي على المميزات الأساسية بدون قيود، مناسبة لفئة المشاريع الناشئة والصغيرة وتلبي احتياجاتها الأساسية مدى الحياة',
      monthlyPrice: 0,
      yearlyPrice: 0,
      yearlyMonthlyEquivalent: 0,
      icon: 'bi-flower1',
      iconBg: 'bg-slate-800 text-slate-300',
      iconColor: 'text-slate-300',
      btnBorder: 'border-slate-600 text-slate-300 hover:bg-slate-800',
      btnText: 'ابدأ مجاناً',
      btnHoverBg: '',
      btnIcon: 'bi-flower1',
      isFree: true
    },
    {
      id: 2,
      name: 'خطة قياسية',
      badge: 'الأكثر طلباً 🔥',
      description: 'تحتوي على أقسام الخزائن والمصروفات والمشتريات والتقارير المالية وموظفين، الخيار الأفضل للمتاجر المتنامية',
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
      name: 'خطة مميزة',
      badge: 'VIP شاملة 👑',
      description: 'كل مميزات المنصة بدون أي قيود، مع الربط البرمجي مع بوسطة Bosta API وموظفين غير محدود ودعم VIP مخصص',
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      yearlyMonthlyEquivalent: 833,
      icon: 'bi-crown-fill',
      iconBg: 'bg-amber-500/20 text-amber-400',
      iconColor: 'text-amber-400',
      btnBorder: 'border-amber-500 text-amber-400 hover:bg-amber-500/20',
      btnText: 'اشترك الآن',
      btnHoverBg: '',
      btnIcon: 'bi-crown-fill'
    }
  ];

  comparisonCategories: ComparisonCategory[] = [
    {
      categoryName: 'إدارة الأوردرات والمبيعات',
      categoryIcon: 'bi-box-seam-fill text-sky-400',
      items: [
        {
          title: 'إدارة ومتابعة الأوردرات وحالات الشحن',
          subtext: 'متابعة كافة طلبات المتجر وتغيير الحالات وفرز وفلترة الطلبات',
          free: 'check',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'إنشاء أوردر جديد وحفظ السلة والتعديل',
          subtext: 'واجهة سريعة لإدخال الطلبات الهاتفية ومحادثات السوشيال ميديا',
          free: 'check',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'طباعة البوليصات وفواتير الشحن',
          subtext: 'طباعة بوليصات الشحن وفواتير المنتجات بمقاسات حرارية A6 أو A4',
          free: 'check',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'رسائل واتساب السريعة للعملاء',
          subtext: 'إرسال تأكيد الأوردر ومتابعة الشحنة بنقرة واحدة عبر WhatsApp',
          free: 'check',
          standard: 'check',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'المنتجات والمخزون',
      categoryIcon: 'bi-tags-fill text-amber-400',
      items: [
        {
          title: 'إضافة وإدارة المنتجات والتصنيفات',
          subtext: 'تسجيل المنتجات، الصور، الأسعار، ومقاسات وألوان كل منتج',
          free: 'غير محدود',
          standard: 'غير محدود',
          premium: 'غير محدود'
        },
        {
          title: 'تنبيهات انخفاض ونواقص المخزون',
          subtext: 'إشعارات تلقائية عند وصول أي صنف للحد الأدنى لتفادي نفاد الكمية',
          free: 'check',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'تتبع حركات المخزن وتعديل الأرصدة',
          subtext: 'سجل حركات خصم المخزن مع كل بيع وإضافات المشتريات والجرد',
          free: 'check',
          standard: 'check',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'العملاء وشركات الشحن والتوصيل',
      categoryIcon: 'bi-truck text-blue-400',
      items: [
        {
          title: 'دليل العملاء وسجل الطلبات',
          subtext: 'قاعدة بيانات متكاملة لبيانات العملاء وأرقامهم وإجمالي طلباتهم',
          free: 'check',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'شركات الشحن اليدوية والمندوبين الخاصين',
          subtext: 'إضافة شركات الشحن العادية وتحديد أسعار التوصيل لكل محافظة',
          free: 'check',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'الربط الآلي مع شركة بوسطة (Bosta Express API)',
          subtext: 'إنشاء الشحنات وإرسال الأوردرات تلقائياً إلى بوسطة وتوليد البوليصة آلياً بنقرة واحدة',
          free: 'cross',
          standard: 'cross',
          premium: 'check'
        },
        {
          title: 'مزامنة حالات شحن بوسطة عبر Webhook',
          subtext: 'تحديث حالة الأوردر تلقائياً (تم التوصيل، مرتجع، قيد التوصيل) بدون تدخل بشري',
          free: 'cross',
          standard: 'cross',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'الخزائن والمحافظ والعربونات',
      categoryIcon: 'bi-wallet2 text-amber-400',
      items: [
        {
          title: 'إدارة الخزن النقدية والمحافظ الإلكترونية',
          subtext: 'إدارة خزن المحل ومحافظ فودافون كاش، إنستاباي، والحسابات البنكية',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'تسجيل عربونات الأوردرات ومطابقتها',
          subtext: 'إيداع عربون العميل في المحفظة وخصمه تلقائياً من إجمالي الأوردر',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'التحويلات المالية بين الخزائن وتتبع الأرصدة',
          subtext: 'تحويل الأموال بين الخزن والمحافظ مع كشف حساب تفصيلي لكل خزينة',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'المصروفات اليومية والتشغيلية',
      categoryIcon: 'bi-receipt text-rose-400',
      items: [
        {
          title: 'تسجيل وتصنيف المصروفات اليومية',
          subtext: 'إدارة بنود المصاريف (إعلانات، إيجار، رواتب، شحن، بوفيه، تغليف)',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'خصم المصروف من الخزينة تلقائياً',
          subtext: 'ربط سداد المصروف بالخزينة أو المحفظة لتحديث الرصيد الفعلي بدقة',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'تقارير فترات المصروفات والرسوم البيانية',
          subtext: 'معرفة توزيع تكاليف المتجر شهرياً وسنوياً لترشيد الإنفاق',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'إدارة المشتريات والموردين',
      categoryIcon: 'bi-boxes text-amber-500',
      items: [
        {
          title: 'سجل شركات وموردي البضائع',
          subtext: 'إدارة بيانات الموردين، هواتفهم، شروط التوريد، وكشوف حساباتهم',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'فواتير المشتريات وتغذية المخزون آلياً',
          subtext: 'تسجيل فواتير توريد البضائع ورفع كميات المنتجات بالمخزن تلقائياً',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'تتبع مديونيات الموردين والمدفوعات',
          subtext: 'تسجيل الدفعات النقدية للمورد ومتابعة الأرصدة المتبقية والدائنين',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'تقارير الأرباح والمالية (P&L)',
      categoryIcon: 'bi-file-earmark-bar-graph text-indigo-400',
      items: [
        {
          title: 'تقرير الأرباح الصافية والخسائر P&L',
          subtext: 'حساب صافي الأرباح الحقيقي بعد خصم تكلفة البضاعة والمصاريف والشحن',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'تحليل مبيعات وأرباح المنتجات الأكثر مبيعاً',
          subtext: 'معرفة المنتجات الأعلى عائداً والأكثر ربحية لتوجيه المبيعات',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'المؤشرات المالية ولوحة المؤشرات الذكية',
          subtext: 'رسوم بيانية حية لحجم المبيعات ومعدل نمو المتجر شهرياً',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        }
      ]
    },
    {
      categoryName: 'فريق العمل والدعم الفني',
      categoryIcon: 'bi-people-fill text-purple-400',
      items: [
        {
          title: 'عدد حسابات الموظفين (الموديريتورز)',
          subtext: 'إمكانية إضافة حسابات لفريق العمل والموديريتورز للدخول للمنظومة',
          free: 'معطل (0 موظف)',
          standard: 'حتى 2 موظفين',
          premium: 'غير محدود 👑'
        },
        {
          title: 'صلاحيات مخصصة لكل موظف',
          subtext: 'تحديد ما يمكن لكل موظف رؤيته وتعديله لحماية خصوصية بيانات المتجر',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'قسم المرتبات والسلف والشيفتات',
          subtext: 'إدارة مرتبات الموظفين ومتابعة السلف وتسجيل الشيفتات',
          free: 'cross',
          standard: 'check',
          premium: 'check'
        },
        {
          title: 'مستوى الدعم الفني وسرعة الرد',
          subtext: 'قنوات المساعدة والدعم التقني المباشر للمتجر',
          free: 'دعم المساعدة العام',
          standard: 'دعم فني سريع ومميز',
          premium: 'دعم VIP مباشر وشات فوري'
        }
      ]
    }
  ];

  // Mobile Comparison Controls
  selectedMobilePlan: 'free' | 'standard' | 'premium' = 'standard';
  mobileComparisonMode: 'all' | 'single' = 'all';
  expandedCategories: { [key: string]: boolean } = {};

  toggleCategory(catName: string): void {
    this.expandedCategories[catName] = !this.isCategoryExpanded(catName);
  }

  isCategoryExpanded(catName: string): boolean {
    return this.expandedCategories[catName] !== false; // default open
  }

  getPlanStatus(row: any, plan: 'free' | 'standard' | 'premium'): { icon: string; text: string; cssClass: string; isCheck: boolean; isCross: boolean } {
    const val = row[plan];
    if (val === 'check') {
      return { 
        icon: 'bi-check-circle-fill', 
        text: 'متاح', 
        cssClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        isCheck: true,
        isCross: false
      };
    }
    if (val === 'cross') {
      return { 
        icon: 'bi-x-circle', 
        text: 'غير متاح', 
        cssClass: 'bg-rose-500/10 text-rose-400/80 border-rose-500/20',
        isCheck: false,
        isCross: true
      };
    }
    return { 
      icon: 'bi-info-circle-fill', 
      text: val, 
      cssClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold',
      isCheck: false,
      isCross: false
    };
  }

  getSelectedPlanObject(): PricingPlan {
    if (this.selectedMobilePlan === 'free') return this.plans[0];
    if (this.selectedMobilePlan === 'premium') return this.plans[2];
    return this.plans[1];
  }

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
    this.loadPlansFromBackend();
  }

  loadPlansFromBackend(): void {
    this.loadingPlans = true;
    this.authService.getPublicPlans().subscribe({
      next: (data) => {
        this.loadingPlans = false;
        if (data && data.length > 0) {
          // Deduplicate active plans by name
          const map = new Map<string, Plan>();
          data.filter(d => d.isActive).forEach(d => {
            const key = d.name.trim();
            if (!map.has(key) || d.id > map.get(key)!.id) {
              map.set(key, d);
            }
          });
          const sorted = Array.from(map.values()).sort((a, b) => a.price - b.price);
          this.applyBackendPlans(sorted);
        }
      },
      error: () => {
        this.loadingPlans = false;
      }
    });
  }

  private applyBackendPlans(sorted: Plan[]): void {
    if (!sorted || sorted.length === 0) return;

    const free = sorted.find(p => p.price === 0 || p.name.includes('مجانية')) || sorted[0];
    const standard = sorted.find(p => p.name.includes('قياسية') || (p.price > 0 && p.price < (sorted[sorted.length - 1]?.price || 1000))) || sorted[1] || sorted[0];
    const premium = sorted.find(p => p.name.includes('مميزة') || p.price >= 1000) || sorted[sorted.length - 1];

    // 1. Update Plan Cards
    if (free) {
      this.plans[0].id = free.id;
      this.plans[0].name = free.name;
      if (free.badge) this.plans[0].badge = free.badge;
      if (free.description) this.plans[0].description = free.description;
      this.plans[0].monthlyPrice = free.price;
      this.plans[0].yearlyPrice = free.annualOfferPrice > 0 ? free.annualOfferPrice : free.annualPrice;
      this.plans[0].yearlyMonthlyEquivalent = Math.round(this.plans[0].yearlyPrice / 12);
    }

    if (standard) {
      this.plans[1].id = standard.id;
      this.plans[1].name = standard.name;
      if (standard.badge) this.plans[1].badge = standard.badge;
      if (standard.description) this.plans[1].description = standard.description;
      this.plans[1].monthlyPrice = standard.price;
      const yearly = standard.annualOfferPrice > 0 ? standard.annualOfferPrice : (standard.annualPrice || standard.price * 10);
      this.plans[1].yearlyPrice = yearly;
      this.plans[1].yearlyMonthlyEquivalent = Math.round(yearly / 12);
    }

    if (premium) {
      this.plans[2].id = premium.id;
      this.plans[2].name = premium.name;
      if (premium.badge) this.plans[2].badge = premium.badge;
      if (premium.description) this.plans[2].description = premium.description;
      this.plans[2].monthlyPrice = premium.price;
      const yearly = premium.annualOfferPrice > 0 ? premium.annualOfferPrice : (premium.annualPrice || premium.price * 10);
      this.plans[2].yearlyPrice = yearly;
      this.plans[2].yearlyMonthlyEquivalent = Math.round(yearly / 12);
    }

    // 2. Dynamically Update Comparison Categories from Live Database Plan configurations
    this.updateComparisonCategories(free, standard, premium);
  }

  private formatModerators(p?: Plan): string {
    if (!p) return 'معطل (0 موظف)';
    const count = p.maxModerators ?? 0;
    if (count <= 0) return 'معطل (0 موظف)';
    if (count >= 50 || count === 999) return 'غير محدود 👑';
    if (count === 1) return 'موظف واحد (1)';
    if (count === 2) return 'حتى 2 موظفين';
    return `حتى ${count} موظفين`;
  }

  private formatProducts(p?: Plan): string {
    if (!p || !p.maxProducts) return 'غير محدود';
    return `حتى ${p.maxProducts} منتج`;
  }

  private updateComparisonCategories(free: Plan, standard: Plan, premium: Plan): void {
    this.comparisonCategories = [
      {
        categoryName: 'إدارة الأوردرات والمبيعات',
        categoryIcon: 'bi-box-seam-fill text-sky-400',
        items: [
          {
            title: 'إدارة ومتابعة الأوردرات وحالات الشحن',
            subtext: 'متابعة كافة طلبات المتجر وتغيير الحالات وفرز وفلترة الطلبات',
            free: 'check',
            standard: 'check',
            premium: 'check'
          },
          {
            title: 'إنشاء أوردر جديد وحفظ السلة والتعديل',
            subtext: 'واجهة سريعة لإدخال الطلبات الهاتفية ومحادثات السوشيال ميديا',
            free: 'check',
            standard: 'check',
            premium: 'check'
          },
          {
            title: 'طباعة البوليصات وفواتير الشحن',
            subtext: 'طباعة بوليصات الشحن وفواتير المنتجات بمقاسات حرارية A6 أو A4',
            free: 'check',
            standard: 'check',
            premium: 'check'
          },
          {
            title: 'رسائل واتساب السريعة للعملاء',
            subtext: 'إرسال تأكيد الأوردر ومتابعة الشحنة بنقرة واحدة عبر WhatsApp',
            free: 'check',
            standard: 'check',
            premium: 'check'
          }
        ]
      },
      {
        categoryName: 'المنتجات والمخزون',
        categoryIcon: 'bi-tags-fill text-amber-400',
        items: [
          {
            title: 'إضافة وإدارة المنتجات والتصنيفات',
            subtext: 'تسجيل المنتجات، الصور، الأسعار، ومقاسات وألوان كل منتج',
            free: this.formatProducts(free),
            standard: this.formatProducts(standard),
            premium: this.formatProducts(premium)
          },
          {
            title: 'تنبيهات انخفاض ونواقص المخزون',
            subtext: 'إشعارات تلقائية عند وصول أي صنف للحد الأدنى لتفادي نفاد الكمية',
            free: 'check',
            standard: 'check',
            premium: 'check'
          },
          {
            title: 'تتبع حركات المخزن وتعديل الأرصدة',
            subtext: 'سجل حركات خصم المخزن مع كل بيع وإضافات المشتريات والجرد',
            free: 'check',
            standard: 'check',
            premium: 'check'
          }
        ]
      },
      {
        categoryName: 'العملاء وشركات الشحن والتوصيل',
        categoryIcon: 'bi-truck text-blue-400',
        items: [
          {
            title: 'دليل العملاء وسجل الطلبات',
            subtext: 'قاعدة بيانات متكاملة لبيانات العملاء وأرقامهم وإجمالي طلباتهم',
            free: 'check',
            standard: 'check',
            premium: 'check'
          },
          {
            title: 'شركات الشحن اليدوية والمندوبين الخاصين',
            subtext: 'إضافة شركات الشحن العادية وتحديد أسعار التوصيل لكل محافظة',
            free: 'check',
            standard: 'check',
            premium: 'check'
          },
          {
            title: 'الربط الآلي مع شركة بوسطة (Bosta Express API)',
            subtext: 'إنشاء الشحنات وإرسال الأوردرات تلقائياً إلى بوسطة وتوليد البوليصة آلياً بنقرة واحدة',
            free: free?.allowBostaIntegration ? 'check' : 'cross',
            standard: standard?.allowBostaIntegration ? 'check' : 'cross',
            premium: premium?.allowBostaIntegration ? 'check' : 'check'
          },
          {
            title: 'مزامنة حالات شحن بوسطة عبر Webhook',
            subtext: 'تحديث حالة الأوردر تلقائياً (تم التوصيل، مرتجع، قيد التوصيل) بدون تدخل بشري',
            free: free?.allowBostaIntegration ? 'check' : 'cross',
            standard: standard?.allowBostaIntegration ? 'check' : 'cross',
            premium: premium?.allowBostaIntegration ? 'check' : 'check'
          }
        ]
      },
      {
        categoryName: 'الخزائن والمحافظ والعربونات',
        categoryIcon: 'bi-wallet2 text-amber-400',
        items: [
          {
            title: 'إدارة الخزن النقدية والمحافظ الإلكترونية',
            subtext: 'إدارة خزن المحل ومحافظ فودافون كاش، إنستاباي، والحسابات البنكية',
            free: free?.allowWalletsAndDeposits ? 'check' : 'cross',
            standard: standard?.allowWalletsAndDeposits ? 'check' : 'cross',
            premium: premium?.allowWalletsAndDeposits ? 'check' : 'cross'
          },
          {
            title: 'تسجيل عربونات الأوردرات ومطابقتها',
            subtext: 'إيداع عربون العميل في المحفظة وخصمه تلقائياً من إجمالي الأوردر',
            free: free?.allowWalletsAndDeposits ? 'check' : 'cross',
            standard: standard?.allowWalletsAndDeposits ? 'check' : 'cross',
            premium: premium?.allowWalletsAndDeposits ? 'check' : 'cross'
          },
          {
            title: 'التحويلات المالية بين الخزائن وتتبع الأرصدة',
            subtext: 'تحويل الأموال بين الخزن والمحافظ مع كشف حساب تفصيلي لكل خزينة',
            free: free?.allowWalletsAndDeposits ? 'check' : 'cross',
            standard: standard?.allowWalletsAndDeposits ? 'check' : 'cross',
            premium: premium?.allowWalletsAndDeposits ? 'check' : 'cross'
          }
        ]
      },
      {
        categoryName: 'المصروفات اليومية والتشغيلية',
        categoryIcon: 'bi-receipt text-rose-400',
        items: [
          {
            title: 'تسجيل وتصنيف المصروفات اليومية',
            subtext: 'إدارة بنود المصاريف (إعلانات، إيجار، رواتب، شحن، بوفيه، تغليف)',
            free: free?.allowExpensesTracking ? 'check' : 'cross',
            standard: standard?.allowExpensesTracking ? 'check' : 'cross',
            premium: premium?.allowExpensesTracking ? 'check' : 'cross'
          },
          {
            title: 'خصم المصروف من الخزينة تلقائياً',
            subtext: 'ربط سداد المصروف بالخزينة أو المحفظة لتحديث الرصيد الفعلي بدقة',
            free: free?.allowExpensesTracking ? 'check' : 'cross',
            standard: standard?.allowExpensesTracking ? 'check' : 'cross',
            premium: premium?.allowExpensesTracking ? 'check' : 'cross'
          },
          {
            title: 'تقارير فترات المصروفات والرسوم البيانية',
            subtext: 'معرفة توزيع تكاليف المتجر شهرياً وسنوياً لترشيد الإنفاق',
            free: free?.allowExpensesTracking ? 'check' : 'cross',
            standard: standard?.allowExpensesTracking ? 'check' : 'cross',
            premium: premium?.allowExpensesTracking ? 'check' : 'cross'
          }
        ]
      },
      {
        categoryName: 'إدارة المشتريات والموردين',
        categoryIcon: 'bi-boxes text-amber-500',
        items: [
          {
            title: 'سجل شركات وموردي البضائع',
            subtext: 'إدارة بيانات الموردين، هواتفهم، شروط التوريد، وكشوف حساباتهم',
            free: free?.allowPurchasesManagement ? 'check' : 'cross',
            standard: standard?.allowPurchasesManagement ? 'check' : 'cross',
            premium: premium?.allowPurchasesManagement ? 'check' : 'cross'
          },
          {
            title: 'فواتير المشتريات وتغذية المخزون آلياً',
            subtext: 'تسجيل فواتير توريد البضائع ورفع كميات المنتجات بالمخزن تلقائياً',
            free: free?.allowPurchasesManagement ? 'check' : 'cross',
            standard: standard?.allowPurchasesManagement ? 'check' : 'cross',
            premium: premium?.allowPurchasesManagement ? 'check' : 'cross'
          },
          {
            title: 'تتبع مديونيات الموردين والمدفوعات',
            subtext: 'تسجيل الدفعات النقدية للمورد ومتابعة الأرصدة المتبقية والدائنين',
            free: free?.allowPurchasesManagement ? 'check' : 'cross',
            standard: standard?.allowPurchasesManagement ? 'check' : 'cross',
            premium: premium?.allowPurchasesManagement ? 'check' : 'cross'
          }
        ]
      },
      {
        categoryName: 'تقارير الأرباح والمالية (P&L)',
        categoryIcon: 'bi-file-earmark-bar-graph text-indigo-400',
        items: [
          {
            title: 'تقرير الأرباح الصافية والخسائر P&L',
            subtext: 'حساب صافي الأرباح الحقيقي بعد خصم تكلفة البضاعة والمصاريف والشحن',
            free: free?.allowFinancialReports ? 'check' : 'cross',
            standard: standard?.allowFinancialReports ? 'check' : 'cross',
            premium: premium?.allowFinancialReports ? 'check' : 'cross'
          },
          {
            title: 'تحليل مبيعات وأرباح المنتجات الأكثر مبيعاً',
            subtext: 'معرفة المنتجات الأعلى عائداً والأكثر ربحية لتوجيه المبيعات',
            free: free?.allowFinancialReports ? 'check' : 'cross',
            standard: standard?.allowFinancialReports ? 'check' : 'cross',
            premium: premium?.allowFinancialReports ? 'check' : 'cross'
          },
          {
            title: 'المؤشرات المالية ولوحة المؤشرات الذكية',
            subtext: 'رسوم بيانية حية لحجم المبيعات ومعدل نمو المتجر شهرياً',
            free: free?.allowFinancialReports ? 'check' : 'cross',
            standard: standard?.allowFinancialReports ? 'check' : 'cross',
            premium: premium?.allowFinancialReports ? 'check' : 'cross'
          }
        ]
      },
      {
        categoryName: 'فريق العمل والدعم الفني',
        categoryIcon: 'bi-people-fill text-purple-400',
        items: [
          {
            title: 'عدد حسابات الموظفين (الموديريتورز)',
            subtext: 'إمكانية إضافة حسابات لفريق العمل والموديريتورز للدخول للمنظومة',
            free: this.formatModerators(free),
            standard: this.formatModerators(standard),
            premium: this.formatModerators(premium)
          },
          {
            title: 'صلاحيات مخصصة لكل موظف',
            subtext: 'تحديد ما يمكن لكل موظف رؤيته وتعديله لحماية خصوصية بيانات المتجر',
            free: (free?.maxModerators ?? 0) > 0 ? 'check' : 'cross',
            standard: (standard?.maxModerators ?? 0) > 0 ? 'check' : 'cross',
            premium: (premium?.maxModerators ?? 0) > 0 ? 'check' : 'cross'
          },
          {
            title: 'قسم المرتبات والسلف والشيفتات',
            subtext: 'إدارة مرتبات الموظفين ومتابعة السلف وتسجيل الشيفتات',
            free: free?.allowPayrollAndShifts ? 'check' : 'cross',
            standard: standard?.allowPayrollAndShifts ? 'check' : 'cross',
            premium: premium?.allowPayrollAndShifts ? 'check' : 'cross'
          },
          {
            title: 'مستوى الدعم الفني وسرعة الرد',
            subtext: 'قنوات المساعدة والدعم التقني المباشر للمتجر',
            free: 'دعم المساعدة العام',
            standard: 'دعم فني سريع ومميز',
            premium: 'دعم VIP مباشر وشات فوري'
          }
        ]
      }
    ];
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
