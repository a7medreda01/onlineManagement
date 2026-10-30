import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { StorefrontService } from '../../services/storefront.service';
import { PixelTrackingService } from '../../services/pixel-tracking.service';
import {
  ProductLandingPage,
  PublicLandingOrderRequest,
  PublicLandingOrderResponse
} from '../../models/models';
import { getSubdomain } from '../../utils/subdomain.util';

@Component({
  selector: 'app-public-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './public-landing-page.component.html',
  styleUrls: ['./public-landing-page.component.css']
})
export class PublicLandingPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storefrontService = inject(StorefrontService);
  private pixelTrackingService = inject(PixelTrackingService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private sanitizer = inject(DomSanitizer);

  subdomain = '';
  slug = '';
  currentYear = new Date().getFullYear();

  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  error = signal<string | null>(null);

  pageData = signal<ProductLandingPage | null>(null);
  orderSuccessData = signal<PublicLandingOrderResponse | null>(null);
  safeVideoUrl = signal<SafeResourceUrl | null>(null);

  // EasyOrders Sections Configuration (Toggles)
  sectionsConfig: any = {
    showCountdown: true,
    showStickyBuyButton: true,
    showVideo: true,
    showBundleOffers: true,
    showSpecs: true,
    showFeatures: true,
    showWhyChooseUs: true,
    showGuarantees: true,
    showReviews: true,
    showFaq: true,
    showCircularNodes: true
  };

  // Quantity Tier Bundles (EasyOrders signature feature)
  bundles = signal<Array<{
    quantity: number;
    title: string;
    price: number;
    originalPrice?: number;
    discountBadge: string;
    isPopular: boolean;
    isFreeShipping: boolean;
  }>>([]);
  selectedBundleIndex = signal<number>(0);

  // Technical Specs
  technicalSpecs = signal<Array<{ key: string; value: string }>>([]);

  // Parsed Theme & Content
  theme: any = {
    primaryColor: '#0284c7',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1e293b'
  };

  content: any = {
    features: [],
    whyChooseUs: [],
    customerReviews: [],
    faq: [],
    guarantees: []
  };

  images: string[] = [];
  selectedImage: string = '';
  activeImageIndex = signal<number>(0);

  selectImage(index: number): void {
    if (this.images.length > 0 && index >= 0 && index < this.images.length) {
      this.activeImageIndex.set(index);
      this.selectedImage = this.images[index];
    }
  }

  nextImage(): void {
    if (this.images.length <= 1) return;
    const nextIdx = (this.activeImageIndex() + 1) % this.images.length;
    this.selectImage(nextIdx);
  }

  prevImage(): void {
    if (this.images.length <= 1) return;
    const prevIdx = (this.activeImageIndex() - 1 + this.images.length) % this.images.length;
    this.selectImage(prevIdx);
  }

  // Visual Specs Callouts & Variant Options (Images 1 & 2)
  specs = signal<Array<{ title: string; description: string; badge?: string }>>([]);
  variantOptions = signal<Array<{ name: string; colorCode?: string; image?: string }>>([]);
  selectedVariant = signal<string>('');
  circularFeatures = signal<Array<{ title: string; spec: string; icon: string }>>([]);

  selectVariant(v: string): void {
    this.selectedVariant.set(v);
    const found = this.variantOptions().find(o => o.name === v);
    if (found?.image) {
      this.selectedImage = found.image;
    }
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  isVideoEmbed(url?: string): boolean {
    if (!url) return false;
    let cleanUrl = url.trim().toLowerCase();
    if (cleanUrl.includes('<iframe')) {
      const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        cleanUrl = srcMatch[1].toLowerCase();
      }
    }
    return cleanUrl.includes('youtube.com') ||
           cleanUrl.includes('youtu.be') ||
           cleanUrl.includes('youtube-nocookie.com') ||
           cleanUrl.includes('vimeo.com');
  }

  getVideoSafeUrl(url?: string): SafeResourceUrl {
    if (!url) return '';
    let cleanUrl = url.trim();

    // If user pasted an entire iframe tag, extract the src
    if (cleanUrl.includes('<iframe')) {
      const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        cleanUrl = srcMatch[1];
      }
    }

    // YouTube regex matching shorts, watch, youtu.be, embed
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|youtube-nocookie\.com\/embed\/)([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`
      );
    }

    // Vimeo regex
    const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      const vimeoId = vimeoMatch[1];
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`
      );
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(cleanUrl);
  }

  getFeatureIcon(title: string): string {
    const t = (title || '').toLowerCase();
    if (t.includes('تصوير') || t.includes('كاميرا') || t.includes('عدسة') || t.includes('رؤية') || t.includes('فيديو') || t.includes('ليلي')) return 'bi-camera-video-fill';
    if (t.includes('واي فاي') || t.includes('wifi') || t.includes('اتصال') || t.includes('شبكة') || t.includes('هاتف') || t.includes('مباشر')) return 'bi-wifi';
    if (t.includes('بطارية') || t.includes('شحن') || t.includes('طاقة') || t.includes('تسجيل') || t.includes('مستمر')) return 'bi-battery-charging';
    if (t.includes('مغناطيس') || t.includes('تثبيت') || t.includes('حجم') || t.includes('مدمج') || t.includes('قوي')) return 'bi-magnet-fill';
    if (t.includes('بلوتوث') || t.includes('سماعة') || t.includes('صوت') || t.includes('موسيقى')) return 'bi-bluetooth';
    if (t.includes('شاشة') || t.includes('لمس') || t.includes('عرض') || t.includes('ألوان')) return 'bi-display';
    if (t.includes('مقاوم') || t.includes('ماء') || t.includes('صدمات') || t.includes('غبار')) return 'bi-droplet-half';
    if (t.includes('ضمان') || t.includes('أصل') || t.includes('جودة') || t.includes('خامات')) return 'bi-shield-check';
    if (t.includes('سرعة') || t.includes('أداء') || t.includes('معالج') || t.includes('استجابة')) return 'bi-lightning-charge-fill';
    if (t.includes('استشعار') || t.includes('حركة') || t.includes('تنبيه') || t.includes('إشعار')) return 'bi-bell-fill';
    if (t.includes('شحن') || t.includes('توصيل')) return 'bi-truck';
    return 'bi-patch-check-fill';
  }

  getSpecEmoji(key: string): string {
    const k = (key || '').toLowerCase();
    if (k.includes('دقة') || k.includes('تصوير') || k.includes('كاميرا') || k.includes('عدسة') || k.includes('فيديو') || k.includes('resolution')) return '📷';
    if (k.includes('واي فاي') || k.includes('wifi') || k.includes('اتصال') || k.includes('شبكة') || k.includes('بلوتوث') || k.includes('تطبيق')) return '📶';
    if (k.includes('بطارية') || k.includes('شحن') || k.includes('طاقة') || k.includes('battery') || k.includes('تشغيل')) return '🔋';
    if (k.includes('رؤية') || k.includes('ليل') || k.includes('إضاءة') || k.includes('night')) return '🌙';
    if (k.includes('ذاكرة') || k.includes('تخزين') || k.includes('كارت') || k.includes('sd') || k.includes('ram')) return '💾';
    if (k.includes('صوت') || k.includes('ميكروفون') || k.includes('تسجيل') || k.includes('audio')) return '🎙️';
    if (k.includes('أبعاد') || k.includes('حجم') || k.includes('وزن') || k.includes('سمك') || k.includes('مقاس')) return '📐';
    if (k.includes('استشعار') || k.includes('حركة') || k.includes('أمان') || k.includes('إنذار') || k.includes('sensor')) return '🚨';
    if (k.includes('توافق') || k.includes('نظام') || k.includes('أندرويد') || k.includes('ios') || k.includes('هاتف')) return '📱';
    if (k.includes('مقاوم') || k.includes('ماء') || k.includes('حرارة') || k.includes('صدمات')) return '🛡️';
    if (k.includes('محتويات') || k.includes('علبة') || k.includes('ملحقات') || k.includes('كرتونة')) return '📦';
    if (k.includes('ضمان') || k.includes('صناعة') || k.includes('منشأ') || k.includes('موديل')) return '🏷️';
    return '⚙️';
  }

  // Conditional Size Selection (e.g. shoes, clothing, abayas)
  hasSizes = signal<boolean>(false);
  selectedSize = signal<string>('');
  sizes = signal<string[]>([]);

  selectSize(s: string): void {
    this.selectedSize.set(s);
  }

  getStoreCatalogLink(): any[] {
    if (getSubdomain()) {
      return ['/'];
    }
    return ['/store', this.subdomain];
  }

  // Countdown timer state
  timerHours = 2;
  timerMinutes = 43;
  timerSeconds = 58;
  private timerInterval: any = null;

  // Checkout Form
  orderForm: PublicLandingOrderRequest = {
    customerName: '',
    phone: '',
    alternativePhone: '',
    governorateId: 1,
    districtName: '',
    address: '',
    quantity: 1,
    notes: ''
  };

  showAltPhone = signal<boolean>(false);
  showNotes = signal<boolean>(false);
  isOrderSectionVisible = signal<boolean>(false);
  private orderSectionObserver?: IntersectionObserver;

  // Popular Egyptian Governorates
  governorates = [
    { id: 1, name: 'القاهرة' },
    { id: 2, name: 'الجيزة' },
    { id: 3, name: 'الإسكندرية' },
    { id: 4, name: 'القليوبية' },
    { id: 5, name: 'الشرقية' },
    { id: 6, name: 'الدقهلية' },
    { id: 7, name: 'البحيرة' },
    { id: 8, name: 'الغربية' },
    { id: 9, name: 'المنوفية' },
    { id: 10, name: 'دمياط' },
    { id: 11, name: 'كفر الشيخ' },
    { id: 12, name: 'بورسعيد' },
    { id: 13, name: 'الإسماعيلية' },
    { id: 14, name: 'السويس' },
    { id: 15, name: 'شمال سيناء' },
    { id: 16, name: 'جنوب سيناء' },
    { id: 17, name: 'بني سويف' },
    { id: 18, name: 'الفيوم' },
    { id: 19, name: 'المنيا' },
    { id: 20, name: 'أسيوط' },
    { id: 21, name: 'سوهاج' },
    { id: 22, name: 'قنا' },
    { id: 23, name: 'الأقصر' },
    { id: 24, name: 'أسوان' },
    { id: 25, name: 'البحر الأحمر' },
    { id: 26, name: 'الوادي الجديد' },
    { id: 27, name: 'مطروح' }
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const hostSub = getSubdomain();
      if (hostSub) {
        this.subdomain = hostSub;
        this.slug = params['slug'] || params['subdomain'] || '';
      } else if (params['subdomain'] && params['slug']) {
        this.subdomain = params['subdomain'];
        this.slug = params['slug'];
      } else if (params['slug'] && !params['subdomain']) {
        // Direct link e.g. besnesy.com/seven -> treat as store catalog
        this.router.navigate(['/store', params['slug']], { replaceUrl: true });
        return;
      }

      if (this.subdomain && this.slug) {
        this.loadLandingPage();
      }
    });

    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.orderSectionObserver?.disconnect();
  }

  loadLandingPage(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storefrontService.getPublicLandingPage(this.subdomain, this.slug).subscribe({
      next: (page) => {
        this.pageData.set(page);

        // Precompute safe video URL once to prevent iframe reloading / flickering on timer ticks
        if (page.videoUrl && this.isVideoEmbed(page.videoUrl)) {
          this.safeVideoUrl.set(this.getVideoSafeUrl(page.videoUrl));
        } else {
          this.safeVideoUrl.set(null);
        }

        // 1. Dynamic Store & Product SEO Optimization
        const storeName = page.storeDisplayName || page.storeSubdomain || '';
        const pageTitle = page.metaTitle || (storeName ? `${page.title} | ${storeName}` : page.title);
        const pageDesc = page.metaDescription || page.headline || page.subheadline || `عرض خاص وتخفيض لفترة محدودة على ${page.title}. اطلب الآن والدفع عند الاستلام مع ضمان استبدال شامل.`;
        const pageKeywords = page.metaKeywords || `${page.title}, ${page.niche}, تسوق أونلاين, دفع عند الاستلام, شحن مجاني مصر, تسوق`;
        
        // Parse images early for OG Image
        try {
          this.images = JSON.parse(page.mediaUrlsJson || '[]');
        } catch {
          this.images = [];
        }
        if (this.images.length > 0) {
          this.selectedImage = this.images[0];
        } else {
          this.selectedImage = 'https://placehold.co/600x500/1e293b/f8fafc?text=' + encodeURIComponent(page.title);
        }

        const pageOgImage = this.resolveUrl(page.ogImageUrl || (this.images.length > 0 ? this.images[0] : ''));

        this.titleService.setTitle(pageTitle);
        this.metaService.updateTag({ name: 'description', content: pageDesc });
        this.metaService.updateTag({ name: 'keywords', content: pageKeywords });
        this.metaService.updateTag({ property: 'og:title', content: pageTitle });
        this.metaService.updateTag({ property: 'og:description', content: pageDesc });
        this.metaService.updateTag({ property: 'og:image', content: pageOgImage });
        this.metaService.updateTag({ property: 'og:type', content: 'product' });
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.metaService.updateTag({ name: 'twitter:title', content: pageTitle });
        this.metaService.updateTag({ name: 'twitter:description', content: pageDesc });
        this.metaService.updateTag({ name: 'twitter:image', content: pageOgImage });

        // 2. Initialize Social Media Tracking Pixels (Meta, TikTok, Snapchat, GA4/GTM)
        const fbPixel = page.facebookPixelId || page.storeFacebookPixelId;
        const ttPixel = page.tiktokPixelId || page.storeTikTokPixelId;
        const snapPixel = page.snapchatPixelId || page.storeSnapchatPixelId;
        const gaPixel = page.googleAnalyticsId || page.storeGoogleAnalyticsId;

        this.pixelTrackingService.initialize({
          facebookPixelId: fbPixel,
          tiktokPixelId: ttPixel,
          snapchatPixelId: snapPixel,
          googleAnalyticsId: gaPixel
        });

        this.pixelTrackingService.trackPageView(pageTitle);
        this.pixelTrackingService.trackViewContent({
          id: page.slug,
          name: page.title,
          category: page.niche,
          price: page.sellingPrice,
          currency: 'EGP'
        });

        // 3. Parse Sections Configuration (EasyOrders Show/Hide Control)
        try {
          if (page.sectionsConfigJson) {
            const parsedConfig = JSON.parse(page.sectionsConfigJson);
            this.sectionsConfig = { ...this.sectionsConfig, ...parsedConfig };
          }
        } catch {}

        // Automatically activate specs section if the product has specifications configured
        if (page.specsJson && page.specsJson !== '[]') {
          this.sectionsConfig.showSpecs = true;
        }

        // 4. Parse Theme
        try {
          this.theme = JSON.parse(page.themeConfigJson || '{}');
          if (!this.theme.primaryColor) this.theme.primaryColor = '#0284c7';
          if (!this.theme.accentColor) this.theme.accentColor = '#f59e0b';
        } catch {
          this.theme = { primaryColor: '#0284c7', accentColor: '#f59e0b' };
        }

        // 5. Parse and normalize Content
        try {
          const raw = JSON.parse(page.contentJson || '{}');

          let features = raw.features || raw.benefits || [];
          if (!Array.isArray(features) || features.length === 0) {
            features = [
              { title: 'دقة تصوير فائقة مع رؤية ليلية', description: `تم تصنيع ${page.title} بأعلى المعايير لتحمل الاستخدام اليومي الشاق وتقديم كفاءة استثنائية.`, icon: 'bi-camera-video-fill' },
              { title: 'اتصال واي فاي وبث مباشر للهاتف', description: 'تقنيات حديثة مصممة لتوفير وقتك ومجهودك وتمنحك أفضل تجربة استخدام.', icon: 'bi-wifi' },
              { title: 'حجم مدمج ومغناطيس قوي للتثبيت', description: 'تثبيت فوري في أي مكان وبكل سهولة دون الحاجة لأسلاك معقدة.', icon: 'bi-magnet-fill' },
              { title: 'بطارية داخلية وتسجيل مستمر', description: 'سعة طاقة تدوم طويلاً مع أعلى كفاءة حفظ وتشغيل دائم.', icon: 'bi-battery-charging' }
            ];
          } else {
            features = features.map((f: any) => {
              if (typeof f === 'string') {
                return {
                  title: f,
                  description: 'مصنوع بأعلى معايير الدقة والجودة ليمنحك أفضل تجربة استخدام.',
                  icon: this.getFeatureIcon(f)
                };
              }
              return {
                title: f.title || f.name || 'ميزة استثنائية',
                description: f.description || f.desc || f.text || 'تقنيات متطورة مصممة لتوفر لك تجربة مريحة وعملية.',
                icon: f.icon || this.getFeatureIcon(f.title || f.name || '')
              };
            });
          }

          let whyChooseUs = raw.whyChooseUs || raw.painPoints || [];
          if (!Array.isArray(whyChooseUs) || whyChooseUs.length === 0) {
            whyChooseUs = [
              { title: 'تجنب المنتجات الرديئة والمقلدة', text: 'نوفر لك النسخة الأصلية 100% مع ضمان حقيقي واسترجاع مجاني.', problem: 'الخوف من شراء منتج مخالف للصور والوصف؟', solution: 'نضمن تطابق المنتج بنسبة 100% مع صور الإعلان مع ضمان استبدال مجاني.' },
              { title: 'شحن فوري لباب بيتك بدون مفاجآت', text: 'شحن آمن مع متابعة مستمرة عبر واتساب حتى استلامك للشحنة.', problem: 'تأخر الشحن أو مصاريف توصيل مخفية؟', solution: 'شحن سريع ومجاني حتى باب بيتك مع التزام تام بموعد التسليم.' }
            ];
          } else {
            whyChooseUs = whyChooseUs.map((w: any) => ({
              title: w.title || w.problem || 'ميزة استثنائية',
              text: w.text || w.solution || 'أفضل تجربة شراء متكاملة.',
              problem: w.problem || w.title,
              solution: w.solution || w.text
            }));
          }

          let reviews = raw.customerReviews || raw.testimonials || [];
          if (!Array.isArray(reviews) || reviews.length === 0) {
            reviews = [
              { name: 'كريم سامي', city: 'القاهرة', rating: 5, comment: 'بصراحة المنتج طلع أحسن من الصور بكتير، وخامته ممتازة جداً وتغليفه شيك جداً، شكراً ليكم.' },
              { name: 'منى عبد العزيز', city: 'الجيزة', rating: 5, comment: 'وصلني في أقل من 24 ساعة، والمندوب كان محترم جداً والمنتج وصل مغلف وسليم تماماً. خدمة 10 على 10.' },
              { name: 'عمر هشام', city: 'الإسكندرية', rating: 5, comment: 'أفضل تجربة شراء أونلاين، جودة وسعر ممتازين ومكمل معاكوا دايماً.' }
            ];
          } else {
            reviews = reviews.map((r: any) => ({
              name: r.name || 'عميل معتمد',
              city: r.city || 'مصر',
              rating: r.rating || 5,
              comment: r.comment || r.review || 'منتج ممتاز وتوصيل سريع، أنصح به بشدة.'
            }));
          }

          let faq = raw.faq || raw.faqs || [];
          if (!Array.isArray(faq) || faq.length === 0) {
            faq = [
              { question: 'ما هو نظام الدفع والتوصيل؟', answer: 'الدفع يتم عند استلام الشحنة لباب منزلك، مع ضمان استبدال واسترجاع مجاني لمدة 14 يوماً ضد عيوب الصناعة.' },
              { question: 'كم تستغرق مدة التوصيل؟', answer: 'يصلك الطلب خلال 24 إلى 48 ساعة كحد أقصى لجميع محافظات جمهورية مصر العربية.' },
              { question: 'ما هي سياسة الاسترجاع أو الاستبدال؟', answer: 'نوفر لك ضمان استبدال واسترجاع مجاني لمدة 14 يوماً في حالة وجود أي ملاحظة أو عيب صناعة.' },
              { question: 'هل الشحن مجاني فعلاً؟', answer: 'نعم، الشحن مجاني بالكامل لفترة محدودة ولن تدفع أي رسوم إضافية غير سعر المنتج المعروض.' }
            ];
          }

          this.content = {
            features,
            whyChooseUs,
            customerReviews: reviews,
            faq,
            guarantees: raw.guarantees || []
          };

          // 6. Parse Technical Specs (EasyOrders style Table)
          let parsedSpecs: any[] = [];
          try {
            parsedSpecs = JSON.parse(page.specsJson || '[]');
          } catch {}
          if (!Array.isArray(parsedSpecs) || parsedSpecs.length === 0) {
            parsedSpecs = raw.specs || [];
          }
          if (Array.isArray(parsedSpecs) && parsedSpecs.length > 0) {
            this.technicalSpecs.set(parsedSpecs.map((s: any) => ({
              key: s.key || s.title || 'المواصفة',
              value: s.value || s.description || s.spec || ''
            })));
            this.specs.set(parsedSpecs);
          } else {
            const defaultSpecs = [
              { key: 'الضمان المعتمد', value: 'سنتين استبدال فوري ضد عيوب الصناعة' },
              { key: 'سرعة التوصيل', value: 'شحن فوري لباب البيت خلال 24 - 48 ساعة' },
              { key: 'خدمة العملاء', value: 'متابعة عبر الواتساب على مدار الساعة' },
              { key: 'سياسة الاستبدال', value: '14 يوماً حق استبدال واسترجاع مجاني' }
            ];
            this.technicalSpecs.set(defaultSpecs);
            this.specs.set(defaultSpecs.map(s => ({ title: s.key, description: s.value })));
          }

          // 7. Parse Variants / Colors (Only show if product actually has multiple options)
          let parsedVariants: any[] = [];
          try {
            parsedVariants = JSON.parse(page.variantOptionsJson || '[]');
          } catch {}
          if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
            parsedVariants = raw.variantOptions || [];
          }
          if (Array.isArray(parsedVariants)) {
            parsedVariants = parsedVariants.filter((v: any) => {
              const name = String(v?.name || '').trim();
              return name &&
                !name.includes('النسخة القياسية') &&
                !name.includes('الافتراضية') &&
                !name.includes('الأساسية') &&
                name !== 'Standard' &&
                name !== 'Default';
            });
          }
          if (parsedVariants.length > 1) {
            this.variantOptions.set(parsedVariants);
            this.selectedVariant.set(parsedVariants[0].name);
          } else {
            this.variantOptions.set([]);
            this.selectedVariant.set('');
          }

          // 8. Parse Circular Feature Nodes (Only if provided in page content)
          let circular = raw.circularFeatures || [];
          if (Array.isArray(circular) && circular.length > 0) {
            this.circularFeatures.set(circular);
          } else {
            this.circularFeatures.set([]);
          }

          // 9. Parse Quantity Tier Bundles (EasyOrders style)
          let parsedBundles: any[] = [];
          try {
            parsedBundles = JSON.parse(page.bundleOffersJson || '[]');
          } catch {}
          if (!Array.isArray(parsedBundles) || parsedBundles.length === 0) {
            const orig = page.originalPrice && page.originalPrice > page.sellingPrice ? page.originalPrice : Math.round(page.sellingPrice * 1.35);
            parsedBundles = [
              {
                quantity: 1,
                title: 'قطعة واحدة (شراء أساسي)',
                price: page.sellingPrice,
                originalPrice: orig,
                discountBadge: 'العرض الأساسي',
                isPopular: false,
                isFreeShipping: page.isFreeShipping
              },
              {
                quantity: 2,
                title: 'قطعتين (وفّر 150 ج.م إضافية)',
                price: Math.round(page.sellingPrice * 1.8),
                originalPrice: orig * 2,
                discountBadge: 'الأكثر طلباً 🔥',
                isPopular: true,
                isFreeShipping: true
              },
              {
                quantity: 3,
                title: '3 قطع (باقة التوفير العائلية)',
                price: Math.round(page.sellingPrice * 2.5),
                originalPrice: orig * 3,
                discountBadge: 'أعلى توفير 🎁',
                isPopular: false,
                isFreeShipping: true
              }
            ];
          }
          this.bundles.set(parsedBundles);
          // Default selection to 1 piece (the first bundle, index 0)
          this.selectedBundleIndex.set(0);
          this.orderForm.quantity = parsedBundles[0]?.quantity || 1;

          // 10. Conditional Size Selection
          const hasSizesFlag = !!raw.hasSizes;
          this.hasSizes.set(hasSizesFlag);
          if (hasSizesFlag) {
            let sizeList: string[] = [];
            if (Array.isArray(raw.sizes) && raw.sizes.length > 0) {
              sizeList = raw.sizes.map((s: any) => String(s).trim()).filter(Boolean);
            } else if (typeof raw.sizes === 'string') {
              sizeList = raw.sizes.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            if (sizeList.length === 0) {
              sizeList = ['S', 'M', 'L', 'XL', 'XXL'];
            }
            this.sizes.set(sizeList);
            this.selectedSize.set(sizeList[0]);
          } else {
            this.sizes.set([]);
            this.selectedSize.set('');
          }
        } catch {
          this.hasSizes.set(false);
          this.sizes.set([]);
          this.selectedSize.set('');
          this.content = {
            features: [
              { title: 'خامات أصلية وتصنيع فائق الجودة', description: 'مصنوع بأعلى المعايير لتحمل الاستخدام اليومي الشاق.', icon: 'bi-shield-check' },
              { title: 'أداء عالي وسرعة استجابة', description: 'تقنيات حديثة مصممة لتوفير وقتك ومجهودك.', icon: 'bi-lightning-charge-fill' }
            ],
            whyChooseUs: [],
            customerReviews: [],
            faq: [],
            guarantees: []
          };
        }

        this.loading.set(false);
        this.setupOrderSectionObserver();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.Message || 'عذراً، صفحة الهبوط المطلوبة غير موجودة أو تم إيقاف نشرها.');
      }
    });
  }

  setupOrderSectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    setTimeout(() => {
      const el = document.getElementById('orderSection');
      if (el) {
        this.orderSectionObserver?.disconnect();
        this.orderSectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            this.isOrderSectionVisible.set(entry.isIntersecting);
          });
        }, { threshold: 0.1 });
        this.orderSectionObserver.observe(el);
      }
    }, 500);
  }

  activeFaqIndex: number | null = 0;

  toggleFaq(index: number): void {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  get discountPercentage(): number {
    const p = this.pageData();
    if (!p || !p.originalPrice || p.originalPrice <= p.sellingPrice) return 0;
    return Math.round(((p.originalPrice - p.sellingPrice) / p.originalPrice) * 100);
  }

  startCountdown(): void {
    this.timerInterval = setInterval(() => {
      if (this.timerSeconds > 0) {
        this.timerSeconds--;
      } else {
        if (this.timerMinutes > 0) {
          this.timerMinutes--;
          this.timerSeconds = 59;
        } else if (this.timerHours > 0) {
          this.timerHours--;
          this.timerMinutes = 59;
          this.timerSeconds = 59;
        } else {
          // Reset timer to keep urgency alive
          this.timerHours = 2;
          this.timerMinutes = 30;
          this.timerSeconds = 0;
        }
      }
    }, 1000);
  }

  onGovernorateChange(): void {
    const selected = this.governorates.find(g => g.id === +this.orderForm.governorateId);
    if (selected) {
      // selected governorate
    }
  }

  selectBundle(index: number): void {
    const list = this.bundles();
    if (index >= 0 && index < list.length) {
      this.selectedBundleIndex.set(index);
      const b = list[index];
      this.orderForm.quantity = b.quantity;
      this.onInitiateCheckout();
    }
  }

  changeQuantity(delta: number): void {
    const newQty = this.orderForm.quantity + delta;
    if (newQty >= 1 && newQty <= 20) {
      this.orderForm.quantity = newQty;
      // Match bundle if exists
      const matchIdx = this.bundles().findIndex(b => b.quantity === newQty);
      if (matchIdx >= 0) {
        this.selectedBundleIndex.set(matchIdx);
      }
    }
  }

  onInitiateCheckout(): void {
    const p = this.pageData();
    if (!p) return;
    this.pixelTrackingService.trackInitiateCheckout({
      id: p.slug,
      name: p.title,
      quantity: this.orderForm.quantity,
      totalAmount: this.totalAmount,
      currency: 'EGP'
    });
  }

  scrollToOrderForm(): void {
    this.onInitiateCheckout();
    const element = document.getElementById('orderSection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  get isFreeShippingActive(): boolean {
    const p = this.pageData();
    if (!p) return true;
    if (p.isFreeShipping) return true;
    // Check if selected bundle gives free shipping
    const bList = this.bundles();
    if (bList.length > 0 && this.selectedBundleIndex() < bList.length) {
      return !!bList[this.selectedBundleIndex()].isFreeShipping;
    }
    return false;
  }

  get shippingCost(): number {
    const p = this.pageData();
    if (!p || this.isFreeShippingActive) return 0;
    return p.customShippingCost ?? 40;
  }

  get totalAmount(): number {
    const p = this.pageData();
    if (!p) return 0;
    const bList = this.bundles();
    let productSubtotal = p.sellingPrice * this.orderForm.quantity;

    if (bList.length > 0 && this.selectedBundleIndex() < bList.length) {
      const activeB = bList[this.selectedBundleIndex()];
      if (activeB.quantity === this.orderForm.quantity) {
        productSubtotal = activeB.price;
      }
    }

    return productSubtotal + this.shippingCost;
  }

  submitOrder(): void {
    if (!this.orderForm.customerName.trim()) {
      alert('يرجى كتابة الاسم بالكامل');
      return;
    }

    if (!this.orderForm.phone.trim() || this.orderForm.phone.length < 9) {
      alert('يرجى كتابة رقم هاتف صحيح');
      return;
    }

    if (!this.orderForm.address.trim()) {
      alert('يرجى كتابة العنوان بالتفصيل لضمان سرعة التوصيل');
      return;
    }

    if (this.selectedVariant() && !this.orderForm.notes?.includes('اللون / الموديل:')) {
      this.orderForm.notes = `اللون / الموديل: ${this.selectedVariant()}` + (this.orderForm.notes ? ` | ${this.orderForm.notes}` : '');
    }

    if (this.hasSizes() && this.selectedSize() && !this.orderForm.notes?.includes('المقاس:')) {
      this.orderForm.notes = `المقاس المختار: ${this.selectedSize()}` + (this.orderForm.notes ? ` | ${this.orderForm.notes}` : '');
    }

    // Include selected bundle note
    const bList = this.bundles();
    if (bList.length > 0 && this.selectedBundleIndex() < bList.length) {
      const b = bList[this.selectedBundleIndex()];
      this.orderForm.notes = `عرض الباقة: ${b.title}` + (this.orderForm.notes ? ` | ${this.orderForm.notes}` : '');
    }

    // Set exact total amount and shipping cost displayed on landing page
    this.orderForm.totalAmount = this.totalAmount;
    this.orderForm.shippingCost = this.shippingCost;

    this.submitting.set(true);
    this.storefrontService.submitPublicOrder(this.subdomain, this.slug, this.orderForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.orderSuccessData.set(res);

        // Fire Purchase event across Meta, TikTok, Snapchat, GA4
        const p = this.pageData();
        this.pixelTrackingService.trackPurchase({
          orderNumber: res.orderNumber,
          totalAmount: res.totalAmount,
          currency: 'EGP',
          productName: p?.title || 'طلب منتج',
          quantity: this.orderForm.quantity
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.submitting.set(false);
        alert(err?.error?.Message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  private injectPixels(facebookPixelId?: string, tiktokPixelId?: string): void {
    // Facebook Pixel
    if (facebookPixelId && !(window as any).fbq) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }
  }

  getWhatsAppChatUrl(): string {
    const p = this.pageData();
    const order = this.orderSuccessData();
    if (order?.whatsAppFollowupUrl) {
      return order.whatsAppFollowupUrl;
    }
    const phone = p?.storeWhatsApp || '201000000000';
    const text = encodeURIComponent(`مرحباً، أود متابعة طلبي رقم #${order?.orderNumber} لمنتج: ${p?.title}`);
    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`;
  }
}
