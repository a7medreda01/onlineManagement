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
