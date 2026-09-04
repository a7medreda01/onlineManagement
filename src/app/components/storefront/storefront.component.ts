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

  // Search and status filter for landing pages
  searchTerm = '';
  statusFilter: 'all' | 'published' | 'draft' = 'all';

  get filteredLandingPages(): ProductLandingPage[] {
    let list = this.landingPages();
    if (this.statusFilter === 'published') {
      list = list.filter(p => p.isPublished);
    } else if (this.statusFilter === 'draft') {
      list = list.filter(p => !p.isPublished);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.headline && p.headline.toLowerCase().includes(q))
      );
    }
    return list;
  }

  get publishedPagesCount(): number {
    return this.landingPages().filter(p => p.isPublished).length;
  }

  get draftPagesCount(): number {
    return this.landingPages().filter(p => !p.isPublished).length;
  }

  getStorePublicUrl(): string {
    const sub = this.settings()?.subdomain || 'seven';
    return `https://${sub}.besnesy.com`;
  }

  getPagePublicUrl(page: ProductLandingPage): string {
    const sub = page.storeSubdomain || this.settings()?.subdomain || 'seven';
    return `https://${sub}.besnesy.com/${page.slug}`;
  }

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
    customDomain: '',
    customDomainStatus: 'PendingDns',
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
    productSpecs: '',
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

  // Apparel / Shoes Size Configuration
  hasSizes: boolean = false;
  customSizesStr: string = '40, 41, 42, 43, 44, 45';

  setSizePreset(type: 'shoes-men' | 'shoes-women' | 'clothes-general' | 'free-size'): void {
    this.hasSizes = true;
    if (type === 'shoes-men') {
      this.customSizesStr = '40, 41, 42, 43, 44, 45';
    } else if (type === 'shoes-women') {
      this.customSizesStr = '36, 37, 38, 39, 40, 41';
    } else if (type === 'clothes-general') {
      this.customSizesStr = 'S, M, L, XL, XXL, 3XL';
    } else if (type === 'free-size') {
      this.customSizesStr = 'One Size (وان سايز)';
    }
  }

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

  // Visual Editor State
  editorTab: 'general' | 'images' | 'features' | 'why' | 'reviews' | 'faq' = 'general';
  editableFeatures: Array<{ title: string; description: string; icon: string }> = [];
  editableWhyChooseUs: Array<{ title: string; text: string }> = [];
  editableReviews: Array<{ name: string; city: string; rating: number; comment: string }> = [];
  editableFaqs: Array<{ question: string; answer: string }> = [];
  uploadingProductImage = signal<boolean>(false);
  manualImageUrl = '';

  initEditableContent(contentJson?: string): void {
    try {
      const raw = JSON.parse(contentJson || '{}');
      this.editableFeatures = (raw.features || raw.benefits || []).map((f: any) => ({
        title: f.title || '',
        description: f.description || '',
        icon: f.icon || 'bi-shield-check'
      }));
      if (this.editableFeatures.length === 0) {
        this.editableFeatures = [
          { title: 'جودة استثنائية وخامات ممتازة', description: 'مصنوع بأعلى المعايير لضمان أفضل تجربة استخدام واعتمادية تدوم طويلاً.', icon: 'bi-shield-check' },
          { title: 'أداء عملي وسرعة استجابة', description: 'تصميم مبتكر يوفر الوقت والجهد ويفي بجميع متطلباتك اليومية.', icon: 'bi-lightning-charge-fill' }
        ];
      }

      this.editableWhyChooseUs = (raw.whyChooseUs || raw.painPoints || []).map((w: any) => ({
        title: w.title || w.problem || '',
        text: w.text || w.solution || ''
      }));
      if (this.editableWhyChooseUs.length === 0) {
        this.editableWhyChooseUs = [
          { title: 'تجنب المنتجات الرديئة والمقلدة', text: 'نضمن لك الحصول على النسخة الأصلية 100% مع الفحص والمعاينة قبل الدفع.' }
        ];
      }

      this.editableReviews = (raw.customerReviews || raw.testimonials || []).map((r: any) => ({
        name: r.name || 'عميل معتمد',
        city: r.city || 'القاهرة',
        rating: r.rating || 5,
        comment: r.comment || r.review || 'منتج ممتاز جداً وتوصيل سريع وتغليف شيك.'
      }));
      if (this.editableReviews.length === 0) {
        this.editableReviews = [
          { name: 'كريم سامي', city: 'القاهرة', rating: 5, comment: 'المنتج فاق توقعاتي ووصل في نفس اليوم، شكراً لكم.' }
        ];
      }

      this.editableFaqs = (raw.faq || raw.faqs || []).map((q: any) => ({
        question: q.question || '',
        answer: q.answer || ''
      }));
      if (this.editableFaqs.length === 0) {
        this.editableFaqs = [
          { question: 'هل يمكنني معاينة المنتج قبل الاستلام والدفع؟', answer: 'نعم بالتأكيد! يمكنك فحص الشحنة مع المندوب قبل دفع أي مبالغ.' }
        ];
      }
      // Handle product sizes configuration
      this.hasSizes = !!raw.hasSizes;
      if (raw.sizes) {
        if (Array.isArray(raw.sizes)) {
          this.customSizesStr = raw.sizes.join(', ');
        } else if (typeof raw.sizes === 'string') {
          this.customSizesStr = raw.sizes;
        }
      } else {
        this.customSizesStr = '40, 41, 42, 43, 44, 45';
      }
    } catch {
      this.hasSizes = false;
      this.customSizesStr = '40, 41, 42, 43, 44, 45';
      this.editableFeatures = [];
      this.editableWhyChooseUs = [];
      this.editableReviews = [];
      this.editableFaqs = [];
    }
  }

  addFeature(): void {
    this.editableFeatures.push({ title: 'ميزة جديدة', description: 'شرح تفصيلي للميزة وفوائدها للعميل.', icon: 'bi-check-circle-fill' });
  }

  removeFeature(index: number): void {
    this.editableFeatures.splice(index, 1);
  }

  addWhyItem(): void {
    this.editableWhyChooseUs.push({ title: 'المشكلة والحل', text: 'كيف يقضي هذا المنتج على المشكلة تماماً مقارنة بالبدائل.' });
  }

  removeWhyItem(index: number): void {
    this.editableWhyChooseUs.splice(index, 1);
  }

  addReview(): void {
    this.editableReviews.push({ name: 'اسم العميل', city: 'القاهرة', rating: 5, comment: 'رأي العميل في جودة المنتج والخدمة.' });
  }

  removeReview(index: number): void {
    this.editableReviews.splice(index, 1);
  }

  addFaq(): void {
    this.editableFaqs.push({ question: 'سؤال شائع جديد؟', answer: 'إجابة واضحة ومطمئنة للعميل تشجعه على الشراء.' });
  }

  removeFaq(index: number): void {
    this.editableFaqs.splice(index, 1);
  }

  onProductImageUploaded(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingProductImage.set(true);
    this.storefrontService.uploadMedia(file).subscribe({
      next: (res) => {
        this.uploadingProductImage.set(false);
        if (!this.generatedPreview.images) this.generatedPreview.images = [];
        this.generatedPreview.images.push(res.url);
        this.notificationService.success('تم رفع الصورة بنجاح وإضافتها لسلايدر المنتج');
      },
      error: (err) => {
        this.uploadingProductImage.set(false);
        this.notificationService.error(err?.error?.Message || 'فشل رفع الصورة');
      }
    });
  }

  addManualProductImage(): void {
    if (this.manualImageUrl?.trim()) {
      if (!this.generatedPreview.images) this.generatedPreview.images = [];
      this.generatedPreview.images.push(this.manualImageUrl.trim());
      this.manualImageUrl = '';
      this.notificationService.success('تمت إضافة الصورة بنجاح');
    }
  }

  addManualImage(): void {
    this.addManualProductImage();
  }

  removeProductImage(index: number): void {
    if (this.generatedPreview.images && this.generatedPreview.images.length > index) {
      this.generatedPreview.images.splice(index, 1);
    }
  }

  setAsMainImage(index: number): void {
    if (this.generatedPreview.images && this.generatedPreview.images.length > index && index > 0) {
      const img = this.generatedPreview.images.splice(index, 1)[0];
      this.generatedPreview.images.unshift(img);
      this.notificationService.success('تم تعيين الصورة كغلاف رئيسي للمنتج');
    }
  }

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

      this.initEditableContent(existingPage.contentJson);
      this.editorTab = 'general';
      this.wizardStep = 3;
    } else {
      this.editingPageId = null;
      this.wizardStep = 1;
      this.editorTab = 'general';
      this.aiRequest = {
        selectedProductId: null,
        productName: '',
        productDescription: '',
        productSpecs: '',
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
    this.wizardStep = 3;
    
    const combinedDescription = [
      this.aiRequest.productDescription?.trim(),
      this.aiRequest.productSpecs?.trim() ? `المواصفات الفنية والمميزات:\n${this.aiRequest.productSpecs.trim()}` : ''
    ].filter(Boolean).join('\n\n');

    this.storefrontService.generateAi({
      productName: this.aiRequest.productName.trim(),
      productDescription: combinedDescription || undefined,
      niche: this.aiRequest.niche,
      targetSellingPrice: this.aiRequest.targetSellingPrice || undefined,
      existingImages: this.aiRequest.images,
      existingProductId: this.aiRequest.selectedProductId || undefined
    }).subscribe({
      next: (res) => {
        const productImages = (this.aiRequest.images && this.aiRequest.images.length > 0)
          ? this.aiRequest.images
          : (res.suggestedMediaUrls && res.suggestedMediaUrls.length > 0 ? res.suggestedMediaUrls : []);

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
          images: productImages
        };
        this.initEditableContent(res.contentJson);
        this.editorTab = 'general';
        this.generatingAi.set(false);
        this.notificationService.success('تم توليد محتوى صفحة الهبوط وتصميمها بنجاح 🪄');
      },
      error: () => {
        this.generatingAi.set(false);
        this.wizardStep = 2;
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

    const parsedSizes = this.hasSizes && this.customSizesStr
      ? this.customSizesStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const contentPayload = {
      hasSizes: this.hasSizes,
      sizes: parsedSizes,
      features: this.editableFeatures,
      benefits: this.editableFeatures,
      whyChooseUs: this.editableWhyChooseUs,
      customerReviews: this.editableReviews,
      testimonials: this.editableReviews,
      faq: this.editableFaqs,
      faqs: this.editableFaqs,
      guarantees: [
        "ضمان جودة وأصالة 100%",
        "معاينة كاملة قبل دفع أي مليم",
        "شحن سريع وآمن لباب المنزل",
        "استبدال واسترجاع مجاني لمدة 14 يوماً"
      ]
    };

    const payload = {
      productId: this.aiRequest.selectedProductId,
      slug: this.generatedPreview.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      title: this.generatedPreview.title,
      headline: this.generatedPreview.headline,
      subheadline: this.generatedPreview.subheadline,
      badge: this.generatedPreview.badge,
      niche: this.generatedPreview.niche,
      themeConfigJson: this.generatedPreview.themeConfigJson || '{}',
      contentJson: JSON.stringify(contentPayload),
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

  getSubdomainPageUrl(page: ProductLandingPage): string {
    const sub = page.storeSubdomain || this.settings()?.subdomain || 'seven';
    return `https://${sub}.besnesy.com/${page.slug}`;
  }
}
