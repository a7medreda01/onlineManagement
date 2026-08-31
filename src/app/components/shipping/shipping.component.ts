import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingService } from '../../services/shipping.service';
import { CustomerService } from '../../services/customer.service';
import { NotificationService } from '../../services/notification.service';
import { BostaService } from '../../services/bosta.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Governorate, ShippingCompany, ShippingRate } from '../../models/models';

export type BostaTab = 'instructions' | 'api' | 'rates' | 'fulfillment' | 'stock';

@Component({
  selector: 'app-shipping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipping.component.html'
})
export class ShippingComponent implements OnInit, OnDestroy {
  companies = signal<ShippingCompany[]>([]);
  governorates = signal<Governorate[]>([]);

  // Webhook official endpoint for Bosta
  readonly webhookEndpoint = 'https://besnesy.runasp.net/api/bosta/webhook';

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
    fulfillmentApiKey: '',
    webhookUrl: this.webhookEndpoint,
    isIntegrated: false
  };
  editedBostaRates: { governorateId: number; governorateName: string; shippingPrice: number; returnPrice: number }[] = [];
  // Step-by-step connection status tracking
  bostaConnectionStatus: 'none' | 'testing' | 'success' | 'failed' = 'none';
  bostaConnectionMessage = '';
  ratesImportStatus: 'none' | 'loading' | 'success' | 'failed' = 'none';
  ratesImportMessage = '';
  stockSyncStatus: 'none' | 'loading' | 'success' | 'failed' = 'none';
  stockSyncMessage = '';

  showApiKey = false;
  verifyingKey = false;
  savingIntegration = false;
  savingBostaRates = false;
  importingRates = false;
  syncingProducts = false;
  useStorageService = false;
  storageFee = 15;
  autoImportRates = true;
  autoSyncProducts = true;
  showBostaRatesModal = false;
  bostaSearchQuery = '';

  openBostaRatesModal(): void {
    this.showBostaRatesModal = true;
  }

  closeBostaRatesModal(): void {
    this.showBostaRatesModal = false;
  }

  get filteredBostaRates() {
    const q = this.bostaSearchQuery.trim().toLowerCase();
    if (!q) return this.editedBostaRates;
    return this.editedBostaRates.filter(r => r.governorateName.toLowerCase().includes(q));
  }

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

  ngOnDestroy(): void {
    document.body.style.overflow = '';
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
            fulfillmentApiKey: (bosta as any).fulfillmentApiKey || '',
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
    document.body.style.overflow = 'hidden';
  }

  closeBostaModal(): void {
    this.showBostaModal = false;
    document.body.style.overflow = '';
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
    this.bostaConnectionStatus = 'testing';
    this.bostaConnectionMessage = 'جاري الاتصال واختبار مفاتيح بوسطة...';

    this.bostaService.verifyApiKey(this.bostaIntegration.apiKey.trim()).subscribe({
      next: (res) => {
        this.verifyingKey = false;
        if (res.success) {
          this.bostaConnectionStatus = 'success';
          this.bostaConnectionMessage = '✅ تم الاتصال والتحقق من حسابك في بوسطة بنجاح!';
          this.notificationService.success(res.message);
        } else {
          this.bostaConnectionStatus = 'failed';
          this.bostaConnectionMessage = '❌ فشل التحقق: ' + (res.message || 'المفتاح غير صحيح');
          this.notificationService.error(res.message);
        }
      },
      error: (err) => {
        this.verifyingKey = false;
        this.bostaConnectionStatus = 'failed';
        this.bostaConnectionMessage = '❌ تعذر الاتصال بـ API بوسطة. يرجى التأكد من المفتاح.';
        this.notificationService.error(err?.error?.Message || err?.message || 'فشل اختبار الربط مع بوسطة');
      }
    });
  }

  saveBostaIntegrationFast(): void {
    if (!this.bostaIntegration.apiKey || !this.bostaIntegration.apiKey.trim()) {
      this.notificationService.error('يرجى إدخال مفتاح Bosta API Key أولاً للربط');
      return;
    }

    this.savingIntegration = true;
    this.bostaIntegration.isIntegrated = true;
    const bosta = this.bostaCompany();
    const trimmedKey = this.bostaIntegration.apiKey.trim();

    const doSyncTasks = (targetCompanyId: number) => {
      const syncTasks$: Observable<any>[] = [];

      if (this.autoImportRates) {
        const payload = {
          useStorageService: this.useStorageService,
          storageFee: this.storageFee
        };
        syncTasks$.push(
          this.bostaService.importRates(targetCompanyId, payload).pipe(
            catchError(err => of({ success: false, message: err?.error?.Message || 'فشل سحب الأسعار', ratesUpdatedCount: 0 }))
          )
        );
      }

      if (this.autoSyncProducts) {
        syncTasks$.push(
          this.bostaService.syncProductsAndStock().pipe(
            catchError(err => of({ success: false, message: err?.error?.Message || 'فشل مزامنة المخزون', productsImportedCount: 0, stockUpdatedCount: 0 }))
          )
        );
      }

      if (syncTasks$.length > 0) {
        forkJoin(syncTasks$).subscribe({
          next: (results) => {
            this.savingIntegration = false;
            this.showBostaModal = false;
            document.body.style.overflow = '';

            let ratesCount = 0;
            let productsCount = 0;
            let stockCount = 0;

            results.forEach(res => {
              if (res && res.ratesUpdatedCount !== undefined) ratesCount = res.ratesUpdatedCount;
              if (res && res.productsImportedCount !== undefined) productsCount = res.productsImportedCount;
              if (res && res.stockUpdatedCount !== undefined) stockCount = res.stockUpdatedCount;
            });

            let msgParts: string[] = ['تم حفظ وتأكيد الربط مع بوسطة بنجاح! 🚀'];
            if (ratesCount > 0) msgParts.push(`تم سحب أسعار الـ ${ratesCount} محافظة تلقائياً ⚡`);
            if (stockCount > 0 || productsCount > 0) msgParts.push(`تمت مزامنة المخزون مع بوسطة بنجاح 📦`);

            this.notificationService.success(msgParts.join(' '));
            this.loadData();
          },
          error: () => {
            this.savingIntegration = false;
            this.showBostaModal = false;
            document.body.style.overflow = '';
            this.notificationService.success('تم حفظ وتأكيد الربط مع بوسطة بنجاح! 🚀');
            this.loadData();
          }
        });
      } else {
        this.savingIntegration = false;
        this.showBostaModal = false;
        document.body.style.overflow = '';
        this.notificationService.success('تم حفظ وتأكيد الربط مع بوسطة بنجاح! 🚀');
        this.loadData();
      }
    };

    if (bosta) {
      this.shippingService.updateIntegration(bosta.id, {
        apiKey: trimmedKey,
        fulfillmentApiKey: this.bostaIntegration.fulfillmentApiKey?.trim(),
        webhookUrl: this.webhookEndpoint,
        isIntegrated: true
      }).subscribe({
        next: () => doSyncTasks(bosta.id),
        error: (err) => {
          this.savingIntegration = false;
          this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء حفظ إعدادات الربط');
        }
      });
    } else {
      const defaultRates = this.governorates().map(gov => ({
        governorateId: gov.id,
        shippingPrice: 65,
        returnPrice: 45
      }));

      this.shippingService.create({
        name: 'شركة بوسطة (Bosta)',
        phone: '19043',
        apiKey: trimmedKey,
        fulfillmentApiKey: this.bostaIntegration.fulfillmentApiKey?.trim(),
        webhookUrl: this.webhookEndpoint,
        isIntegrated: true,
        rates: defaultRates
      }).subscribe({
        next: (created) => doSyncTasks(created.id),
        error: (err) => {
          this.savingIntegration = false;
          this.notificationService.error(err?.error?.Message || 'خطأ أثناء تفعيل شركة بوسطة');
        }
      });
    }
  }

  saveBostaIntegration(): void {
    this.saveBostaIntegrationFast();
  }

  importBostaRates(): void {
    const bosta = this.bostaCompany();
    if (!bosta) {
      this.notificationService.error('يرجى حفظ بيانات ربط بوسطة أولاً قبل استيراد الأسعار');
      return;
    }

    this.importingRates = true;
    this.ratesImportStatus = 'loading';
    this.ratesImportMessage = 'جاري استعلام وحساب أسعار تعاقد حسابك المباشر في بوسطة...';

    const payload = {
      useStorageService: this.useStorageService,
      storageFee: this.storageFee
    };

    this.bostaService.importRates(bosta.id, payload).subscribe({
      next: (res) => {
        this.importingRates = false;
        if (res.success) {
          this.ratesImportStatus = 'success';
          this.ratesImportMessage = `✅ ${res.message || 'تم سحب أسعار الـ 27 محافظة التابعة لتعاقد حسابك المباشر في بوسطة بنجاح!'}`;
          this.notificationService.success(res.message || 'تم استيراد أسعار تعاقد بوسطة بنجاح!');
          this.loadData();
        } else {
          this.ratesImportStatus = 'failed';
          this.ratesImportMessage = '❌ فشل سحب الأسعار: ' + (res.message || 'حدث خطأ أثناء الاستيراد');
          this.notificationService.error(res.message || 'حدث خطأ أثناء استيراد الأسعار من بوسطة');
        }
      },
      error: (err) => {
        this.importingRates = false;
        this.ratesImportStatus = 'failed';
        this.ratesImportMessage = '❌ تعذر سحب الأسعار من حساب بوسطة.';
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
        this.showBostaRatesModal = false;
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
    this.stockSyncStatus = 'loading';
    this.stockSyncMessage = 'جاري سحب قائمة المنتجات والمخزون الحالي من Bosta Fulfillment...';

    this.bostaService.syncProductsAndStock().subscribe({
      next: (res) => {
        this.syncingProducts = false;
        if (res.success) {
          this.stockSyncStatus = 'success';
          this.stockSyncMessage = `✅ ${res.message || 'تمت مزامنة المنتجات والمخزون المسجل في بوسطة بنجاح!'}`;
          this.notificationService.success(res.message || 'تمت مزامنة المنتجات والمخزون مع بوسطة بنجاح!');
        } else {
          this.stockSyncStatus = 'failed';
          this.stockSyncMessage = '❌ فشل السحب: ' + (res.message || 'حدث خطأ أثناء مزامنة المخزون');
          this.notificationService.error(res.message || 'حدث خطأ أثناء مزامنة المخزون مع بوسطة');
        }
      },
      error: (err) => {
        this.syncingProducts = false;
        this.stockSyncStatus = 'failed';
        this.stockSyncMessage = '❌ تعذر سحب المنتجات من مستودع بوسطة.';
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
