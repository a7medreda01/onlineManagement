import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingService } from '../../services/shipping.service';
import { CustomerService } from '../../services/customer.service';
import { NotificationService } from '../../services/notification.service';
import { BostaService } from '../../services/bosta.service';
import { Governorate, ShippingCompany, ShippingRate } from '../../models/models';

export type BostaTab = 'instructions' | 'api' | 'rates' | 'fulfillment' | 'stock';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipping.component.html'
})
export class ShippingComponent implements OnInit {
  companies = signal<ShippingCompany[]>([]);
  governorates = signal<Governorate[]>([]);

  // Webhook official endpoint for Bosta
  readonly webhookEndpoint = 'https://www.besnesy.com/api/bosta/webhook';

  // Identify Bosta company
  bostaCompany = computed(() => {
    return this.companies().find(c =>
      c.name.toLowerCase().includes('bosta') ||
      c.name.includes('بوسطة') ||
      c.isIntegrated
    ) || null;
  });

  // Check if Bosta is connected
  isBostaConnected = computed(() => {
    const bosta = this.bostaCompany();
    const hasCompanyActive = !!(bosta && (bosta.isIntegrated || (bosta.apiKey && bosta.apiKey.trim().length > 0)));
    const hasLocalActive = !!(this.bostaIntegration.isIntegrated && this.bostaIntegration.apiKey && this.bostaIntegration.apiKey.trim().length > 0);
    return hasCompanyActive || hasLocalActive;
  });

  // Regular / manual delivery companies (excluding Bosta)
  regularCompanies = computed(() => {
    const bosta = this.bostaCompany();
    return this.companies().filter(c => !bosta || c.id !== bosta.id);
  });

  // Selected regular company for rates editing
  selectedRegularCompany: ShippingCompany | null = null;
  editedRegularRates: { governorateId: number; governorateName: string; shippingPrice: number; returnPrice: number }[] = [];
  regularSearchQuery = '';

  // Bosta Integration State & Modal
  showBostaModal = false;
  activeBostaTab: BostaTab = 'instructions';
  bostaIntegration = {
    apiKey: '',
    webhookUrl: this.webhookEndpoint,
    isIntegrated: false
  };
  editedBostaRates: { governorateId: number; governorateName: string; shippingPrice: number; returnPrice: number }[] = [];
  showApiKey = false;
  verifyingKey = false;
  savingIntegration = false;
  savingBostaRates = false;
  importingRates = false;
  syncingProducts = false;
  useStorageService = false;
  storageFee = 15;

  // Add Regular Company Modal
  showAddRegularModal = false;
  newRegularCompany = {
    name: '',
    phone: '',
    defaultShippingPrice: 60,
    defaultReturnPrice: 45
  };

  // Regular rates saving state
  savingRegularRates = false;

  // Quick batch pricing helper models
  batchTiers = {
    cairoShipping: 50,
    cairoReturn: 40,
    deltaShipping: 60,
    deltaReturn: 45,
    canalShipping: 70,
    canalReturn: 50,
    upperShipping: 85,
    upperReturn: 65,
    allShipping: 65,
    allReturn: 50
  };

  constructor(
    private shippingService: ShippingService,
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private bostaService: BostaService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.customerService.getGovernorates().subscribe(govs => {
      this.governorates.set(govs);
      this.shippingService.getAll().subscribe(compList => {
        this.companies.set(compList);

        // Sync Bosta Company data
        const bosta = compList.find(c =>
          c.name.toLowerCase().includes('bosta') ||
          c.name.includes('بوسطة') ||
          c.isIntegrated
        );

        if (bosta) {
          this.bostaIntegration = {
            apiKey: bosta.apiKey || '',
            webhookUrl: bosta.webhookUrl || this.webhookEndpoint,
            isIntegrated: bosta.isIntegrated || false
          };

          const bostaRatesMap = new Map(bosta.rates.map(r => [r.governorateId, r]));
          this.editedBostaRates = govs.map(g => {
            const existing = bostaRatesMap.get(g.id);
            return {
              governorateId: g.id,
              governorateName: g.name,
              shippingPrice: existing ? existing.shippingPrice : 65,
              returnPrice: existing ? existing.returnPrice : 45
            };
          });
        }

        // Sync Regular Companies list & selection
        const regulars = compList.filter(c => !bosta || c.id !== bosta.id);
        if (regulars.length > 0) {
          const currentId = this.selectedRegularCompany ? this.selectedRegularCompany.id : regulars[0].id;
          const target = regulars.find(c => c.id === currentId) || regulars[0];
          this.selectRegularCompany(target);
        } else {
          this.selectedRegularCompany = null;
          this.editedRegularRates = [];
        }
      });
    });
  }

  // ===================== BOSTA INTEGRATION METHODS =====================

  openBostaModal(tab: BostaTab = 'instructions'): void {
    this.activeBostaTab = tab;
    this.showBostaModal = true;
  }

  closeBostaModal(): void {
    this.showBostaModal = false;
  }

  setBostaTab(tab: BostaTab): void {
    this.activeBostaTab = tab;
  }

  copyWebhookUrl(): void {
    navigator.clipboard.writeText(this.webhookEndpoint).then(() => {
      this.notificationService.success('تم نسخ رابط Webhook بنجاح! الصقه في لوحة بوسطة لتحديث الحالات تلقائياً');
    }).catch(() => {
      this.notificationService.info(`رابط الـ Webhook: ${this.webhookEndpoint}`);
    });
  }

  testBostaConnection(): void {
    if (!this.bostaIntegration.apiKey || !this.bostaIntegration.apiKey.trim()) {
      this.notificationService.error('يرجى إدخال مفتاح Bosta API Key أولاً لاختبار الاتصال');
      return;
    }

    this.verifyingKey = true;
    this.bostaService.verifyApiKey(this.bostaIntegration.apiKey.trim()).subscribe({
      next: (res) => {
        this.verifyingKey = false;
        if (res.success) {
          this.notificationService.success(res.message);
        } else {
          this.notificationService.error(res.message);
        }
      },
      error: (err) => {
        this.verifyingKey = false;
        this.notificationService.error(err?.error?.Message || err?.message || 'فشل اختبار الربط مع بوسطة');
      }
    });
  }

  saveBostaIntegration(): void {
    this.savingIntegration = true;
    const bosta = this.bostaCompany();
    const trimmedKey = this.bostaIntegration.apiKey ? this.bostaIntegration.apiKey.trim() : '';

    if (bosta) {
      this.shippingService.updateIntegration(bosta.id, {
        apiKey: trimmedKey,
        webhookUrl: this.webhookEndpoint,
        isIntegrated: this.bostaIntegration.isIntegrated
      }).subscribe({
        next: () => {
          this.savingIntegration = false;
          this.notificationService.success('تم حفظ وتفعيل بيانات ربط بوسطة بنجاح! الربط الآن مفعل وشغال ✅');
          this.loadData();
        },
        error: (err) => {
          this.savingIntegration = false;
          this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء حفظ إعدادات الربط');
        }
      });
    } else {
      // Create Bosta company entry on-the-fly if not seeded
      const defaultRates = this.governorates().map(gov => ({
        governorateId: gov.id,
        shippingPrice: 65,
        returnPrice: 45
      }));

      this.shippingService.create({
        name: 'بوسطة (Bosta Express)',
        phone: '19678',
        apiKey: trimmedKey,
        webhookUrl: this.webhookEndpoint,
        isIntegrated: this.bostaIntegration.isIntegrated,
        rates: defaultRates
      }).subscribe({
        next: () => {
          this.savingIntegration = false;
          this.notificationService.success('تم تفعيل وحفظ إعدادات شركة بوسطة بنجاح! الربط الآن مفعل وشغال ✅');
          this.loadData();
        },
        error: (err) => {
          this.savingIntegration = false;
          this.notificationService.error(err?.error?.Message || 'خطأ أثناء إنشاء شركة بوسطة');
        }
      });
    }
  }

  importBostaRates(): void {
    const bosta = this.bostaCompany();
    if (!bosta) {
      this.notificationService.error('يرجى حفظ بيانات ربط بوسطة أولاً قبل استيراد الأسعار');
      return;
    }

    this.importingRates = true;
    const payload = {
      useStorageService: this.useStorageService,
      storageFee: this.storageFee
    };

    this.bostaService.importRates(bosta.id, payload).subscribe({
      next: (res) => {
        this.importingRates = false;
        if (res.success) {
          this.notificationService.success(res.message || 'تم استيراد أسعار تعاقد بوسطة بنجاح!');
          this.loadData();
        } else {
          this.notificationService.error(res.message || 'حدث خطأ أثناء استيراد الأسعار من بوسطة');
        }
      },
      error: (err) => {
        this.importingRates = false;
        this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء استيراد الأسعار من بوسطة');
      }
    });
  }

  saveBostaRates(): void {
    const bosta = this.bostaCompany();
    if (!bosta) return;

    this.savingBostaRates = true;
    const payload = this.editedBostaRates.map(r => ({
      governorateId: r.governorateId,
      shippingPrice: r.shippingPrice,
      returnPrice: r.returnPrice
    }));

    this.shippingService.updateRates(bosta.id, payload).subscribe({
      next: () => {
        this.savingBostaRates = false;
        this.notificationService.success('تم حفظ أسعار بوسطة لجميع المحافظات بنجاح!');
        this.loadData();
      },
      error: (err) => {
        this.savingBostaRates = false;
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء حفظ الأسعار');
      }
    });
  }

  syncBostaProducts(): void {
    this.syncingProducts = true;
    this.bostaService.syncProductsAndStock().subscribe({
      next: (res) => {
        this.syncingProducts = false;
        if (res.success) {
          this.notificationService.success(res.message || 'تمت مزامنة المنتجات والمخزون مع بوسطة بنجاح!');
        } else {
          this.notificationService.error(res.message || 'حدث خطأ أثناء مزامنة المخزون مع بوسطة');
        }
      },
      error: (err) => {
        this.syncingProducts = false;
        this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء مزامنة المخزون مع بوسطة');
      }
    });
  }

  // ===================== REGULAR SHIPPING COMPANIES METHODS =====================

  openAddRegularModal(): void {
    this.newRegularCompany = {
      name: '',
      phone: '',
      defaultShippingPrice: 60,
      defaultReturnPrice: 45
    };
    this.showAddRegularModal = true;
  }

  closeAddRegularModal(): void {
    this.showAddRegularModal = false;
  }

  saveNewRegularCompany(): void {
    if (!this.newRegularCompany.name.trim()) {
      this.notificationService.error('يرجى كتابة اسم شركة الشحن');
      return;
    }

    const defaultRates = this.governorates().map(gov => ({
      governorateId: gov.id,
      shippingPrice: this.newRegularCompany.defaultShippingPrice || 60,
      returnPrice: this.newRegularCompany.defaultReturnPrice || 45
    }));

    this.shippingService.create({
      name: this.newRegularCompany.name.trim(),
      phone: this.newRegularCompany.phone.trim(),
      apiKey: '',
      isIntegrated: false,
      rates: defaultRates
    }).subscribe({
      next: (created) => {
        this.showAddRegularModal = false;
        this.notificationService.success(`تمت إضافة شركة الشحن "${this.newRegularCompany.name}" بنجاح! يمكنك الآن تعديل أسعار المحافظات.`);
        this.loadData();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ أثناء إضافة شركة الشحن')
    });
  }

  selectRegularCompany(company: ShippingCompany): void {
    this.selectedRegularCompany = company;
    const ratesMap = new Map((company.rates || []).map(r => [r.governorateId, r]));

    this.editedRegularRates = this.governorates().map(gov => {
      const existing = ratesMap.get(gov.id);
      return {
        governorateId: gov.id,
        governorateName: gov.name,
        shippingPrice: existing ? existing.shippingPrice : 60,
        returnPrice: existing ? existing.returnPrice : 45
      };
    });
  }

  get filteredRegularRates() {
    if (!this.regularSearchQuery.trim()) {
      return this.editedRegularRates;
    }
    const q = this.regularSearchQuery.trim().toLowerCase();
    return this.editedRegularRates.filter(r => r.governorateName.toLowerCase().includes(q));
  }

  saveRegularRates(): void {
    if (!this.selectedRegularCompany) return;
    this.savingRegularRates = true;

    const payload = this.editedRegularRates.map(r => ({
      governorateId: r.governorateId,
      shippingPrice: r.shippingPrice,
      returnPrice: r.returnPrice
    }));

    this.shippingService.updateRates(this.selectedRegularCompany.id, payload).subscribe({
      next: () => {
        this.savingRegularRates = false;
        this.notificationService.success(`تم حفظ أسعار شركة "${this.selectedRegularCompany?.name}" بنجاح!`);
        this.loadData();
      },
      error: (err) => {
        this.savingRegularRates = false;
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء حفظ أسعار المحافظات');
      }
    });
  }

  deleteRegularCompany(company: ShippingCompany, event: Event): void {
    event.stopPropagation();
    this.notificationService.confirm(`هل أنت متأكد من حذف شركة الشحن "${company.name}"؟`, 'تأكيد الحذف')
      .then((confirmed) => {
        if (confirmed) {
          this.shippingService.delete(company.id).subscribe({
            next: () => {
              this.notificationService.success(`تم حذف شركة الشحن "${company.name}" بنجاح`);
              if (this.selectedRegularCompany?.id === company.id) {
                this.selectedRegularCompany = null;
              }
              this.loadData();
            },
            error: (err) => {
              this.notificationService.error(err?.error?.message || 'تعذر حذف شركة الشحن');
            }
          });
        }
      });
  }

  // Quick region batch pricing
  applyBatchPricing(region: 'cairo' | 'delta' | 'canal' | 'upper' | 'all'): void {
    if (!this.selectedRegularCompany || this.editedRegularRates.length === 0) return;

    this.editedRegularRates.forEach(r => {
      const name = r.governorateName;
      if (region === 'all') {
        r.shippingPrice = this.batchTiers.allShipping;
        r.returnPrice = this.batchTiers.allReturn;
      } else if (region === 'cairo' && (name.includes('القاهرة') || name.includes('الجيزة') || name.includes('القليوبية'))) {
        r.shippingPrice = this.batchTiers.cairoShipping;
        r.returnPrice = this.batchTiers.cairoReturn;
      } else if (region === 'delta' && (name.includes('الإسكندرية') || name.includes('البحيرة') || name.includes('الغربية') || name.includes('الشرقية') || name.includes('المنوفية') || name.includes('الدقهلية') || name.includes('دمياط') || name.includes('كفر الشيخ'))) {
        r.shippingPrice = this.batchTiers.deltaShipping;
        r.returnPrice = this.batchTiers.deltaReturn;
      } else if (region === 'canal' && (name.includes('السويس') || name.includes('الإسماعيلية') || name.includes('بورسعيد') || name.includes('سيناء'))) {
        r.shippingPrice = this.batchTiers.canalShipping;
        r.returnPrice = this.batchTiers.canalReturn;
      } else if (region === 'upper' && (name.includes('الفيوم') || name.includes('بني سويف') || name.includes('المنيا') || name.includes('أسيوط') || name.includes('سوهاج') || name.includes('قنا') || name.includes('الأقصر') || name.includes('أسوان') || name.includes('البحر الأحمر') || name.includes('مطروح') || name.includes('الوادي الجديد'))) {
        r.shippingPrice = this.batchTiers.upperShipping;
        r.returnPrice = this.batchTiers.upperReturn;
      }
    });

    this.notificationService.info('تم تطبيق الأسعار على المحافظات المحددة في الجدول. اضغط على "حفظ الأسعار" لتثبيتها.');
  }
}
