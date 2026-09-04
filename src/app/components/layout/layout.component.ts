import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { SaasService } from '../../services/saas.service';
import { SubscriptionDetails, Plan, UserRole } from '../../models/models';
import { UpgradeModalComponent } from '../shared/upgrade-modal/upgrade-modal.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, UpgradeModalComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = signal(false);
  isMoreMenuOpen = signal(false);
  isDarkMode = signal(true);
  purchasesOpen = signal(false);

  currentLocalTime = signal<string>('');
  currentLocalCountry = signal<string>('');
  private clockInterval: any;

  availablePlans = signal<Plan[]>([]);
  showSubscriptionModal = false;
  loadingSubscription = false;
  subscriptionData: SubscriptionDetails | null = null;

  // Upgrade Modal Control
  isUpgradeModalOpen = false;
  selectedUpgradePlan: string | null = null;

  UserRole = UserRole;

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private saasService: SaasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('/purchases')) {
      this.purchasesOpen.set(true);
    }

    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      this.isDarkMode.set(false);
      document.body.classList.add('light-mode');
    } else {
      this.isDarkMode.set(true);
      document.body.classList.remove('light-mode');
    }

    this.startClock();
    this.fetchSubscription();
  }

  fetchSubscription(): void {
    this.authService.getSubscriptionDetails().subscribe({
      next: (res) => {
        this.subscriptionData = res;
      },
      error: () => {}
    });
  }

  isFreePlan(): boolean {
    if (!this.subscriptionData) return true; // Default to free limitations until loaded
    return this.subscriptionData.price === 0 ||
           this.subscriptionData.planName?.includes('مجانية') ||
           this.subscriptionData.planName?.includes('Free');
  }

  canAccessWallets(): boolean {
    return this.authService.canAccessWallets();
  }

  canAccessExpenses(): boolean {
    return this.authService.canAccessExpenses();
  }

  canAccessPurchases(): boolean {
    return this.authService.canAccessPurchases();
  }

  canAccessFinancialReports(): boolean {
    return this.authService.canAccessFinancialReports();
  }

  canAccessUsers(): boolean {
    return this.authService.canAccessUsers();
  }

  canAccessBosta(): boolean {
    return this.authService.canAccessBosta();
  }

  canAccessStorefront(): boolean {
    const user = this.authService.currentUser();
    return user?.allowAiLandingPages ?? false;
  }

  openUpgradeModal(planName?: string): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.selectedUpgradePlan = planName || null;
    this.isUpgradeModalOpen = true;
    if (this.isMoreMenuOpen()) {
      this.closeMoreMenu();
    }
  }

  onUpgradeSuccess(): void {
    this.isUpgradeModalOpen = false;
    this.fetchSubscription();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  startClock(): void {
    const update = () => {
      const now = new Date();
      this.currentLocalTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let countryName = tz.split('/')[1]?.replace(/_/g, ' ') || tz;
        if (tz.includes('Cairo')) countryName = 'مصر (توقيت القاهرة)';
        else if (tz.includes('Riyadh')) countryName = 'السعودية (توقيت الرياض)';
        else if (tz.includes('Dubai')) countryName = 'الإمارات (توقيت دبي)';
        else if (tz.includes('Kuwait')) countryName = 'الكويت';
        else if (tz.includes('Qatar')) countryName = 'قطر';
        this.currentLocalCountry.set(countryName);
      } catch {
        this.currentLocalCountry.set('التوقيت المحلي');
      }
    };

    update();
    this.clockInterval = setInterval(update, 1000);
  }

  get user() {
    return this.authService.currentUser();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isManager(): boolean {
    return this.authService.isManager();
  }

  isFinancial(): boolean {
    return this.authService.isFinancial();
  }

  openSubscriptionDetails(): void {
    this.showSubscriptionModal = true;
    this.loadingSubscription = true;
    this.authService.getSubscriptionDetails().subscribe({
      next: (res) => {
        this.subscriptionData = res;
        this.loadingSubscription = false;
        this.loadAvailablePlans();
      },
      error: () => {
        this.loadingSubscription = false;
      }
    });
  }

  loadAvailablePlans(): void {
    this.saasService.getPlans().subscribe({
      next: (res) => this.availablePlans.set(res.filter(p => p.isActive)),
      error: (err) => console.error(err)
    });
  }

  contactSalesForPlan(plan: Plan): void {
    const text = encodeURIComponent(`مرحباً دعم Besnesy، أود الاستفسار عن ترقية باقة متجري إلى: ${plan.name} (${plan.annualOfferPrice} ج.م/سنة)`);
    window.open(`https://wa.me/201080225502?text=${text}`, '_blank');
  }

  toggleTheme(): void {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleMoreMenu(): void {
    this.isMoreMenuOpen.set(!this.isMoreMenuOpen());
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
