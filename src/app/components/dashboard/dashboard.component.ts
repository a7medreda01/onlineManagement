import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReportService } from '../../services/report.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { DashboardSummary, Order, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  recentOrders = signal<Order[]>([]);
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
