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
import { Order, OrderStatus, Product, ShippingCompany, Governorate, SalesPlatform, Wallet, BostaCity, BostaDistrict } from '../../models/models';

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
    paidToWalletId: 0,
    customTotalAmount: 0
  };

  editItems: { productId: number; quantity: number; customSellingPrice: number }[] = [];
  editSubTotal = 0;
  editShippingCost = 0;
  isCustomTotal = false;

  // Bosta Integration States
  bostaShipment: BostaShipmentDto | null = null;
  showBostaModal = false;
  creatingBostaShipment = false;
  bostaDeliveryType: BostaDeliveryType = BostaDeliveryType.ForwardOrder;
  bostaSource: BostaShipmentSource = BostaShipmentSource.MerchantWarehouse;
  bostaCodAmount = 0;
  bostaNotes = '';
  bostaExchangeDetails = '';

  bostaCities: BostaCity[] = [];
  selectedBostaCityId: string = '';
  selectedBostaDistrictId: string = '';
  availableDistricts: BostaDistrict[] = [];

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
    this.bostaService.getZones().subscribe({
      next: (res: BostaCity[]) => this.bostaCities = res,
      error: () => this.bostaCities = []
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
    const o = this.order();
    if (!o) return;
    this.toggleBodyScroll(true);

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
      paidToWalletId: o.paidToWalletId || 0,
      customTotalAmount: o.totalAmount
    };

    this.editItems = o.orderItems.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      customSellingPrice: i.sellingPrice
    }));

    this.isCustomTotal = false;
    this.recalculateEditTotals();
    this.autoMatchBostaCityAndDistrictForEdit();
    this.showEditModal = true;
  }

  // Zone Search Modal State in order-detail
  showZoneModal = false;
  zoneSearchQuery = '';

  normalizeArabic(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\(.*\)/g, '')
      .replace(/[^a-zA-Z0-9\u0621-\u064A\s]/g, '')
      .trim();
  }

  autoMatchBostaCityAndDistrictForEdit(): void {
    const govId = +this.editForm.governorateId;
    const gov = this.governorates.find(g => g.id === govId);
    if (!gov || this.bostaCities.length === 0) {
      this.selectedBostaCityId = '';
      this.availableDistricts = [];
      this.selectedBostaDistrictId = '';
      return;
    }

    const normGov = this.normalizeArabic(gov.name);
    let matchedCity = this.bostaCities.find(c => {
      const normCityOther = this.normalizeArabic(c.cityOtherName);
      const normCityName = this.normalizeArabic(c.cityName);
      return (normCityOther && (normCityOther.includes(normGov) || normGov.includes(normCityOther))) ||
             (normCityName && (normCityName.includes(normGov) || normGov.includes(normCityName)));
    });

    if (!matchedCity) {
      const codeMap: { [key: string]: string } = {
        'القاهرة': 'EG-01', 'الجيزة': 'EG-02', 'الإسكندرية': 'EG-03', 'القليوبية': 'EG-04',
        'الدقهلية': 'EG-05', 'المنوفية': 'EG-06', 'الغربية': 'EG-07', 'الشرقية': 'EG-08',
        'البحيرة': 'EG-09', 'دمياط': 'EG-10', 'كفر الشيخ': 'EG-11', 'الإسماعيلية': 'EG-12',
        'بورسعيد': 'EG-13', 'السويس': 'EG-14', 'سوهاج': 'EG-15', 'أسيوط': 'EG-16',
        'قنا': 'EG-17', 'المنيا': 'EG-18', 'بني سويف': 'EG-19', 'الفيوم': 'EG-20',
        'البحر الأحمر': 'EG-21', 'الوادي الجديد': 'EG-22', 'مطروح': 'EG-23',
        'شمال سيناء': 'EG-24', 'جنوب سيناء': 'EG-25', 'الأقصر': 'EG-26', 'أسوان': 'EG-27'
      };
      const expectedCode = codeMap[gov.name] || codeMap[gov.name.replace('محافظة ', '')];
      if (expectedCode) {
        matchedCity = this.bostaCities.find(c => c.cityCode === expectedCode);
      }
    }

    if (matchedCity) {
      this.selectedBostaCityId = matchedCity.cityId;
      this.availableDistricts = matchedCity.districts || [];
    } else {
      this.selectedBostaCityId = '';
      this.availableDistricts = [];
    }
    this.selectedBostaDistrictId = '';
  }

  smartExtractLocationFromEditAddress(): void {
    const rawAddr = this.editForm.customerAddress || '';
    if (!rawAddr || rawAddr.trim().length < 2) return;

    const normAddr = this.normalizeArabic(rawAddr);
    let matchedGov: Governorate | undefined = undefined;
    let matchedCity: BostaCity | undefined = undefined;
    let matchedDist: BostaDistrict | undefined = undefined;

    for (const gov of this.governorates) {
      const normGovName = this.normalizeArabic(gov.name);
      if (normAddr.includes(normGovName)) {
        matchedGov = gov;
        break;
      }
    }

    for (const city of this.bostaCities) {
      if (city.districts) {
        for (const dist of city.districts) {
          const normDistName = this.normalizeArabic(dist.districtOtherName);
          const normDistEn = this.normalizeArabic(dist.districtName);
          if ((normDistName && normDistName.length > 2 && normAddr.includes(normDistName)) ||
              (normDistEn && normDistEn.length > 2 && normAddr.includes(normDistEn))) {
            matchedDist = dist;
            matchedCity = city;
            break;
          }
        }
      }
      if (matchedDist) break;
    }

    if (matchedGov) {
      this.editForm.governorateId = matchedGov.id;
      this.onEditShippingCompanyOrGovChange();
    }

    if (matchedCity) {
      this.selectedBostaCityId = matchedCity.cityId;
      this.availableDistricts = matchedCity.districts || [];
    }

    if (matchedDist) {
      this.selectedBostaDistrictId = matchedDist.districtId;
    }

    if (matchedGov || matchedDist) {
      const govMsg = matchedGov ? `المحافظة: ${matchedGov.name}` : '';
      const distMsg = matchedDist ? `المنطقة: ${matchedDist.districtOtherName}` : '';
      this.notificationService.success(`✨ تم الاستخراج الذكي بنجاح! (${[govMsg, distMsg].filter(Boolean).join(' | ')})`);
    }
  }

  openZoneSearchModal(): void {
    this.zoneSearchQuery = '';
    this.showZoneModal = true;
  }

  closeZoneSearchModal(): void {
    this.showZoneModal = false;
  }

  getFilteredZoneItems(): { city: BostaCity; dist: BostaDistrict; govMatch?: Governorate }[] {
    if (!this.bostaCities || this.bostaCities.length === 0) return [];
    const query = this.normalizeArabic(this.zoneSearchQuery);
    const items: { city: BostaCity; dist: BostaDistrict; govMatch?: Governorate }[] = [];

    for (const city of this.bostaCities) {
      const normCity = this.normalizeArabic(city.cityOtherName + ' ' + city.cityName);
      const govMatch = this.governorates.find(g => {
        const ng = this.normalizeArabic(g.name);
        return normCity.includes(ng) || ng.includes(normCity);
      });

      if (city.districts) {
        for (const dist of city.districts) {
          const normDist = this.normalizeArabic(dist.districtOtherName + ' ' + dist.districtName);
          if (!query || normDist.includes(query) || normCity.includes(query)) {
            items.push({ city, dist, govMatch });
          }
        }
      }
    }
    return items.slice(0, 100);
  }

  selectZoneFromModal(item: { city: BostaCity; dist: BostaDistrict; govMatch?: Governorate }): void {
    if (item.govMatch) {
      this.editForm.governorateId = item.govMatch.id;
      this.onEditShippingCompanyOrGovChange();
    }
    this.selectedBostaCityId = item.city.cityId;
    this.availableDistricts = item.city.districts || [];
    this.selectedBostaDistrictId = item.dist.districtId;

    if (item.dist.districtOtherName && !this.editForm.customerAddress.includes(item.dist.districtOtherName)) {
      const current = this.editForm.customerAddress.trim();
      this.editForm.customerAddress = current ? `${item.dist.districtOtherName} - ${current}` : item.dist.districtOtherName;
    }

    this.closeZoneSearchModal();
    this.notificationService.success(`تم تحديد المنطقة: ${item.dist.districtOtherName} (${item.city.cityOtherName}) بنجاح`);
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
        if (!this.isCustomTotal) {
          this.editForm.customTotalAmount = this.editSubTotal + this.editShippingCost;
        }
      });
    } else {
      if (!this.isCustomTotal) {
        this.editForm.customTotalAmount = this.editSubTotal + this.editShippingCost;
      }
    }
  }

  onCustomTotalInput(): void {
    this.isCustomTotal = true;
    if (this.editForm.customTotalAmount != null && this.editForm.customTotalAmount >= 0) {
      const totalMinusShipping = this.editForm.customTotalAmount - (this.editShippingCost || 0);
      const totalQty = this.editItems.reduce((sum, i) => sum + (i.quantity || 1), 0);

      if (totalQty > 0 && totalMinusShipping >= 0) {
        const pricePerUnit = totalMinusShipping / totalQty;
        this.editItems.forEach(i => {
          i.customSellingPrice = Math.round(pricePerUnit * 100) / 100;
        });
        const rawSub = this.editItems.reduce((acc, i) => acc + ((i.customSellingPrice || 0) * (i.quantity || 1)), 0);
        this.editSubTotal = Math.round(rawSub * 100) / 100;
      }
    }
  }

  resetTotalToCalculated(): void {
    this.isCustomTotal = false;
    this.editItems.forEach(item => {
      const p = this.availableProducts.find(pr => pr.id === +item.productId);
      if (p) {
        item.customSellingPrice = p.sellingPrice;
      }
    });
    this.recalculateEditTotals();
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
      customTotalAmount: this.editForm.customTotalAmount,
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
    this.selectedBostaCityId = '';
    this.selectedBostaDistrictId = '';
    this.availableDistricts = [];

    // Try to auto-match city from governorate name
    if (this.bostaCities.length > 0 && current.governorateName) {
      const match = this.bostaCities.find(c =>
        c.cityOtherName.includes(current.governorateName) ||
        current.governorateName.includes(c.cityOtherName) ||
        c.cityName.toLowerCase().includes(current.governorateName.toLowerCase())
      );
      if (match) {
        this.selectedBostaCityId = match.cityId;
        this.onBostaCityChange();
      }
    }

    this.showBostaModal = true;
  }

  onBostaCityChange(): void {
    const city = this.bostaCities.find(c => c.cityId === this.selectedBostaCityId);
    this.availableDistricts = city ? city.districts : [];
    this.selectedBostaDistrictId = '';
  }

  submitBostaShipment(): void {
    if (!this.order()) return;

    this.creatingBostaShipment = true;
    const isFulfill = this.bostaSource === BostaShipmentSource.BostaFulfillment || this.bostaIsFulfillment;
    const selectedCity = this.bostaCities.find(c => c.cityId === this.selectedBostaCityId);

    const dto: CreateBostaShipmentDto = {
      orderId: this.order()!.id,
      deliveryType: this.bostaDeliveryType,
      source: isFulfill ? BostaShipmentSource.BostaFulfillment : this.bostaSource,
      codAmount: this.bostaCodAmount,
      notes: this.bostaNotes,
      isFulfillment: isFulfill,
      exchangeItemDetails: this.bostaExchangeDetails,
      cityId: this.selectedBostaCityId || undefined,
      districtId: this.selectedBostaDistrictId || undefined,
      cityName: selectedCity ? selectedCity.cityName : undefined
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

  makePhoneCall(phone?: string): void {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  }

  openWhatsApp(phone?: string): void {
    const currentOrder = this.order();
    if (!phone || !currentOrder) return;

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone;
    } else if (!cleanPhone.startsWith('2') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }

    const platformName = currentOrder.salesPlatformName || 'المتجر';
    const itemsText = (currentOrder.orderItems || [])
      .map(item => `• ${item.productName || item.productCode || 'منتج'} (عدد: ${item.quantity})`)
      .join('\n');

    const total = currentOrder.totalAmount || 0;

    const messageText = `مرحبا ${currentOrder.customerName || ''} 👋\n` +
      `بخصوص طلبك من ${platformName}\n` +
      `وعبارة عن:\n${itemsText}\n\n` +
      `💰 والتوتال: ${total} ج.م`;

    const msg = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }
}


