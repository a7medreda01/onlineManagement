import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';
import { ShippingService } from '../../services/shipping.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { BostaService } from '../../services/bosta.service';
import { Customer, CustomerProfileDto, CustomerSearchDto, Governorate, Order, Product, SalesPlatform, ShippingCompany, Wallet, BostaCity, BostaDistrict } from '../../models/models';
import { CustomDropdownComponent, DropdownOption } from '../shared/custom-dropdown/custom-dropdown.component';

interface OrderItemRow {
  productId: number;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDropdownComponent],
  templateUrl: './create-order.component.html'
})
export class CreateOrderComponent implements OnInit {
  currentStep = 1;

  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  governorates = signal<Governorate[]>([]);
  shippingCompanies = signal<ShippingCompany[]>([]);
  salesPlatforms = signal<SalesPlatform[]>([]);
  wallets = signal<Wallet[]>([]);

  bostaCities: BostaCity[] = [];
  selectedBostaCityId: string = '';
  selectedBostaDistrictId: string = '';
  availableDistricts: BostaDistrict[] = [];

  isNewCustomer = true;
  selectedCustomerId: number | null = null;
  newCustomer = { name: '', phone: '', secondaryPhone: '', address: '', governorateId: 0, notes: '' };

  // Live customer search state
  searchQuery = '';
  searchResults = signal<CustomerSearchDto[]>([]);
  selectedCustomerSearchDto: CustomerSearchDto | null = null;
  existingPhoneMatch: CustomerSearchDto | null = null;

  // History Profile Modal
  showCustomerHistoryModal = false;
  customerProfile: CustomerProfileDto | null = null;

  selectedItems: OrderItemRow[] = [{ productId: 0, quantity: 1, unitPrice: 0 }];
  selectedShippingCompanyId = 0;
  selectedSalesPlatformId = 0;
  orderNotes = '';

  depositAmount: number | null = null;
  selectedPaidToWalletId = 0;
  depositReference = '';

  calculatedSubTotal = 0;
  calculatedShippingCost = 0;
  calculatedTotalAmount = 0;

  get calculatedRemainingAmount(): number {
    return Math.max(0, Math.round(this.calculatedTotalAmount - (this.depositAmount || 0)));
  }

  showPlatformModal = false;
  newPlatformName = '';
  savingPlatform = false;

  submitting = false;

  constructor(
    private orderService: OrderService,
    private customerService: CustomerService,
    private productService: ProductService,
    private shippingService: ShippingService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private bostaService: BostaService,
    private router: Router
  ) {}

  isBostaFulfillmentOrder = false;

  ngOnInit(): void {
    const savedFulfillment = typeof localStorage !== 'undefined' ? localStorage.getItem('bosta_fulfillment_enabled') : null;
    if (savedFulfillment === 'true') {
      this.isBostaFulfillmentOrder = true;
    }
    this.loadLookups();
  }

  toggleBostaFulfillment(enabled?: boolean): void {
    if (enabled !== undefined) {
      this.isBostaFulfillmentOrder = enabled;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bosta_fulfillment_enabled', this.isBostaFulfillmentOrder.toString());
    }

    // Reset product selection in rows if chosen product doesn't fit current warehouse mode
    const availableIds = new Set(this.getFilteredProducts().map(p => p.id));
    this.selectedItems.forEach(item => {
      if (!availableIds.has(item.productId)) {
        item.productId = 0;
        item.unitPrice = 0;
      }
    });
    this.recalculateCosts();
  }

  get hasBostaIntegration(): boolean {
    return this.shippingCompanies().some(c => c.isIntegrated && (c.name.toLowerCase().includes('bosta') || c.name.includes('بوسطة')));
  }

  getFilteredProducts(): Product[] {
    const allProds = this.products();
    if (!this.hasBostaIntegration) {
      return allProds;
    }

    if (this.isBostaFulfillmentOrder) {
      const fulfillmentProds = allProds.filter(p => p.isFulfillment || p.code?.startsWith('BO-') || p.code?.startsWith('BST-'));
      return fulfillmentProds.length > 0 ? fulfillmentProds : allProds;
    } else {
      const merchantProds = allProds.filter(p => !p.isFulfillment && !p.code?.startsWith('BO-') && !p.code?.startsWith('BST-'));
      return merchantProds.length > 0 ? merchantProds : allProds;
    }
  }

  getProductDropdownOptions(): DropdownOption[] {
    return this.getFilteredProducts().map(p => ({
      value: p.id,
      label: p.name,
      imageUrl: p.imageUrl,
      icon: !p.imageUrl ? (p.isFulfillment || p.code?.startsWith('BO-') || p.code?.startsWith('BST-') ? 'fa-solid fa-bolt text-amber-400' : 'fa-solid fa-box text-sky-400') : undefined,
      badge: p.isFulfillment || p.code?.startsWith('BO-') || p.code?.startsWith('BST-') ? 'بوسطة' : undefined
    }));
  }

  onProductCustomSelect(rowIndex: number, selectedId: number): void {
    if (this.selectedItems[rowIndex]) {
      this.selectedItems[rowIndex].productId = Number(selectedId) || 0;
      this.onProductSelect(rowIndex);
    }
  }

  getCleanShippingCompanyName(comp: ShippingCompany): string {
    if (!comp?.name) return '';
    return comp.name.replace(/\(.*\)/g, '').trim();
  }

  getCustomerReturnRate(c: CustomerSearchDto | null): number {
    if (!c || !c.totalOrders || c.totalOrders <= 0) return 0;
    const returnedOrCancelled = (c.cancelledOrders || 0) + (c.returnedOrders || 0);
    return Math.round((returnedOrCancelled / c.totalOrders) * 100);
  }

  hasFulfillmentProducts(): boolean {
    return this.products().some(p => p.isFulfillment || p.code?.startsWith('BO-') || p.code?.startsWith('BST-'));
  }

  isSelectedCompanyBosta(): boolean {
    const comp = this.shippingCompanies().find(c => c.id === this.selectedShippingCompanyId);
    return comp ? (comp.isIntegrated || comp.name.toLowerCase().includes('bosta') || comp.name.includes('بوسطة')) : false;
  }

  loadLookups(): void {
    this.customerService.getAll(undefined, undefined, 1, 1000).subscribe(res => this.customers.set(res.items));
    this.productService.getAll().subscribe(res => {
      this.products.set(res);
      this.autoSelectShippingAndFulfillment();
    });
    this.customerService.getGovernorates().subscribe(res => this.governorates.set(res));
    this.shippingService.getAll().subscribe(res => {
      const validCompanies = res.filter(c => {
        const isBosta = c.name.toLowerCase().includes('bosta') || c.name.includes('بوسطة');
        return isBosta ? c.isIntegrated === true : true;
      });
      this.shippingCompanies.set(validCompanies);
      this.autoSelectShippingAndFulfillment();
    });
    this.orderService.getSalesPlatforms().subscribe(res => {
      this.salesPlatforms.set(res);
      if (res.length > 0) this.selectedSalesPlatformId = res[0].id;
    });
    this.walletService.getAll().subscribe(res => {
      this.wallets.set(res);
      if (res.length > 0 && !this.selectedPaidToWalletId) {
        this.selectedPaidToWalletId = res[0].id;
      }
    });
    this.bostaService.getZones().subscribe({
      next: (res: BostaCity[]) => {
        this.bostaCities = res;
        this.autoMatchBostaCityAndDistrict();
      },
      error: () => this.bostaCities = []
    });
  }

  autoSelectShippingAndFulfillment(): void {
    const companies = this.shippingCompanies();
    if (companies.length === 0) return;

    const bostaComp = companies.find(c => c.isIntegrated && (c.name.toLowerCase().includes('bosta') || c.name.includes('بوسطة')));
    if (bostaComp) {
      this.selectedShippingCompanyId = bostaComp.id;
      const hasFulfillmentProds = this.products().some(p => p.isFulfillment || p.code?.startsWith('BO-') || p.code?.startsWith('BST-'));
      if (hasFulfillmentProds) {
        this.isBostaFulfillmentOrder = true;
      }
    } else {
      if (this.selectedShippingCompanyId <= 0) {
        this.selectedShippingCompanyId = companies[0].id;
      }
      this.isBostaFulfillmentOrder = false;
    }
    this.recalculateCosts();
  }

  // Zone Search Modal State
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

  autoMatchBostaCityAndDistrict(): void {
    const govId = this.getSelectedGovernorateId();
    const gov = this.governorates().find(g => g.id === govId);
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

  extractedZoneName = '';

  getSelectedDistrictName(): string {
    if (!this.selectedBostaDistrictId) return '';
    for (const city of this.bostaCities) {
      if (city.districts) {
        const d = city.districts.find(x => x.districtId === this.selectedBostaDistrictId);
        if (d) {
          return `${d.districtOtherName} (${city.cityOtherName})`;
        }
      }
    }
    return '';
  }

  findBostaCityForGov(govName: string): BostaCity | undefined {
    if (!govName || !this.bostaCities || this.bostaCities.length === 0) return undefined;
    const normGov = this.normalizeArabic(govName);
    
    let match = this.bostaCities.find(c => {
      const normCityOther = this.normalizeArabic(c.cityOtherName);
      const normCityName = this.normalizeArabic(c.cityName);
      return (normCityOther && (normCityOther.includes(normGov) || normGov.includes(normCityOther))) ||
             (normCityName && (normCityName.includes(normGov) || normGov.includes(normCityName)));
    });

    if (!match) {
      const codeMap: { [key: string]: string } = {
        'القاهرة': 'EG-01', 'الجيزة': 'EG-02', 'الإسكندرية': 'EG-03', 'القليوبية': 'EG-04',
        'الدقهلية': 'EG-05', 'المنوفية': 'EG-06', 'الغربية': 'EG-07', 'الشرقية': 'EG-08',
        'البحيرة': 'EG-09', 'دمياط': 'EG-10', 'كفر الشيخ': 'EG-11', 'الإسماعيلية': 'EG-12',
        'بورسعيد': 'EG-13', 'السويس': 'EG-14', 'سوهاج': 'EG-15', 'أسيوط': 'EG-16',
        'قنا': 'EG-17', 'المنيا': 'EG-18', 'بني سويف': 'EG-19', 'الفيوم': 'EG-20',
        'البحر الأحمر': 'EG-21', 'الوادي الجديد': 'EG-22', 'مطروح': 'EG-23',
        'شمال سيناء': 'EG-24', 'جنوب سيناء': 'EG-25', 'الأقصر': 'EG-26', 'أسوان': 'EG-27'
      };
      const cleanGov = govName.replace('محافظة ', '').trim();
      const expectedCode = codeMap[govName] || codeMap[cleanGov];
      if (expectedCode) {
        match = this.bostaCities.find(c => c.cityCode === expectedCode);
      }
    }
    return match;
  }

  smartExtractLocationFromAddress(isSilent: boolean = false): void {
    const rawAddr = this.isNewCustomer ? this.newCustomer.address : (this.selectedCustomerSearchDto?.address || '');
    if (!rawAddr || rawAddr.trim().length < 2) {
      this.extractedZoneName = '';
      if (!isSilent) {
        this.notificationService.warning('يرجى كتابة العنوان التفصيلي للشحن أولاً لاستخراج المحافظة والمنطقة تلقائياً');
      }
      return;
    }

    const normAddr = this.normalizeArabic(rawAddr);
    let matchedGov: Governorate | undefined = undefined;
    let matchedCity: BostaCity | undefined = undefined;
    let matchedDist: BostaDistrict | undefined = undefined;

    // 1. Detect Governorate first
    for (const gov of this.governorates()) {
      const normGovName = this.normalizeArabic(gov.name);
      if (normGovName && normGovName.length > 2 && normAddr.includes(normGovName)) {
        matchedGov = gov;
        break;
      }
    }

    // 2. If Governorate was detected, strictly search ONLY inside this Governorate!
    if (matchedGov) {
      matchedCity = this.findBostaCityForGov(matchedGov.name);
      if (matchedCity && matchedCity.districts && matchedCity.districts.length > 0) {
        for (const dist of matchedCity.districts) {
          const normDistName = this.normalizeArabic(dist.districtOtherName);
          const normDistEn = this.normalizeArabic(dist.districtName);
          if ((normDistName && normDistName.length > 2 && normAddr.includes(normDistName)) ||
              (normDistEn && normDistEn.length > 2 && normAddr.includes(normDistEn))) {
            matchedDist = dist;
            break;
          }
        }
        // If district not found inside this governorate, pick the FIRST district of this governorate!
        if (!matchedDist) {
          matchedDist = matchedCity.districts[0];
        }
      }
    } else {
      // 3. Only if NO governorate was detected in address, search all Bosta cities for a matching district
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
    }

    // 4. If district found but no governorate found yet, deduce governorate from city
    if (matchedCity && !matchedGov) {
      const normCityName = this.normalizeArabic(matchedCity.cityOtherName);
      matchedGov = this.governorates().find(g => {
        const ng = this.normalizeArabic(g.name);
        return normCityName.includes(ng) || ng.includes(normCityName);
      });
    }

    // 5. Apply matched governorate & city/district
    if (matchedGov) {
      if (this.isNewCustomer) {
        this.newCustomer.governorateId = matchedGov.id;
      }
      this.recalculateCosts();
    }

    if (matchedGov && !matchedCity) {
      matchedCity = this.findBostaCityForGov(matchedGov.name);
    }

    if (matchedCity) {
      this.selectedBostaCityId = matchedCity.cityId;
      this.availableDistricts = matchedCity.districts || [];
    }

    if (matchedDist) {
      this.selectedBostaDistrictId = matchedDist.districtId;
    }

    if (matchedGov || matchedDist) {
      const parts = [matchedGov?.name, matchedDist?.districtOtherName].filter(Boolean);
      this.extractedZoneName = parts.join(' - ');
      if (!isSilent) {
        this.notificationService.success(`✨ تم الاستخراج الذكي: ${this.extractedZoneName}`);
      }
    } else {
      this.extractedZoneName = '';
      if (!isSilent) {
        this.notificationService.info('لم يتم التعرف التلقائي على المحافظة أو المنطقة في العنوان المدخل.');
      }
    }
  }

  openZoneSearchModal(): void {
    this.zoneSearchQuery = '';
    this.showZoneModal = true;
  }

  closeZoneSearchModal(): void {
    this.showZoneModal = false;
  }

  expandedGovIds: Set<string> = new Set<string>();

  toggleGovAccordion(cityId: string): void {
    if (this.expandedGovIds.has(cityId)) {
      this.expandedGovIds.delete(cityId);
    } else {
      this.expandedGovIds.add(cityId);
    }
  }

  getGroupedZoneItems(): {
    govName: string;
    govEnglishName?: string;
    isSelectedGov: boolean;
    districtCount: number;
    isExpanded: boolean;
    city: BostaCity;
    districts: BostaDistrict[];
    govMatch?: Governorate;
  }[] {
    if (!this.bostaCities || this.bostaCities.length === 0) return [];

    const query = this.normalizeArabic(this.zoneSearchQuery);

    let currentGovId = 0;
    if (this.isNewCustomer && this.newCustomer.governorateId > 0) {
      currentGovId = this.newCustomer.governorateId;
    } else if (!this.isNewCustomer && this.selectedCustomerId) {
      const selectedCust = this.customers().find(c => c.id === this.selectedCustomerId);
      if (selectedCust && selectedCust.governorateId > 0) {
        currentGovId = selectedCust.governorateId;
      }
    }

    const currentGov = this.governorates().find(g => g.id === currentGovId);
    const normCurrentGovName = currentGov ? this.normalizeArabic(currentGov.name) : '';

    const groups: {
      govName: string;
      govEnglishName?: string;
      isSelectedGov: boolean;
      districtCount: number;
      isExpanded: boolean;
      city: BostaCity;
      districts: BostaDistrict[];
      govMatch?: Governorate;
    }[] = [];

    for (const city of this.bostaCities) {
      const normCity = this.normalizeArabic((city.cityOtherName || '') + ' ' + (city.cityName || ''));
      const govMatch = this.governorates().find(g => {
        const ng = this.normalizeArabic(g.name);
        return normCity.includes(ng) || ng.includes(normCity);
      });

      const isSelectedGov = !!(
        (currentGovId > 0 && govMatch?.id === currentGovId) ||
        (normCurrentGovName && normCity.includes(normCurrentGovName))
      );

      const allDistricts = city.districts || [];
      let filteredDistricts = allDistricts;

      if (query) {
        filteredDistricts = allDistricts.filter(dist => {
          const normDist = this.normalizeArabic((dist.districtOtherName || '') + ' ' + (dist.districtName || ''));
          return normDist.includes(query) || normCity.includes(query);
        });
        if (filteredDistricts.length === 0 && !normCity.includes(query)) {
          continue;
        }
      }

      const isExpanded = isSelectedGov || query.length > 0 || this.expandedGovIds.has(city.cityId);

      groups.push({
        govName: city.cityOtherName || city.cityName,
        govEnglishName: city.cityName,
        isSelectedGov,
        districtCount: filteredDistricts.length,
        isExpanded,
        city,
        districts: filteredDistricts,
        govMatch
      });
    }

    groups.sort((a, b) => {
      if (a.isSelectedGov && !b.isSelectedGov) return -1;
      if (!a.isSelectedGov && b.isSelectedGov) return 1;
      return 0;
    });

    return groups;
  }

  selectZoneFromModal(item: { city: BostaCity; dist: BostaDistrict; govMatch?: Governorate }): void {
    if (item.govMatch) {
      if (this.isNewCustomer) {
        this.newCustomer.governorateId = item.govMatch.id;
      }
      this.recalculateCosts();
    }
    this.selectedBostaCityId = item.city.cityId;
    this.availableDistricts = item.city.districts || [];
    this.selectedBostaDistrictId = item.dist.districtId;

    if (this.isNewCustomer && item.dist.districtOtherName && !this.newCustomer.address.includes(item.dist.districtOtherName)) {
      const current = this.newCustomer.address.trim();
      this.newCustomer.address = current ? `${item.dist.districtOtherName} - ${current}` : item.dist.districtOtherName;
    }

    this.closeZoneSearchModal();
    this.notificationService.success(`تم تحديد المنطقة: ${item.dist.districtOtherName} (${item.city.cityOtherName}) بنجاح`);
  }

  onBostaCityChange(): void {
    const city = this.bostaCities.find(c => c.cityId === this.selectedBostaCityId);
    this.availableDistricts = city ? city.districts : [];
    this.selectedBostaDistrictId = '';
  }

  onDistrictChange(): void {
    if (this.selectedBostaDistrictId) {
      const dist = this.availableDistricts.find(d => d.districtId === this.selectedBostaDistrictId);
      if (dist && this.isNewCustomer) {
        if (dist.districtOtherName && !this.newCustomer.address.includes(dist.districtOtherName)) {
          const currentAddr = this.newCustomer.address.trim();
          this.newCustomer.address = currentAddr ? `${dist.districtOtherName} - ${currentAddr}` : dist.districtOtherName;
        }
      }
    }
  }

  onShippingCompanyChange(): void {
    const selectedComp = this.shippingCompanies().find(c => c.id === this.selectedShippingCompanyId);
    const isBosta = selectedComp && (selectedComp.name.toLowerCase().includes('bosta') || selectedComp.name.includes('بوسطة'));
    if (isBosta) {
      const hasFulfillmentProds = this.products().some(p => p.isFulfillment || p.code?.startsWith('BO-') || p.code?.startsWith('BST-'));
      if (hasFulfillmentProds) {
        this.isBostaFulfillmentOrder = true;
      }
    } else {
      this.isBostaFulfillmentOrder = false;
    }
    this.recalculateCosts();
  }

  getStepTitle(step: number): string {
    switch (step) {
      case 1: return 'شركة 1. الشحن وبيانات العميل';
      case 2: return 'منتجات الطلب والكميات';
      case 3: return 'الحسابات والتأكيد النهائي';
      default: return '';
    }
  }

  getProgressPercentage(): number {
    return Math.round(((this.currentStep - 1) / 2) * 100);
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      return;
    }
    if (step === 2 && !this.validateStep1()) return;
    if (step === 3 && (!this.validateStep1() || !this.validateStep2())) return;

    this.currentStep = step;
  }

  validateStep1(): boolean {
    if (this.selectedShippingCompanyId <= 0) {
      this.notificationService.warning('رجاء اختيار شركة الشحن');
      return false;
    }
    if (this.selectedSalesPlatformId <= 0) {
      this.notificationService.warning('رجاء اختيار منصة/مصدر البيع');
      return false;
    }
    if (this.isNewCustomer) {
      if (!this.newCustomer.name || !this.newCustomer.phone || this.newCustomer.governorateId <= 0 || !this.newCustomer.address) {
        this.notificationService.warning('رجاء إكمال كافة بيانات العميل الجديد (الاسم، رقم الموبايل، المحافظة والعنوان)');
        return false;
      }
    } else {
      if (!this.selectedCustomerId && !this.selectedCustomerSearchDto) {
        this.notificationService.warning('رجاء اختيار عميل مسجل من القائمة أو البحث باسمه');
        return false;
      }
    }
    return true;
  }

  validateStep2(): boolean {
    if (this.selectedItems.length === 0 || this.selectedItems.some(i => i.productId <= 0 || i.quantity <= 0)) {
      this.notificationService.warning('رجاء اختيار منتج واحد على الأقل وتحديد الكمية بشكل صحيح');
      return false;
    }
    return true;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.validateStep1()) return;
    } else if (this.currentStep === 2) {
      if (!this.validateStep2()) return;
    }

    if (this.currentStep < 3) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getItemSubtotal(item: OrderItemRow): number {
    return (item.unitPrice || 0) * item.quantity;
  }

  setCustomerMode(isNew: boolean): void {
    this.isNewCustomer = isNew;
    if (isNew) {
      this.selectedCustomerId = null;
      this.selectedCustomerSearchDto = null;
    } else {
      this.existingPhoneMatch = null;
    }
  }

  onCustomerSearchInput(query: string): void {
    if (!query || query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.customerService.searchCustomers(query).subscribe({
      next: (res: CustomerSearchDto[]) => this.searchResults.set(res),
      error: (err: any) => console.error(err)
    });
  }

  clearCustomerSearch(): void {
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  selectCustomerFromSearch(res: CustomerSearchDto): void {
    this.selectedCustomerId = res.id;
    this.selectedCustomerSearchDto = res;
    this.searchQuery = res.name;
    this.searchResults.set([]);
    this.recalculateCosts();
  }

  onCustomerChange(): void {
    if (this.selectedCustomerId) {
      const cust = this.customers().find(c => c.id === this.selectedCustomerId);
      if (cust) {
        this.customerService.getCustomerProfile(cust.id).subscribe(profile => {
          this.selectedCustomerSearchDto = profile;
        });
        this.recalculateCosts();
      }
    } else {
      this.selectedCustomerSearchDto = null;
    }
  }

  onNewCustomerPhoneInput(phone: string): void {
    if (!phone || phone.trim().length < 9) {
      this.existingPhoneMatch = null;
      return;
    }

    this.customerService.getByPhone(phone.trim()).subscribe({
      next: (found: CustomerSearchDto) => {
        if (found && found.id) {
          this.existingPhoneMatch = found;
        } else {
          this.existingPhoneMatch = null;
        }
      },
      error: () => this.existingPhoneMatch = null
    });
  }

  useExistingCustomerMatch(match: CustomerSearchDto | CustomerProfileDto): void {
    this.isNewCustomer = false;
    this.selectedCustomerId = match.id;
    this.selectedCustomerSearchDto = match;
    this.existingPhoneMatch = null;
    this.searchQuery = match.name;
    this.closeCustomerHistoryModal();
    this.recalculateCosts();
    this.notificationService.success(`تم اختيار العميل "${match.name}" بنجاح`);
  }

  openCustomerHistoryModal(customerId: number): void {
    this.customerService.getCustomerProfile(customerId).subscribe({
      next: (profile: CustomerProfileDto) => {
        this.customerProfile = profile;
        this.showCustomerHistoryModal = true;
        this.toggleBodyScroll(true);
      },
      error: () => this.notificationService.error('عذراً، تعذر تحميل بيانات العميل')
    });
  }

  closeCustomerHistoryModal(): void {
    this.showCustomerHistoryModal = false;
    this.toggleBodyScroll(false);
  }

  openOrderDetails(orderId: number): void {
    this.closeCustomerHistoryModal();
    window.open(`/orders/${orderId}`, '_blank');
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

  onGovernorateChange(): void {
    this.recalculateCosts();
    this.autoMatchBostaCityAndDistrict();
  }

  onProductSelect(index: number): void {
    const item = this.selectedItems[index];
    if (item && item.productId > 0) {
      const prod = this.products().find(p => p.id === item.productId);
      if (prod) {
        item.unitPrice = prod.sellingPrice;
      }
    }
    this.recalculateCosts();
  }

  addItemRow(): void {
    this.selectedItems.push({ productId: 0, quantity: 1, unitPrice: 0 });
  }

  removeItemRow(index: number): void {
    if (this.selectedItems.length > 1) {
      this.selectedItems.splice(index, 1);
      this.recalculateCosts();
    }
  }

  getMaxStock(productId: number): number {
    const prod = this.products().find(p => p.id === productId);
    return prod ? prod.stockQuantity : 1000;
  }

  onItemQuantityOrPriceChange(): void {
    this.recalculateCosts();
  }

  getSelectedGovernorateId(): number {
    if (this.isNewCustomer) {
      return this.newCustomer.governorateId;
    } else if (this.selectedCustomerSearchDto) {
      return this.selectedCustomerSearchDto.governorateId;
    } else if (this.selectedCustomerId) {
      const cust = this.customers().find(c => c.id === this.selectedCustomerId);
      return cust ? cust.governorateId : 0;
    }
    return 0;
  }

  recalculateCosts(): void {
    const rawSubTotal = this.selectedItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    this.calculatedSubTotal = Math.round(rawSubTotal * 100) / 100;

    const govId = this.getSelectedGovernorateId();
    const shipCompany = this.shippingCompanies().find(s => s.id === this.selectedShippingCompanyId);

    if (govId > 0 && shipCompany) {
      const rate = shipCompany.rates.find(r => r.governorateId === govId);
      this.calculatedShippingCost = rate ? Math.round(rate.shippingPrice * 100) / 100 : 0;
    } else {
      this.calculatedShippingCost = 0;
    }

    this.calculatedTotalAmount = Math.round((this.calculatedSubTotal + this.calculatedShippingCost) * 100) / 100;
  }

  onTotalAmountManualChange(): void {
    if (this.calculatedTotalAmount != null) {
      this.calculatedTotalAmount = Math.round(this.calculatedTotalAmount * 100) / 100;
    }
    const totalMinusShipping = this.calculatedTotalAmount - this.calculatedShippingCost;
    const totalQty = this.selectedItems.reduce((sum, i) => sum + i.quantity, 0);

    if (totalQty > 0 && totalMinusShipping >= 0) {
      const pricePerUnit = totalMinusShipping / totalQty;
      this.selectedItems.forEach(i => {
        i.unitPrice = Math.round(pricePerUnit * 100) / 100;
      });
      const rawSub = this.selectedItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
      this.calculatedSubTotal = Math.round(rawSub * 100) / 100;
    }
  }

  getSummaryCustomerName(): string {
    if (this.isNewCustomer) return this.newCustomer.name || '-';
    return this.selectedCustomerSearchDto?.name || '-';
  }

  getSummaryCustomerPhone(): string {
    if (this.isNewCustomer) return this.newCustomer.phone || '-';
    return this.selectedCustomerSearchDto?.phone || '-';
  }

  getSummaryCustomerAddress(): string {
    if (this.isNewCustomer) {
      const gov = this.governorates().find(g => g.id === this.newCustomer.governorateId);
      return `${gov ? gov.name : ''} - ${this.newCustomer.address}`;
    }
    return `${this.selectedCustomerSearchDto?.governorateName || ''} - ${this.selectedCustomerSearchDto?.address || ''}`;
  }

  getSelectedShippingCompanyName(): string {
    const comp = this.shippingCompanies().find(s => s.id === this.selectedShippingCompanyId);
    return comp ? comp.name : '-';
  }

  getSelectedSalesPlatformName(): string {
    const plat = this.salesPlatforms().find(p => p.id === this.selectedSalesPlatformId);
    return plat ? plat.name : '-';
  }

  saveNewPlatform(): void {
    if (!this.newPlatformName.trim()) {
      this.notificationService.warning('رجاء إدخال اسم منصة البيع أو الصفحة');
      return;
    }

    this.savingPlatform = true;
    this.orderService.createSalesPlatform(this.newPlatformName.trim()).subscribe({
      next: (created: SalesPlatform) => {
        this.savingPlatform = false;
        this.showPlatformModal = false;
        this.newPlatformName = '';
        this.salesPlatforms.update(list => [...list, created]);
        this.selectedSalesPlatformId = created.id;
        this.notificationService.success('تمت إضافة وتحديد المنصة الجديدة بنجاح');
      },
      error: (err: any) => {
        this.savingPlatform = false;
        this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء حفظ المنصة');
      }
    });
  }

  submitOrder(): void {
    if (!this.validateStep1() || !this.validateStep2()) {
      return;
    }

    const payload: any = {
      shippingCompanyId: this.selectedShippingCompanyId,
      salesPlatformId: this.selectedSalesPlatformId,
      districtId: this.selectedBostaDistrictId || null,
      districtName: this.getSelectedDistrictName() || null,
      notes: this.orderNotes,
      depositAmount: Number(this.depositAmount) || 0,
      paidToWalletId: (this.depositAmount || 0) > 0 && this.selectedPaidToWalletId ? Number(this.selectedPaidToWalletId) : null,
      depositReference: this.depositReference?.trim() || '',
      items: this.selectedItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        customSellingPrice: i.unitPrice
      }))
    };

    if (this.isNewCustomer) {
      payload.newCustomer = {
        name: this.newCustomer.name,
        phone: this.newCustomer.phone,
        secondaryPhone: this.newCustomer.secondaryPhone,
        address: this.newCustomer.address,
        governorateId: this.newCustomer.governorateId,
        notes: this.newCustomer.notes
      };
    } else {
      payload.customerId = this.selectedCustomerId;
    }

    this.submitting = true;
    this.orderService.create(payload).subscribe({
      next: (created: Order) => {
        this.submitting = false;
        this.notificationService.success('تم إنشاء وحفظ الأوردر بنجاح');
        this.router.navigate(['/orders', created.id]);
      },
      error: (err: any) => {
        this.submitting = false;
        this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء إنشاء الأوردر');
      }
    });
  }
}
