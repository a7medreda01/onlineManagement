import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { ShippingService } from '../../services/shipping.service';
import { GovernorateService } from '../../services/governorate.service';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { BostaService, BostaShipmentDto, BostaDeliveryType, BostaShipmentSource, CreateBostaShipmentDto } from '../../services/bosta.service';
import { Order, OrderStatus, Product, ShippingCompany, Governorate, SalesPlatform, Wallet } from '../../models/models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent implements OnInit {
  order = signal<Order | null>(null);
  loading = signal<boolean>(true);
  OrderStatus = OrderStatus;

  showStatusModal = false;
  newStatus: OrderStatus = OrderStatus.New;
  statusNotes = '';
  updating = false;

  // Edit Order Modal States
  showEditModal = false;
  savingEdit = false;
  availableProducts: Product[] = [];
  shippingCompanies: ShippingCompany[] = [];
  governorates: Governorate[] = [];
  salesPlatforms: SalesPlatform[] = [];
  wallets: Wallet[] = [];

  // Deposit Modal State
  showDepositModal = false;
  depositAmount: number | null = null;
  selectedWalletId = 0;
  depositRef = '';
  depositNotes = '';
  savingDeposit = false;

  editForm = {
    customerName: '',
    customerPhone: '',
    customerSecondaryPhone: '',
    governorateId: 0,
    customerAddress: '',
    shippingCompanyId: 0,
    salesPlatformId: 0,
    notes: '',
    depositAmount: 0,
    paidToWalletId: 0
  };

  editItems: { productId: number; quantity: number; customSellingPrice: number }[] = [];
  editSubTotal = 0;
  editShippingCost = 0;

  // Bosta Integration States
  bostaShipment: BostaShipmentDto | null = null;
  showBostaModal = false;
  creatingBostaShipment = false;
  bostaDeliveryType: BostaDeliveryType = BostaDeliveryType.ForwardOrder;
  bostaSource: BostaShipmentSource = BostaShipmentSource.MerchantWarehouse;
  bostaCodAmount = 0;
  bostaNotes = '';
  bostaExchangeDetails = '';

  BostaDeliveryType = BostaDeliveryType;
  BostaShipmentSource = BostaShipmentSource;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private productService: ProductService,
    private shippingService: ShippingService,
    private governorateService: GovernorateService,
    private authService: AuthService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private bostaService: BostaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadOrder(id);
        this.loadBostaShipment(id);
      }
    });

    this.loadLookups();
  }

  get hasBostaIntegration(): boolean {
    return this.shippingCompanies.some(c => c.isIntegrated && (c.name.toLowerCase().includes('bosta') || c.name.includes('بوسطة')));
  }

  isOrderBostaShipping(): boolean {
    if (!this.hasBostaIntegration) return false;
    const compName = this.order()?.shippingCompanyName?.toLowerCase() || '';
    return compName.includes('bosta') || compName.includes('بوسطة');
  }

  loadLookups(): void {
    this.productService.getAll().subscribe((res: Product[]) => this.availableProducts = res);
    this.shippingService.getAll().subscribe((res: ShippingCompany[]) => {
      this.shippingCompanies = res.filter(c => {
        const isBosta = c.name.toLowerCase().includes('bosta') || c.name.includes('بوسطة');
        return isBosta ? c.isIntegrated === true : true;
      });
    });
    this.governorateService.getGovernorates().subscribe((res: Governorate[]) => this.governorates = res);
    this.orderService.getSalesPlatforms().subscribe((res: SalesPlatform[]) => this.salesPlatforms = res);
    this.walletService.getAll().subscribe((res: Wallet[]) => {
      this.wallets = res;
      if (res.length > 0 && !this.selectedWalletId) {
        this.selectedWalletId = res[0].id;
      }
    });
  }

  loadBostaShipment(orderId: number): void {
    this.bostaService.getShipmentByOrderId(orderId).subscribe({
      next: (res) => this.bostaShipment = res,
      error: () => this.bostaShipment = null
    });
  }

  loadOrder(id: number): void {
    this.loading.set(true);
    this.orderService.getById(id).subscribe({
      next: (res) => {
        this.order.set(res);
        this.newStatus = res.status;
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.notificationService.error('لم يتم العثور على الأوردر');
        this.router.navigate(['/orders']);
      }
    });
  }

  getDisplayOrderNumber(orderNumber?: string, id?: number): string {
    if (orderNumber && orderNumber.startsWith('#')) {
      return orderNumber.replace('#', '');
    }
    return id ? id.toString() : '1';
  }

  isItemFulfillment(item: any): boolean {
    if (!item) return false;
    const code = item.productCode || item.productSku || item.code || '';
    return item.isFulfillment || code.startsWith('BO-') || code.startsWith('BST-');
  }

  hasBostaFulfillmentItems(): boolean {
    const items = this.order()?.orderItems || [];
    return items.some((item: any) => this.isItemFulfillment(item));
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Stepper calculations (4 steps only: New → Confirmed → Shipped → Delivered)
  getStepperProgressWidth(): number {
    const s = this.order()?.status;
    switch (s) {
      case OrderStatus.New: return 0;
      case OrderStatus.Confirming:
      case OrderStatus.Confirmed: return 33;
      case OrderStatus.Shipped: return 66;
      case OrderStatus.Delivered: return 100;
      default: return 0;
    }
  }

  toggleBodyScroll(lock: boolean): void {
    if (typeof document !== 'undefined') {
      if (lock) {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      } else {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
  }

  getStepperLineClass(): string {
    const s = this.order()?.status;
    if (s === OrderStatus.Delivered) return 'bg-emerald-500';
    return 'bg-indigo-500';
  }

  getStepCircleClass(step: number): string {
    const s = this.order()?.status;
    let currentStep = 1;
    if (s === OrderStatus.Confirming || s === OrderStatus.Confirmed) currentStep = 2;
    if (s === OrderStatus.Shipped) currentStep = 3;
    if (s === OrderStatus.Delivered) currentStep = 4;

    const isActiveOrPassed = step <= currentStep;

    switch (step) {
      case 1:
        return isActiveOrPassed
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 border-2 border-blue-400'
          : 'bg-white text-blue-500 border-2 border-blue-200 shadow-sm';
      case 2:
        return isActiveOrPassed
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-100 border-2 border-indigo-400'
          : 'bg-white text-indigo-400 border-2 border-indigo-200 shadow-sm';
      case 3:
        return isActiveOrPassed
          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-4 ring-amber-100 border-2 border-amber-400'
          : 'bg-white text-amber-500 border-2 border-amber-200 shadow-sm';
      case 4:
        return isActiveOrPassed
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100 border-2 border-emerald-400'
          : 'bg-white text-emerald-500 border-2 border-emerald-200 shadow-sm';
      default:
        return 'bg-white text-slate-400 border-2 border-slate-200';
    }
  }

  quickCancel(): void {
    this.notificationService.confirm('هل أنت تأكد من إلغاء هذا الأوردر؟', 'إلغاء الأوردر').then(confirmed => {
      if (confirmed && this.order()) {
        this.orderService.updateStatus(this.order()!.id, OrderStatus.Cancelled, 'إلغاء سريعي من صفحة الأوردر').subscribe({
          next: (updated) => {
            this.order.set(updated);
            this.notificationService.success('تم إلغاء الأوردر بنجاح');
          },
          error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ أثناء الإلغاء')
        });
      }
    });
  }

  // Open Full Order Edit Modal
  openEditModal(): void {
    this.toggleBodyScroll(true);
    const o = this.order();
    if (!o) return;

    this.editForm = {
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerSecondaryPhone: o.customerSecondaryPhone || '',
      governorateId: o.governorateId,
      customerAddress: o.customerAddress,
      shippingCompanyId: o.shippingCompanyId,
      salesPlatformId: o.salesPlatformId,
      notes: o.notes || '',
      depositAmount: o.depositAmount || 0,
      paidToWalletId: o.paidToWalletId || 0
    };

    this.editItems = o.orderItems.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      customSellingPrice: i.sellingPrice
    }));

    this.recalculateEditTotals();
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.toggleBodyScroll(false);
    this.showEditModal = false;
  }

  addEditItem(): void {
    if (this.availableProducts.length > 0) {
      const p = this.availableProducts[0];
      this.editItems.push({
        productId: p.id,
        quantity: 1,
        customSellingPrice: p.sellingPrice
      });
      this.recalculateEditTotals();
    }
  }

  removeEditItem(index: number): void {
    this.editItems.splice(index, 1);
    this.recalculateEditTotals();
  }

  onEditProductSelect(item: { productId: number; customSellingPrice: number }): void {
    const p = this.availableProducts.find(x => x.id == item.productId);
    if (p) {
      item.customSellingPrice = p.sellingPrice;
    }
    this.recalculateEditTotals();
  }

  onEditShippingCompanyOrGovChange(): void {
    this.recalculateEditTotals();
  }

  recalculateEditTotals(): void {
    let sub = 0;
    this.editItems.forEach(i => {
      sub += (i.customSellingPrice || 0) * (i.quantity || 1);
    });
    this.editSubTotal = sub;

    if (this.editForm.governorateId && this.editForm.shippingCompanyId) {
      this.orderService.calculateCosts({
        governorateId: +this.editForm.governorateId,
        shippingCompanyId: +this.editForm.shippingCompanyId,
        items: this.editItems.map(i => ({ productId: +i.productId, quantity: i.quantity, customSellingPrice: i.customSellingPrice }))
      }).subscribe(res => {
        this.editShippingCost = res.shippingCost;
      });
    }
  }

  saveOrderEdit(): void {
    if (!this.order()) return;
    if (this.editItems.length === 0) {
      this.notificationService.error('يجب اختيار منتج واحد على الأقل في الأوردر');
      return;
    }

    this.savingEdit = true;
    const payload = {
      customerName: this.editForm.customerName,
      customerPhone: this.editForm.customerPhone,
      customerSecondaryPhone: this.editForm.customerSecondaryPhone,
      governorateId: +this.editForm.governorateId,
      customerAddress: this.editForm.customerAddress,
      shippingCompanyId: +this.editForm.shippingCompanyId,
      salesPlatformId: +this.editForm.salesPlatformId,
      notes: this.editForm.notes,
      items: this.editItems.map(i => ({
        productId: +i.productId,
        quantity: i.quantity,
        customSellingPrice: i.customSellingPrice
      }))
    };

    this.orderService.update(this.order()!.id, payload).subscribe({
      next: (updated) => {
        this.savingEdit = false;
        this.showEditModal = false;
        this.notificationService.success('تم تحديث بيانات الأوردر والمنتجات بنجاح!');
        this.order.set(updated);
      },
      error: (err) => {
        this.savingEdit = false;
        this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء حفظ التعديلات');
      }
    });
  }

  openStatusModal(): void {
    if (this.order()) {
      this.newStatus = this.order()!.status;
      this.statusNotes = '';
      this.showStatusModal = true;
    }
  }

  // --- Deposit Methods ---
  // --- Deposit Methods ---
  openDepositModal(): void {
    const current = this.order();
    if (!current) return;
    this.depositAmount = null;
    this.selectedWalletId = this.wallets.length > 0 ? (current.paidToWalletId || this.wallets[0].id) : 0;
    this.depositRef = '';
    this.depositNotes = '';
    this.showDepositModal = true;
    this.toggleBodyScroll(true);
  }

  saveDeposit(): void {
    const current = this.order();
    if (!current || !this.selectedWalletId || !this.depositAmount || this.depositAmount <= 0) {
      this.notificationService.error('يرجى اختيار المحفظة وإدخال مبلغ عربون صحيح');
      return;
    }

    this.savingDeposit = true;
    this.walletService.recordDeposit({
      orderId: current.id,
      walletId: Number(this.selectedWalletId),
      amount: Number(this.depositAmount),
      referenceNumber: this.depositRef?.trim() || '',
      notes: this.depositNotes?.trim() || ''
    }).subscribe({
      next: () => {
        this.savingDeposit = false;
        this.showDepositModal = false;
        this.toggleBodyScroll(false);
        this.notificationService.success('تم تسجيل استلام العربون وتحديث الأوردر والخزينة بنجاح');
        this.loadOrder(current.id);
      },
      error: (err) => {
        this.savingDeposit = false;
        this.notificationService.error(err?.error?.message || err?.error?.Message || 'فشل تسجيل العربون');
      }
    });
  }

  // Bosta Methods
  bostaIsFulfillment = false;

  openBostaModal(): void {
    const current = this.order();
    if (!current) return;
    const remaining = current.totalAmount - (current.depositAmount || 0);
    this.bostaCodAmount = remaining >= 0 ? remaining : current.totalAmount;
    this.bostaDeliveryType = BostaDeliveryType.ForwardOrder;
    this.bostaSource = BostaShipmentSource.MerchantWarehouse;
    this.bostaIsFulfillment = false;
    this.bostaNotes = '';
    this.bostaExchangeDetails = '';
    this.showBostaModal = true;
  }

  submitBostaShipment(): void {
    if (!this.order()) return;

    this.creatingBostaShipment = true;
    const isFulfill = this.bostaSource === BostaShipmentSource.BostaFulfillment || this.bostaIsFulfillment;
    const dto: CreateBostaShipmentDto = {
      orderId: this.order()!.id,
      deliveryType: this.bostaDeliveryType,
      source: isFulfill ? BostaShipmentSource.BostaFulfillment : this.bostaSource,
      codAmount: this.bostaCodAmount,
      notes: this.bostaNotes,
      isFulfillment: isFulfill,
      exchangeItemDetails: this.bostaExchangeDetails
    };

    this.bostaService.createShipment(dto).subscribe({
      next: (res) => {
        this.bostaShipment = res;
        this.creatingBostaShipment = false;
        this.showBostaModal = false;
        this.notificationService.success(`تم إنشاء وتصدير شحنة بوسطة بنجاح! رقم التتبع: #${res.bostaTrackingNumber}`);
        this.loadOrder(this.order()!.id);
      },
      error: (err) => {
        this.creatingBostaShipment = false;
        this.notificationService.error(err?.error?.Message || err?.error?.message || 'حدث خطأ أثناء إرسال الشحنة لبوسطة');
      }
    });
  }

  printBostaAwb(): void {
    if (!this.bostaShipment || !this.bostaShipment.bostaTrackingNumber) return;
    this.bostaService.getAwbPdfBlob(this.bostaShipment.bostaTrackingNumber).subscribe({
      next: (blob) => {
        const file = new Blob([blob], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        window.open(fileURL, '_blank');
      },
      error: () => {
        window.open(this.bostaService.getAwbPdfUrl(this.bostaShipment!.bostaTrackingNumber), '_blank');
      }
    });
  }

  updateStatus(): void {
    if (!this.order()) return;

    this.updating = true;
    this.orderService.updateStatus(this.order()!.id, this.newStatus, this.statusNotes).subscribe({
      next: (updatedOrder) => {
        this.updating = false;
        this.showStatusModal = false; this.toggleBodyScroll(false);
        this.notificationService.success('تم تحديث حالة الأوردر بنجاح');
        this.order.set(updatedOrder);
      },
      error: (err) => {
        this.updating = false;
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء تحديث الحالة');
      }
    });
  }

  printReceipt(): void {
    window.print();
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

  getStatusBadgeClass(status?: OrderStatus | string): string {
    switch (status) {
      case OrderStatus.New:
      case 'New': return 'badge-new';
      case OrderStatus.Confirming:
      case 'Confirming': return 'badge-confirming';
      case OrderStatus.Confirmed:
      case 'Confirmed': return 'badge-confirmed';
      case OrderStatus.Shipped:
      case 'Shipped': return 'badge-shipped';
      case OrderStatus.Delivered:
      case 'Delivered': return 'badge-delivered';
      case OrderStatus.Cancelled:
      case 'Cancelled': return 'badge-cancelled';
      case OrderStatus.Returned:
      case 'Returned': return 'badge-returned';
      default: return 'badge-new';
    }
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.success('تم نسخ: ' + text);
    }).catch(() => {
      this.notificationService.error('تعذر النسخ');
    });
  }

  getBostaTrackingUrl(trackingNumOrUrl?: string): string {
    if (!trackingNumOrUrl) return 'https://bosta.co/en-eg/tracking-shipments';
    if (trackingNumOrUrl.startsWith('http')) {
      const match = trackingNumOrUrl.match(/(?:trackingNumber|shipment-number)=([^&]+)/);
      if (match && match[1]) {
        return `https://bosta.co/en-eg/tracking-shipments?shipment-number=${match[1]}`;
      }
      return trackingNumOrUrl;
    }
    return `https://bosta.co/en-eg/tracking-shipments?shipment-number=${trackingNumOrUrl}`;
  }

  openWhatsApp(phone?: string): void {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('2') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    const orderRef = this.getDisplayOrderNumber(this.order()?.orderNumber, this.order()?.id);
    const msg = encodeURIComponent(`مرحباً ${this.order()?.customerName || ''} 👋\nبخصوص طلبك رقم #${orderRef} من متجرنا:`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }
}


