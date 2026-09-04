import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { StorefrontService } from '../../services/storefront.service';
import { ProductService } from '../../services/product.service';
import { ShippingService } from '../../services/shipping.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import {
  StorefrontSettings,
  ProductLandingPage,
  Product,
  ShippingCompany,
  FulfillmentSource,
  AiGeneratedLandingPageResponse
} from '../../models/models';
import { UpgradeModalComponent } from '../shared/upgrade-modal/upgrade-modal.component';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UpgradeModalComponent],
  templateUrl: './storefront.component.html',
  styleUrls: ['./storefront.component.css']
})
export class StorefrontComponent implements OnInit {
  activeTab: 'pages' | 'settings' = 'pages';

  // State signals
  settings = signal<StorefrontSettings | null>(null);
  landingPages = signal<ProductLandingPage[]>([]);
  products = signal<Product[]>([]);
  shippingCompanies = signal<ShippingCompany[]>([]);

  loading = signal<boolean>(true);
  loadingPages = signal<boolean>(false);
  savingSettings = signal<boolean>(false);
  generatingAi = signal<boolean>(false);
  savingPage = signal<boolean>(false);

  // VIP Plan control
  isVip = signal<boolean>(true);
  showUpgradeModal = false;
  FulfillmentSource = FulfillmentSource;

  // Settings form
  settingsForm: Partial<StorefrontSettings> = {
    subdomain: '',
    storeDisplayName: '',
    bio: '',
    niche: 'عام',
    themeColor: '#0284c7',
    logoUrl: '',
    coverUrl: '',
    faviconUrl: '',
    whatsAppNumber: '',
    contactPhone: '',
    facebookPixelId: '',
    tiktokPixelId: '',
    googleAnalyticsId: '',
    isActive: true
  };

  subdomainChecking = false;
  subdomainAvailable: boolean | null = null;

  // AI Wizard Modal state
  showAiWizardModal = false;
  wizardStep: 1 | 2 | 3 = 1;

  aiRequest = {
    selectedProductId: null as number | null,
    productName: '',
    productDescription: '',
    niche: 'عام',
    targetSellingPrice: null as number | null,
    images: [] as string[],
    newImageUrl: '',
    shippingCompanyId: null as number | null,
    fulfillmentSource: FulfillmentSource.MerchantWarehouse,
    isFreeShipping: true,
    customShippingCost: null as number | null,
    initialStock: 100,
    productCostPrice: 0
  };

  // AI Generated output for preview & tweaking
  generatedPreview: Partial<AiGeneratedLandingPageResponse> & {
    slug?: string;
    sellingPrice?: number;
    originalPrice?: number;
    images?: string[];
  } = {};

  editingPageId: number | null = null;

  // Niche presets
  niches = [
    { name: 'عام', icon: 'bi-grid-fill', color: '#0284c7' },
    { name: 'عطور وبخور فاخر', icon: 'bi-gem', color: '#d97706' },
    { name: 'ساعات وإكسسوارات', icon: 'bi-watch', color: '#b45309' },
    { name: 'مكياج وعناية بالبشرة', icon: 'bi-heart-fill', color: '#e11d48' },
    { name: 'إلكترونيات وهواتف ذكية', icon: 'bi-cpu-fill', color: '#2563eb' },
    { name: 'ملابس وموضة وأحذية', icon: 'bi-bag-fill', color: '#7c3aed' },
    { name: 'أدوات منزلية ومطبخ', icon: 'bi-house-heart-fill', color: '#059669' },
    { name: 'صحة ورشاقة ومكملات', icon: 'bi-activity', color: '#16a34a' }
  ];

  themePresets = [
    { name: 'سماوي عصري (Default Sky)', color: '#0284c7' },
    { name: 'ذهبي ملكي (Royal Gold)', color: '#d97706' },
    { name: 'وردي أنيق (Rose Beauty)', color: '#e11d48' },
    { name: 'أزرق سيبراني (Cyber Blue)', color: '#2563eb' },
    { name: 'زمردي فاخر (Emerald Green)', color: '#059669' },
    { name: 'بنفسجي ملكي (Imperial Violet)', color: '#7c3aed' }
  ];

  constructor(
    private storefrontService: StorefrontService,
    private productService: ProductService,
    private shippingService: ShippingService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkPlanAccess();
    this.loadStoreSettings();
    this.loadLandingPages();
    this.loadProducts();
    this.loadShippingCompanies();
  }

  checkPlanAccess(): void {
    if (this.authService.canAccessStorefront()) {
      this.isVip.set(true);
      return;
    }
    this.authService.getSubscriptionDetails().subscribe({
      next: (sub) => {
        const hasAccess = !!sub.allowAiLandingPages ||
          (sub.planName?.includes('مميزة') ?? false) ||
          (sub.badge?.includes('VIP') ?? false);
        this.isVip.set(hasAccess);
      },
      error: () => {
        this.isVip.set(this.authService.canAccessStorefront());
      }
    });
  }

  // ==========================================
  // Data Loading
  // ==========================================

  loadStoreSettings(): void {
    this.loading.set(true);
    this.storefrontService.getSettings().subscribe({
      next: (res) => {
        this.settings.set(res);
        this.settingsForm = { ...res };
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.error?.Message?.includes('حصرية')) {
          this.isVip.set(false);
          this.showUpgradeModal = true;
        } else {
          this.notificationService.error('فشل تحميل إعدادات المتجر');
        }
      }
    });
  }

  loadLandingPages(): void {
    this.loadingPages.set(true);
    this.storefrontService.getLandingPages().subscribe({
      next: (res) => {
        this.landingPages.set(res);
        this.loadingPages.set(false);
      },
      error: () => this.loadingPages.set(false)
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (res: Product[]) => this.products.set(res),
      error: () => {}
    });
  }

  loadShippingCompanies(): void {
    this.shippingService.getShippingCompanies().subscribe({
      next: (res: ShippingCompany[]) => {
        this.shippingCompanies.set(res);
        if (res.length > 0 && !this.aiRequest.shippingCompanyId) {
          this.aiRequest.shippingCompanyId = res[0].id;
        }
      },
      error: () => {}
    });
  }

  // ==========================================
  // Storefront Settings Actions
  // ==========================================

  onSubdomainInput(): void {
    const sub = this.settingsForm.subdomain?.trim().toLowerCase() || '';
    this.settingsForm.subdomain = sub.replace(/[^a-z0-9-]/g, '');

    if (this.settingsForm.subdomain.length >= 3) {
      this.subdomainChecking = true;
      this.storefrontService.checkSubdomain(this.settingsForm.subdomain).subscribe({
        next: (res) => {
          this.subdomainAvailable = res.available;
          this.subdomainChecking = false;
        },
        error: () => {
          this.subdomainChecking = false;
        }
      });
    } else {
      this.subdomainAvailable = null;
    }
  }

  saveSettings(): void {
    if (!this.settingsForm.subdomain || !this.settingsForm.storeDisplayName) {
      this.notificationService.error('يرجى كتابة اسم المتجر ورابط الـ Subdomain');
      return;
    }

    this.savingSettings.set(true);
    this.storefrontService.updateSettings(this.settingsForm).subscribe({
      next: (res) => {
        this.settings.set(res);
        this.savingSettings.set(false);
        this.notificationService.success('تم حفظ إعدادات متجر البيع بنجاح');
      },
      error: (err) => {
        this.savingSettings.set(false);
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء حفظ الإعدادات');
      }
    });
  }

  // ==========================================
  // Store AI Generation & Media Uploads
  // ==========================================

  isGeneratingStoreAi = signal<boolean>(false);
  storeAiPrompt = '';
  uploadingLogo = signal<boolean>(false);
  uploadingCover = signal<boolean>(false);

  generateStoreWithAi(): void {
    if (!this.storeAiPrompt.trim()) {
      this.notificationService.error('يرجى كتابة نبذة أو فكرة المتجر لتوليد هويته بالذكاء الاصطناعي');
      return;
    }

    this.isGeneratingStoreAi.set(true);
    this.storefrontService.generateStoreIdentity({
      storeDescriptionOrIdea: this.storeAiPrompt,
      niche: this.settingsForm.niche,
      preferredName: this.settingsForm.storeDisplayName
    }).subscribe({
      next: (res) => {
        this.isGeneratingStoreAi.set(false);
        if (res) {
          this.settingsForm.storeDisplayName = res.storeDisplayName || this.settingsForm.storeDisplayName;
          this.settingsForm.subdomain = res.subdomain || this.settingsForm.subdomain;
          this.settingsForm.niche = res.niche || this.settingsForm.niche;
          this.settingsForm.bio = res.bio || this.settingsForm.bio;
          this.settingsForm.themeColor = res.themeColor || this.settingsForm.themeColor;
          this.onSubdomainChange();
          this.notificationService.success('تم توليد هوية المتجر وبياناته بنجاح بواسطة الذكاء الاصطناعي ✨');
        }
      },
      error: () => {
        this.isGeneratingStoreAi.set(false);
        this.notificationService.error('حدث خطأ أثناء التوليد، يرجى المحاولة مرة أخرى');
      }
    });
  }

  onLogoFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingLogo.set(true);
    this.storefrontService.uploadMedia(file).subscribe({
      next: (res) => {
        this.uploadingLogo.set(false);
        this.settingsForm.logoUrl = res.url;
        this.notificationService.success('تم رفع شعار المتجر (اللوجو) بنجاح');
      },
      error: (err) => {
        this.uploadingLogo.set(false);
        this.notificationService.error(err?.error?.Message || 'فشل رفع صورة الشعار');
      }
    });
  }

  onCoverFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingCover.set(true);
    this.storefrontService.uploadMedia(file).subscribe({
      next: (res) => {
        this.uploadingCover.set(false);
        this.settingsForm.coverUrl = res.url;
        this.notificationService.success('تم رفع صورة الغلاف بنجاح');
      },
      error: (err) => {
        this.uploadingCover.set(false);
        this.notificationService.error(err?.error?.Message || 'فشل رفع صورة الغلاف');
      }
    });
  }

  copyToClipboard(text: string, message = 'تم نسخ الرابط بنجاح!'): void {
    if (!navigator.clipboard) {
      this.notificationService.info(text);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.success(message);
    });
  }

  // ==========================================
  // AI Landing Page Wizard Actions
  // ==========================================

  openAiWizard(existingPage?: ProductLandingPage): void {
    if (!this.isVip()) {
      this.showUpgradeModal = true;
      return;
    }

    if (existingPage) {
      this.editingPageId = existingPage.id;
      this.aiRequest.selectedProductId = existingPage.productId ?? null;
      this.aiRequest.productName = existingPage.title;
      this.aiRequest.productDescription = existingPage.headline;
      this.aiRequest.niche = existingPage.niche;
      this.aiRequest.targetSellingPrice = existingPage.sellingPrice;
      this.aiRequest.shippingCompanyId = existingPage.shippingCompanyId ?? (this.shippingCompanies()[0]?.id || null);
      this.aiRequest.fulfillmentSource = existingPage.fulfillmentSource;
      this.aiRequest.isFreeShipping = existingPage.isFreeShipping;
      this.aiRequest.customShippingCost = existingPage.customShippingCost ?? null;

      try {
        this.aiRequest.images = JSON.parse(existingPage.mediaUrlsJson || '[]');
      } catch {
        this.aiRequest.images = [];
      }

      this.generatedPreview = {
        title: existingPage.title,
        slug: existingPage.slug,
        headline: existingPage.headline,
        subheadline: existingPage.subheadline ?? '',
        badge: existingPage.badge ?? '',
        niche: existingPage.niche,
        suggestedPrice: existingPage.sellingPrice,
        suggestedOriginalPrice: existingPage.originalPrice ?? existingPage.sellingPrice * 1.4,
        themeConfigJson: existingPage.themeConfigJson,
        contentJson: existingPage.contentJson,
        images: this.aiRequest.images
      };

      this.wizardStep = 3;
    } else {
      this.editingPageId = null;
      this.wizardStep = 1;
      this.aiRequest = {
        selectedProductId: null,
        productName: '',
        productDescription: '',
        niche: this.settings()?.niche || 'عام',
        targetSellingPrice: null,
        images: [],
        newImageUrl: '',
        shippingCompanyId: this.shippingCompanies()[0]?.id || null,
        fulfillmentSource: FulfillmentSource.MerchantWarehouse,
        isFreeShipping: true,
        customShippingCost: null,
        initialStock: 100,
        productCostPrice: 0
      };
      this.generatedPreview = {};
    }

    this.showAiWizardModal = true;
  }

  closeAiWizard(): void {
    this.showAiWizardModal = false;
    this.wizardStep = 1;
    this.editingPageId = null;
  }

  onProductSelect(): void {
    if (this.aiRequest.selectedProductId) {
      const prod = this.products().find(p => p.id === +this.aiRequest.selectedProductId!);
      if (prod) {
        this.aiRequest.productName = prod.name;
        this.aiRequest.productDescription = prod.description;
        this.aiRequest.targetSellingPrice = prod.sellingPrice;
        if (prod.imageUrl && !this.aiRequest.images.includes(prod.imageUrl)) {
          this.aiRequest.images.push(prod.imageUrl);
        }
      }
    }
  }

  addImageToWizard(): void {
    if (this.aiRequest.newImageUrl?.trim()) {
      this.aiRequest.images.push(this.aiRequest.newImageUrl.trim());
      this.aiRequest.newImageUrl = '';
    }
  }

  removeImageFromWizard(index: number): void {
    this.aiRequest.images.splice(index, 1);
  }

  generateWithAi(): void {
    if (!this.aiRequest.productName.trim()) {
      this.notificationService.error('يرجى تحديد أو كتابة اسم المنتج');
      return;
    }

    this.generatingAi.set(true);

    this.storefrontService.generateAi({
      productName: this.aiRequest.productName.trim(),
      productDescription: this.aiRequest.productDescription?.trim(),
      niche: this.aiRequest.niche,
      targetSellingPrice: this.aiRequest.targetSellingPrice || undefined,
      existingImages: this.aiRequest.images,
      existingProductId: this.aiRequest.selectedProductId || undefined
    }).subscribe({
      next: (res) => {
        this.generatedPreview = {
          title: res.title,
          slug: res.slug,
          headline: res.headline,
          subheadline: res.subheadline,
          badge: res.badge,
          niche: res.niche,
          suggestedPrice: res.suggestedPrice,
          suggestedOriginalPrice: res.suggestedOriginalPrice,
          themeConfigJson: res.themeConfigJson,
          contentJson: res.contentJson,
          images: res.suggestedMediaUrls && res.suggestedMediaUrls.length > 0 ? res.suggestedMediaUrls : this.aiRequest.images
        };
        this.generatingAi.set(false);
        this.wizardStep = 3;
        this.notificationService.success('تم توليد محتوى صفحة الهبوط وتصميمها بنجاح 🪄');
      },
      error: () => {
        this.generatingAi.set(false);
        this.notificationService.error('حدث خطأ أثناء توليد الصفحة بالذكاء الاصطناعي');
      }
    });
  }

  saveLandingPage(isPublished: boolean = true): void {
    if (!this.generatedPreview.title || !this.generatedPreview.slug) {
      this.notificationService.error('يرجى استكمال عنوان ورابط الصفحة');
      return;
    }

    this.savingPage.set(true);

    const payload = {
      productId: this.aiRequest.selectedProductId,
      slug: this.generatedPreview.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      title: this.generatedPreview.title,
      headline: this.generatedPreview.headline,
      subheadline: this.generatedPreview.subheadline,
      badge: this.generatedPreview.badge,
      niche: this.generatedPreview.niche,
      themeConfigJson: this.generatedPreview.themeConfigJson || '{}',
      contentJson: this.generatedPreview.contentJson || '{}',
      mediaUrlsJson: JSON.stringify(this.generatedPreview.images || []),
      sellingPrice: this.generatedPreview.suggestedPrice || 399,
      originalPrice: this.generatedPreview.suggestedOriginalPrice || 599,
      shippingCompanyId: this.aiRequest.shippingCompanyId,
      fulfillmentSource: this.aiRequest.fulfillmentSource,
      isFreeShipping: this.aiRequest.isFreeShipping,
      customShippingCost: this.aiRequest.customShippingCost,
      isPublished: isPublished,
      autoCreateProductInInventory: !this.aiRequest.selectedProductId,
      initialStockQuantity: this.aiRequest.initialStock || 100,
      productCostPrice: this.aiRequest.productCostPrice || 0
    };

    if (this.editingPageId) {
      this.storefrontService.updateLandingPage(this.editingPageId, payload).subscribe({
        next: () => {
          this.savingPage.set(false);
          this.closeAiWizard();
          this.loadLandingPages();
          this.notificationService.success('تم تعديل صفحة الهبوط بنجاح');
        },
        error: (err) => {
          this.savingPage.set(false);
          this.notificationService.error(err?.error?.Message || 'خطأ أثناء تعديل الصفحة');
        }
      });
    } else {
      this.storefrontService.createLandingPage(payload).subscribe({
        next: () => {
          this.savingPage.set(false);
          this.closeAiWizard();
          this.loadLandingPages();
          this.notificationService.success('تم إنشاء ونشر صفحة الهبوط بنجاح 🚀');
        },
        error: (err) => {
          this.savingPage.set(false);
          this.notificationService.error(err?.error?.Message || 'خطأ أثناء إنشاء الصفحة');
        }
      });
    }
  }

  deleteLandingPage(page: ProductLandingPage): void {
    if (confirm(`هل أنت متأكد من حذف صفحة الهبوط '${page.title}'؟`)) {
      this.storefrontService.deleteLandingPage(page.id).subscribe({
        next: () => {
          this.loadLandingPages();
          this.notificationService.success('تم حذف صفحة الهبوط');
        },
        error: () => this.notificationService.error('فشل حذف الصفحة')
      });
    }
  }

  togglePublish(page: ProductLandingPage): void {
    this.storefrontService.togglePublish(page.id).subscribe({
      next: (res) => {
        page.isPublished = res.isPublished;
        this.notificationService.success(res.isPublished ? 'تم تفعيل نشر الصفحة' : 'تم إيقاف نشر الصفحة');
      },
      error: () => this.notificationService.error('فشل تعديل حالة النشر')
    });
  }

  copyUrl(path: string): void {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      this.notificationService.success('تم نسخ الرابط للحافظة بنجاح 📋');
    });
  }

  parseImages(json: string): string[] {
    try {
      return JSON.parse(json || '[]');
    } catch {
      return [];
    }
  }

  parseTheme(json: string): any {
    try {
      return JSON.parse(json || '{}');
    } catch {
      return {};
    }
  }

  get totalViews(): number {
    return this.landingPages().reduce((acc, p) => acc + (p.viewsCount || 0), 0);
  }

  get totalOrders(): number {
    return this.landingPages().reduce((acc, p) => acc + (p.ordersCount || 0), 0);
  }

  get conversionRate(): number {
    const views = this.totalViews;
    if (!views || views === 0) return 0;
    return Math.round((this.totalOrders / views) * 100 * 10) / 10;
  }

  getCoverImage(page: ProductLandingPage): string {
    const imgs = this.parseImages(page.mediaUrlsJson);
    return imgs[0] || page.storeLogoUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  }

  getDirectPageUrl(page: ProductLandingPage): string {
    const sub = page.storeSubdomain || this.settings()?.subdomain || 'store';
    return `${window.location.origin}/store/${sub}/${page.slug}`;
  }

  togglePagePublish(page: ProductLandingPage): void {
    this.togglePublish(page);
  }

  addImageUrl(): void {
    this.addImageToWizard();
  }

  removeImage(i: number): void {
    this.removeImageFromWizard(i);
  }

  triggerAiGeneration(): void {
    this.generateWithAi();
  }

  prevStep(): void {
    if (this.wizardStep === 3) {
      this.wizardStep = 2;
    } else if (this.wizardStep === 2) {
      this.wizardStep = 1;
    }
  }

  nextStep(): void {
    if (this.wizardStep === 1) {
      this.wizardStep = 2;
    } else if (this.wizardStep === 2) {
      this.wizardStep = 3;
    }
  }

  onSubdomainChange(): void {
    this.onSubdomainInput();
  }
}
