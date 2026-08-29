import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { DashboardSummary, Order, OrderStatus, TeamActivitySummary } from '../../models/models';
import { ModeratorPkBannerComponent } from './moderator-pk-banner/moderator-pk-banner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ModeratorPkBannerComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  recentOrders = signal<Order[]>([]);
  teamActivity = signal<TeamActivitySummary[]>([]);
  loading = signal<boolean>(true);

  constructor(
    private reportService: ReportService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get topModerators(): TeamActivitySummary[] {
    return [...this.teamActivity()]
      .sort((a, b) => (b.ordersCreatedCount + b.ordersConfirmedCount) - (a.ordersCreatedCount + a.ordersConfirmedCount));
  }

  get modA(): TeamActivitySummary | null {
    return this.topModerators.length > 0 ? this.topModerators[0] : null;
  }

  get modB(): TeamActivitySummary | null {
    return this.topModerators.length > 1 ? this.topModerators[1] : null;
  }

  get modAScore(): number {
    const a = this.modA;
    return a ? (a.ordersCreatedCount + a.ordersConfirmedCount) : 0;
  }

  get modBScore(): number {
    const b = this.modB;
    return b ? (b.ordersCreatedCount + b.ordersConfirmedCount) : 0;
  }

  get modAPercent(): number {
    const total = this.modAScore + this.modBScore;
    if (total === 0) return 50;
    return Math.round((this.modAScore / total) * 100);
  }

  get modBPercent(): number {
    const total = this.modAScore + this.modBScore;
    if (total === 0) return 50;
    return 100 - this.modAPercent;
  }

  goToDetail(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  getDisplayOrderNumber(orderNumber?: string, id?: number): string {
    if (orderNumber && orderNumber.startsWith('#')) {
      return orderNumber.replace('#', '');
    }
    return id ? id.toString() : '1';
  }

  loadData(): void {
    this.loading.set(true);
    const todayStr = new Date().toISOString().split('T')[0];

    this.reportService.getDashboardSummary().subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });

    this.reportService.getTeamActivitySummary(todayStr, todayStr).subscribe({
      next: (res) => {
        this.teamActivity.set(res || []);
      },
      error: (err) => console.error(err)
    });

    this.orderService.getAll(undefined, undefined, undefined, undefined, 1, 5).subscribe({
      next: (res) => this.recentOrders.set(res.items ? res.items.slice(0, 5) : []),
      error: (err) => console.error(err)
    });
  }

  getStatusArabic(status?: OrderStatus | string): string {
    if (!status) return '';
    switch (status) {
      case OrderStatus.New:
      case 'New': return 'جديد';
      case OrderStatus.Confirming:
      case 'Confirming': return 'جاري التأكيد';
      case OrderStatus.Confirmed:
      case 'Confirmed': return 'مؤكد';
      case OrderStatus.Shipped:
      case 'Shipped': return 'تم الشحن';
      case OrderStatus.Delivered:
      case 'Delivered': return 'تم التسليم';
      case OrderStatus.Cancelled:
      case 'Cancelled': return 'ملغي';
      case OrderStatus.Returned:
      case 'Returned': return 'مرتجع';
      default: return status.toString();
    }
  }

  getStatusTextClass(status?: OrderStatus | string): string {
    switch (status) {
      case 'New': case OrderStatus.New: return 'text-sky-400';
      case 'Confirming': case OrderStatus.Confirming: return 'text-purple-400';
      case 'Confirmed': case OrderStatus.Confirmed: return 'text-emerald-400';
      case 'Shipped': case OrderStatus.Shipped: return 'text-amber-400';
      case 'Delivered': case OrderStatus.Delivered: return 'text-emerald-400';
      case 'Cancelled': case OrderStatus.Cancelled: return 'text-rose-400';
      case 'Returned': case OrderStatus.Returned: return 'text-rose-400';
      default: return 'text-sky-400';
    }
  }
}
