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
  isSyncingBosta = false;
  bulkIsFulfillment = false;
  bulkProgressPercent = 0;
  bulkProcessedCount = 0;
  bulkTotalCount = 0;
  bulkStatusMessage = '';

  showStatusModal = false;
  selectedOrder: Order | null = null;
  newStatus: OrderStatus = OrderStatus.New;
  statusNotes = '';

  // Bulk Bosta Result Modal State
  showBulkResultModal = false;
  bulkResultData: {
    success: boolean;
    message: string;
    totalProcessed: number;
    successCount: number;
    results: { orderId: number; orderNumber: string; success: boolean; trackingNumber?: string; errorMessage?: string }[];
  } | null = null;

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService,
    public bostaService: BostaService,
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

  isBostaOrder(order: Order): boolean {
    const companyName = order.shippingCompanyName || '';
    if (!companyName) return true; // Default if no company specified yet
    return companyName.toLowerCase().includes('bosta') || companyName.includes('بوسطة');
  }

  hasNonBostaSelected(): boolean {
    const selected = this.orders().filter(o => this.selectedOrderIds.has(o.id));
    if (selected.length === 0) return false;
    return selected.some(o => !this.isBostaOrder(o));
  }

  syncBostaStatuses(): void {
    this.isSyncingBosta = true;
    this.bostaService.syncAllPendingShipments().subscribe({
      next: (res) => {
        this.isSyncingBosta = false;
        this.notificationService.success(res.message || 'تمت مزامنة حالات بوسطة بنجاح!');
        this.loadOrders();
      },
      error: (err) => {
        this.isSyncingBosta = false;
        this.notificationService.error(err.error?.message || 'حدث خطأ أثناء مزامنة حالات بوسطة');
      }
    });
  }

  sendBulkToBosta(): void {
    if (this.selectedOrderIds.size === 0) return;

    const allSelectedOrders = this.orders().filter(o => this.selectedOrderIds.has(o.id));
    
    // Validate that all selected orders belong to Bosta
    const nonBosta = allSelectedOrders.filter(o => !this.isBostaOrder(o));
    if (nonBosta.length > 0) {
      this.notificationService.error(`تنبيه: يوجد ${nonBosta.length} طلب غير تابع لشركة بوسطة. يرجى تحديد طلبات شركة بوسطة فقط للشحن لبوسطة.`);
      return;
    }

    const confirmedOrders = allSelectedOrders.filter(o => o.status === OrderStatus.Confirmed || o.status === OrderStatus.New);

    if (confirmedOrders.length === 0) {
      this.notificationService.warning('لا توجد طلبات مؤكدة بين الطلبات المحددة. الشحن متاح للطلبات المؤكدة فقط.');
      return;
    }

    const idsToSend = confirmedOrders.map(o => o.id);
    const sourceText = this.bulkIsFulfillment ? 'مخزن بوسطة (Fulfillment)' : 'المخزن الخاص';

    let confirmMsg = `هل أنت متأكد من إرسال ${confirmedOrders.length} أوردر مؤكد إلى بوسطة (${sourceText}) وتوليد أرقام التتبع تلقائياً؟\n\n(ملاحظة: في حال وجود شحنة سابقة لأي من الطلبات المحددة، سيتم إلغاؤها في النظام وتوليد رقم بولصة وتتبع جديد 100% من بوسطة).`;
    if (allSelectedOrders.length > confirmedOrders.length) {
      const skippedCount = allSelectedOrders.length - confirmedOrders.length;
      confirmMsg = `تنبيه: تم تحديد ${allSelectedOrders.length} طلب، منها ${confirmedOrders.length} طلب مؤكد فقط جاهز للشحن.\n(سيتم تخطي ${skippedCount} طلب غير مؤكد تلقائياً).\n\nملاحظة: في حال وجود بولصة سابقة لأي طلب، سيتم تجديدها وبدء شحنة جديدة.\n\nهل تريد الشحن لـ ${confirmedOrders.length} أوردر مؤكد الآن؟`;
    }

    this.notificationService.confirm(
      confirmMsg,
      'إرسال الشحنات المؤكدة لبوسطة'
    ).then(confirmed => {
      if (!confirmed) return;

      this.sendingBulk = true;
      this.bulkTotalCount = idsToSend.length;
      this.bulkProcessedCount = 0;
      this.bulkProgressPercent = 10;
      this.bulkStatusMessage = `جاري بدء معالجة وتوليد البوالص لـ ${idsToSend.length} أوردر...`;

      const intervalStep = Math.max(300, Math.floor(4000 / idsToSend.length));
      const progressTimer = setInterval(() => {
        if (this.bulkProcessedCount < idsToSend.length - 1) {
          this.bulkProcessedCount++;
          this.bulkProgressPercent = Math.min(94, Math.round((this.bulkProcessedCount / idsToSend.length) * 100));
          this.bulkStatusMessage = `جاري الإرسال لبوسطة والحصول على رقم البولصة... (${this.bulkProcessedCount} من ${this.bulkTotalCount})`;
        }
      }, intervalStep);

      this.bostaService.createBulkShipments(idsToSend, this.bulkIsFulfillment).subscribe({
        next: (res) => {
          clearInterval(progressTimer);
          this.bulkProcessedCount = idsToSend.length;
          this.bulkProgressPercent = 100;
          this.bulkStatusMessage = 'اكتمل شحن جميع الطلبات وتوليد البوالص بنجاح!';

          setTimeout(() => {
            this.sendingBulk = false;
            this.clearSelection();
            this.bulkResultData = res;
            this.showBulkResultModal = true;
            this.loadOrders();
          }, 500);
        },
        error: (err) => {
          clearInterval(progressTimer);
          this.sendingBulk = false;
          this.notificationService.error(err?.error?.Message || err?.error?.message || 'فشل إرسال الشحنات الجماعية لبوسطة');
        }
      });
    });
  }

  closeBulkResultModal(): void {
    this.showBulkResultModal = false;
    this.bulkResultData = null;
  }

  copyTrackingNumber(trackingNumber?: string): void {
    if (!trackingNumber) return;
    navigator.clipboard.writeText(trackingNumber);
    this.notificationService.success(`تم نسخ رقم البولصة: ${trackingNumber}`);
  }

  copyAllTrackingNumbers(): void {
    if (!this.bulkResultData || !this.bulkResultData.results) return;
    const trackingNumbers = this.bulkResultData.results
      .filter(r => r.success && r.trackingNumber)
      .map(r => `أوردر #${r.orderNumber}: ${r.trackingNumber}`)
      .join('\n');
    if (trackingNumbers) {
      navigator.clipboard.writeText(trackingNumbers);
      this.notificationService.success('تم نسخ جميع أرقام البوالص بنجاح! 📋');
    }
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

  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.pageNumber.set(1);
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.pageNumber()) return;
    this.pageNumber.set(page);
    this.loadOrders();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.pageNumber();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, current - 2);
      let end = Math.min(total - 1, current + 2);

      if (current <= 3) {
        end = 5;
      } else if (current >= total - 2) {
        start = total - 4;
      }

      if (start > 2) {
        pages.push(-1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total - 1) {
        pages.push(-1);
      }

      pages.push(total);
    }

    return pages;
  }

  goToDetail(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  getDisplayOrderNumber(orderNumber?: string, id?: number): string {
    if (!orderNumber) return id ? id.toString() : '1';
    let clean = orderNumber.trim();
    while (clean.startsWith('#')) {
      clean = clean.substring(1).trim();
    }
    return clean || (id ? id.toString() : '1');
  }

  openWhatsApp(phone?: string, orderNumber?: string, id?: number, customerName?: string, salesPlatformName?: string, orderItems?: any[], totalAmount?: number): void {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('2') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    const platform = salesPlatformName || 'المتجر';
    
    let itemsText = '';
    if (orderItems && orderItems.length > 0) {
      itemsText = '\nوعبارة عن:\n' + orderItems.map(item => `• ${item.productName || item.productCode || 'منتج'} (عدد: ${item.quantity})`).join('\n');
    }

    const totalText = totalAmount ? `\n\n💰 والتوتال: ${totalAmount} ج.م` : '';
    const messageText = `مرحبا ${customerName || ''} 👋\n` +
      `بخصوص طلبك من ${platform}${itemsText}${totalText}`;

    const msg = encodeURIComponent(messageText);
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
