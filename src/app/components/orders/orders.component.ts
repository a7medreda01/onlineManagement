import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../services/notification.service';
import { BostaService } from '../../services/bosta.service';
import { Order, OrderStatus, PagedResult } from '../../models/models';

import { ShippingService } from '../../services/shipping.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.component.html'
})
export class OrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);
  selectedStatus: OrderStatus | null = null;
  fromDate: string = '';
  toDate: string = '';
  searchTerm: string = '';
  showDateFilter = false;
  hasBostaIntegration = false;

  // Pagination Signals
  pageNumber = signal<number>(1);
  pageSize: number = 10;
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  hasPreviousPage = signal<boolean>(false);
  hasNextPage = signal<boolean>(false);

  statusOptions = Object.values(OrderStatus);

  // Selection & Bulk Bosta Actions State
  selectedOrderIds = new Set<number>();
  sendingBulk = false;
  bulkIsFulfillment = false;

  showStatusModal = false;
  selectedOrder: Order | null = null;
  newStatus: OrderStatus = OrderStatus.New;
  statusNotes = '';

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    private bostaService: BostaService,
    private shippingService: ShippingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.checkBostaIntegration();
  }

  checkBostaIntegration(): void {
    this.shippingService.getAll().subscribe({
      next: (companies) => {
        this.hasBostaIntegration = companies.some(c => c.isIntegrated && (c.name.toLowerCase().includes('bosta') || c.name.includes('بوسطة')));
      },
      error: () => this.hasBostaIntegration = false
    });
  }

  toggleSelectAll(): void {
    const currentOrders = this.orders();
    if (this.isAllSelected()) {
      currentOrders.forEach(o => this.selectedOrderIds.delete(o.id));
    } else {
      currentOrders.forEach(o => this.selectedOrderIds.add(o.id));
    }
  }

  isAllSelected(): boolean {
    const currentOrders = this.orders();
    if (currentOrders.length === 0) return false;
    return currentOrders.every(o => this.selectedOrderIds.has(o.id));
  }

  toggleSelectOrder(id: number): void {
    if (this.selectedOrderIds.has(id)) {
      this.selectedOrderIds.delete(id);
    } else {
      this.selectedOrderIds.add(id);
    }
  }

  clearSelection(): void {
    this.selectedOrderIds.clear();
  }

  getConfirmedSelectedOrdersCount(): number {
    return this.orders().filter(o => this.selectedOrderIds.has(o.id) && (o.status === OrderStatus.Confirmed || o.status === OrderStatus.New)).length;
  }

  sendBulkToBosta(): void {
    if (this.selectedOrderIds.size === 0) return;

    const allSelectedOrders = this.orders().filter(o => this.selectedOrderIds.has(o.id));
    const confirmedOrders = allSelectedOrders.filter(o => o.status === OrderStatus.Confirmed || o.status === OrderStatus.New);

    if (confirmedOrders.length === 0) {
      this.notificationService.warning('لا توجد طلبات مؤكدة بين الطلبات المحددة. الشحن متاح للطلبات المؤكدة فقط.');
      return;
    }

    const idsToSend = confirmedOrders.map(o => o.id);
    const sourceText = this.bulkIsFulfillment ? 'مخزن بوسطة (Fulfillment)' : 'المخزن الخاص';

    let confirmMsg = `هل أنت متأكد من إرسال ${confirmedOrders.length} أوردر مؤكد إلى بوسطة (${sourceText}) وتوليد أرقام التتبع تلقائياً؟`;
    if (allSelectedOrders.length > confirmedOrders.length) {
      const skippedCount = allSelectedOrders.length - confirmedOrders.length;
      confirmMsg = `تنبيه: تم تحديد ${allSelectedOrders.length} طلب، منها ${confirmedOrders.length} طلب مؤكد فقط جاهز للشحن.\n(سيتم تخطي ${skippedCount} طلب غير مؤكد تلقائياً).\n\nهل تريد الشحن لـ ${confirmedOrders.length} أوردر مؤكد فقط؟`;
    }

    this.notificationService.confirm(
      confirmMsg,
      'إرسال الشحنات المؤكدة لبوسطة'
    ).then(confirmed => {
      if (!confirmed) return;

      this.sendingBulk = true;
      this.bostaService.createBulkShipments(idsToSend, this.bulkIsFulfillment).subscribe({
        next: (res) => {
          this.sendingBulk = false;
          this.clearSelection();
          if (res.success) {
            this.notificationService.success(res.message || `تم إرسال ${res.successCount} أوردر مؤكد إلى بوسطة بنجاح واستقبال أرقام التتبع!`);
            this.loadOrders();
          } else {
            this.notificationService.error(res.message || 'حدث خطأ أثناء الإرسال لبوسطة');
          }
        },
        error: (err) => {
          this.sendingBulk = false;
          this.notificationService.error(err?.error?.Message || err?.error?.message || 'فشل إرسال الشحنات الجماعية لبوسطة');
        }
      });
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.orderService.getAll(
      this.selectedStatus || undefined,
      this.fromDate || undefined,
      this.toDate || undefined,
      undefined,
      this.pageNumber(),
      this.pageSize,
      this.searchTerm.trim() || undefined
    ).subscribe({
      next: (res: PagedResult<Order>) => {
        this.orders.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.hasPreviousPage.set(res.hasPreviousPage);
        this.hasNextPage.set(res.hasNextPage);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(): void {
    this.pageNumber.set(1);
    this.loadOrders();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.pageNumber.set(1);
    this.loadOrders();
  }

  toggleDateFilter(): void {
    this.showDateFilter = !this.showDateFilter;
  }

  selectStatus(status: OrderStatus | null): void {
    this.selectedStatus = status;
    this.pageNumber.set(1);
    this.loadOrders();
  }

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadOrders();
  }

  clearDates(): void {
    this.fromDate = '';
    this.toDate = '';
    this.pageNumber.set(1);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.pageNumber.update(p => p + 1);
      this.loadOrders();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageNumber.update(p => p - 1);
      this.loadOrders();
    }
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

  openWhatsApp(phone?: string, orderNumber?: string, id?: number, customerName?: string): void {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('2') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    const orderRef = this.getDisplayOrderNumber(orderNumber, id);
    const msg = encodeURIComponent(`مرحباً ${customerName || ''} 👋\nبخصوص طلبك رقم #${orderRef} من متجرنا:`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  openStatusModal(order: Order): void {
    this.selectedOrder = order;
    this.newStatus = order.status;
    this.statusNotes = '';
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedOrder = null;
  }

  saveStatusUpdate(): void {
    if (!this.selectedOrder) return;

    this.orderService.updateStatus(this.selectedOrder.id, this.newStatus, this.statusNotes).subscribe({
      next: () => {
        this.closeStatusModal();
        this.notificationService.success('تم تحديث حالة الأوردر بنجاح');
        this.loadOrders();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ أثناء تحديث الحالة')
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
      case 'Delivered': return 'تم التوصيل';
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

  getBadgeClass(status: string): string {
    switch (status) {
      case 'New': return 'badge-new';
      case 'Confirming': return 'badge-confirming';
      case 'Confirmed': return 'badge-confirmed';
      case 'Shipped': return 'badge-shipped';
      case 'Delivered': return 'badge-delivered';
      case 'Cancelled': return 'badge-cancelled';
      case 'Returned': return 'badge-returned';
      default: return 'badge-new';
    }
  }

  getStatusPillActiveClass(status?: OrderStatus | string): string {
    switch (status) {
      case 'New': case OrderStatus.New:
        return 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-900/30';
      case 'Confirming': case OrderStatus.Confirming:
        return 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-900/30';
      case 'Confirmed': case OrderStatus.Confirmed:
        return 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-900/30';
      case 'Shipped': case OrderStatus.Shipped:
        return 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-900/30';
      case 'Delivered': case OrderStatus.Delivered:
        return 'bg-teal-500 text-white border-teal-400 shadow-md shadow-teal-900/30';
      case 'Cancelled': case OrderStatus.Cancelled:
        return 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-900/30';
      case 'Returned': case OrderStatus.Returned:
        return 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-900/30';
      default:
        return 'bg-indigo-500 text-white border-indigo-400 shadow-md';
    }
  }
}
