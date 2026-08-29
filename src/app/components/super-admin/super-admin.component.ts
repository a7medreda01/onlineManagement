import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SaasService } from '../../services/saas.service';
import { AuthService } from '../../services/auth.service';
import { Plan, SuperAdminOverview, SubscriptionPaymentRequest, Tenant } from '../../models/models';

import { SuperAdminOverviewCardsComponent } from './overview-cards/super-admin-overview-cards.component';
import { SuperAdminTenantsListComponent } from './tenants-list/super-admin-tenants-list.component';
import { SuperAdminRequestsListComponent } from './requests-list/super-admin-requests-list.component';
import { SuperAdminPlansManagerComponent } from './plans-manager/super-admin-plans-manager.component';
import { SuperAdminBroadcastEmailComponent } from './broadcast-email/super-admin-broadcast-email.component';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SuperAdminOverviewCardsComponent,
    SuperAdminTenantsListComponent,
    SuperAdminRequestsListComponent,
    SuperAdminPlansManagerComponent,
    SuperAdminBroadcastEmailComponent
  ],
  templateUrl: './super-admin.component.html'
})
export class SuperAdminComponent implements OnInit {
  overview = signal<SuperAdminOverview | null>(null);
  tenants = signal<Tenant[]>([]);
  filteredTenants = signal<Tenant[]>([]);
  plans = signal<Plan[]>([]);
  subscriptionRequests = signal<SubscriptionPaymentRequest[]>([]);

  activeTab: 'stores' | 'requests' | 'plans' | 'email' = 'stores';
  searchTerm = '';

  // Modals state
  showSuspendModal = false;
  showExtendModal = false;
  showRejectModal = false;

  selectedTenant: Tenant | null = null;
  selectedRequest: SubscriptionPaymentRequest | null = null;
  suspendReason = '';
  rejectReason = '';
  additionalDays = 30;

  // Plan editing state
  editingPlanId: number | null = null;
  planForm = {
    name: '',
    description: '',
    badge: '',
    price: 0,
    originalPrice: 5000,
    annualPrice: 0,
    annualOfferPrice: 0,
    durationInDays: 365,
    maxModerators: 3,
    maxProducts: undefined as number | undefined,
    maxOrdersPerMonth: undefined as number | undefined,
    allowBostaIntegration: false,
    allowWalletsAndDeposits: true,
    allowExpensesTracking: true,
    allowFinancialReports: true,
    allowPurchasesManagement: false,
    allowPayrollAndShifts: false,
    isActive: true
  };

  // Broadcast Email state
  emailForm = {
    subject: '',
    title: '',
    messageContent: '',
    offerBadge: 'عرض خاص وحصري 🔥',
    actionButtonText: 'تفعيل والاشتراك بالباقة الآن',
    actionButtonUrl: 'http://localhost:4200/signup',
    targetPlanId: undefined as number | undefined
  };
  sendingEmail = signal<boolean>(false);

  constructor(private saasService: SaasService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
    this.loadPlans();
    this.loadSubscriptionRequests();
  }

  loadData(): void {
    this.saasService.getOverview().subscribe({
      next: (res) => this.overview.set(res),
      error: (err) => console.error(err)
    });

    this.saasService.getTenants().subscribe({
      next: (res) => {
        this.tenants.set(res);
        this.applyFilter();
      },
      error: (err) => console.error(err)
    });
  }

  loadPlans(): void {
    this.saasService.getPlans().subscribe({
      next: (res) => this.plans.set(res),
      error: (err) => console.error(err)
    });
  }

  loadSubscriptionRequests(): void {
    this.saasService.getSubscriptionRequests().subscribe({
      next: (res) => this.subscriptionRequests.set(res),
      error: (err) => console.error(err)
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  applyFilter(): void {
    let list = this.tenants();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(t => t.storeName.toLowerCase().includes(term) || t.ownerName.toLowerCase().includes(term) || t.email.toLowerCase().includes(term));
    }
    this.filteredTenants.set(list);
  }

  exportCustomers(tenant: Tenant): void {
    this.saasService.exportTenantCustomers(tenant.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenant.storeName.replace(/\s+/g, '_')}_Customers.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('تعذر استخراج شيت العملاء للمتجر')
    });
  }

  // ==========================
  // InstaPay Requests Actions
  // ==========================

  approveRequest(req: SubscriptionPaymentRequest): void {
    if (confirm(`تأكيد تفعيل اشتراك متجر '${req.storeName}' في ${req.planName}؟`)) {
      this.saasService.approveSubscriptionRequest(req.id).subscribe({
        next: () => {
          alert('تمت الموافقة وتفعيل اشتراك المتجر بنجاح');
          this.loadSubscriptionRequests();
          this.loadData();
        },
        error: (err) => alert(err?.error?.Message || 'فشل تفعيل الاشتراك')
      });
    }
  }

  openRejectModal(req: SubscriptionPaymentRequest): void {
    this.selectedRequest = req;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  confirmRejectRequest(): void {
    if (!this.selectedRequest || !this.rejectReason.trim()) return;

    this.saasService.rejectSubscriptionRequest(this.selectedRequest.id, this.rejectReason).subscribe({
      next: () => {
        this.showRejectModal = false;
        alert('تم رفض طلب التحويل');
        this.loadSubscriptionRequests();
      },
      error: (err) => alert(err?.error?.Message || 'خطأ أثناء الرفض')
    });
  }

  // ==========================
  // Email Campaign Actions
  // ==========================

  sendBroadcastEmail(): void {
    if (!this.emailForm.subject || !this.emailForm.title || !this.emailForm.messageContent) {
      alert('يرجى ملء عنوان وموضوع ومحتوى الرسالة البريدية');
      return;
    }

    this.sendingEmail.set(true);
    this.saasService.broadcastEmail(this.emailForm).subscribe({
      next: (res) => {
        this.sendingEmail.set(false);
        alert(res.message || 'تم إرسال الحملة البريدية بنجاح لجميع المتاجر المستهدفة');
        this.emailForm.messageContent = '';
      },
      error: (err) => {
        this.sendingEmail.set(false);
        alert(err?.error?.Message || 'فشل إرسال الحملة البريدية');
      }
    });
  }

  // ==========================
  // Plan Actions
  // ==========================

  editPlan(plan: Plan): void {
    this.editingPlanId = plan.id;
    this.planForm = {
      name: plan.name,
      description: plan.description || '',
      badge: plan.badge || '',
      price: plan.price,
      originalPrice: plan.originalPrice,
      annualPrice: plan.annualPrice || 0,
      annualOfferPrice: plan.annualOfferPrice || 0,
      durationInDays: plan.durationInDays,
      maxModerators: plan.maxModerators,
      maxProducts: plan.maxProducts,
      maxOrdersPerMonth: plan.maxOrdersPerMonth,
      allowBostaIntegration: plan.allowBostaIntegration,
      allowWalletsAndDeposits: plan.allowWalletsAndDeposits ?? true,
      allowExpensesTracking: plan.allowExpensesTracking,
      allowFinancialReports: plan.allowFinancialReports,
      allowPurchasesManagement: plan.allowPurchasesManagement ?? false,
      allowPayrollAndShifts: plan.allowPayrollAndShifts ?? false,
      isActive: plan.isActive
    };
  }

  resetPlanForm(): void {
    this.editingPlanId = null;
    this.planForm = {
      name: '',
      description: '',
      badge: '',
      price: 0,
      originalPrice: 5000,
      annualPrice: 0,
      annualOfferPrice: 0,
      durationInDays: 365,
      maxModerators: 3,
      maxProducts: undefined,
      maxOrdersPerMonth: undefined,
      allowBostaIntegration: false,
      allowWalletsAndDeposits: true,
      allowExpensesTracking: true,
      allowFinancialReports: true,
      allowPurchasesManagement: false,
      allowPayrollAndShifts: false,
      isActive: true
    };
  }

  savePlan(): void {
    if (!this.planForm.name) {
      alert('يرجى كتابة اسم الباقة');
      return;
    }

    if (this.editingPlanId) {
      this.saasService.updatePlan(this.editingPlanId, this.planForm).subscribe({
        next: () => {
          this.resetPlanForm();
          this.loadPlans();
          alert('تم حفظ إعدادات الباقة بنجاح');
        },
        error: (err) => alert(err?.error?.Message || 'خطأ أثناء تعديل الباقة')
      });
    } else {
      this.saasService.createPlan(this.planForm).subscribe({
        next: () => {
          this.resetPlanForm();
          this.loadPlans();
          alert('تم إنشاء الباقة الجديدة بنجاح');
        },
        error: (err) => alert(err?.error?.Message || 'خطأ أثناء إنشاء الباقة')
      });
    }
  }

  // ==========================
  // Tenant Suspension / Extension
  // ==========================

  openSuspendModal(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.suspendReason = '';
    this.showSuspendModal = true;
  }

  confirmSuspend(): void {
    if (!this.selectedTenant || !this.suspendReason) return;

    this.saasService.suspendTenant(this.selectedTenant.id, this.suspendReason).subscribe({
      next: () => {
        this.showSuspendModal = false;
        this.loadData();
      },
      error: (err) => alert(err?.error?.Message || 'خطأ أثناء إيقاف المتجر')
    });
  }

  openExtendModal(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.additionalDays = 30;
    this.showExtendModal = true;
  }

  confirmExtend(): void {
    if (!this.selectedTenant || this.additionalDays <= 0) return;

    this.saasService.extendSubscription(this.selectedTenant.id, this.additionalDays).subscribe({
      next: () => {
        this.showExtendModal = false;
        this.loadData();
      },
      error: (err) => alert(err?.error?.Message || 'خطأ أثناء التمديد')
    });
  }

  reactivateTenant(tenant: Tenant): void {
    if (confirm(`إعادة تفعيل متجر '${tenant.storeName}'؟`)) {
      this.saasService.reactivateTenant(tenant.id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert(err?.error?.Message || 'خطأ أثناء التفعيل')
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/landing']);
  }
}
