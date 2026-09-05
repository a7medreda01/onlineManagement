import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Title, Meta, DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { StorefrontService } from '../../services/storefront.service';
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
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  }

  getVideoSafeUrl(url?: string): SafeResourceUrl {
    if (!url) return '';
    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
      embedUrl = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
      embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
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
  }

  loadLandingPage(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storefrontService.getPublicLandingPage(this.subdomain, this.slug).subscribe({
      next: (page) => {
        this.pageData.set(page);

        // Dynamically update document title and meta tags with product branding
        const productTitle = page.title || 'عرض خاص';
        const productDesc = page.headline || page.subheadline || `عرض خاص وتخفيض لفترة محدودة على ${productTitle}. اطلب الآن والدفع عند الاستلام.`;
        const storeName = page.storeDisplayName || page.storeSubdomain || '';
        this.titleService.setTitle(storeName ? `${productTitle} | ${storeName}` : productTitle);
        this.metaService.updateTag({ name: 'description', content: productDesc });
        this.metaService.updateTag({ property: 'og:title', content: productTitle });
        this.metaService.updateTag({ property: 'og:description', content: productDesc });

        // Parse theme
        try {
          this.theme = JSON.parse(page.themeConfigJson || '{}');
          if (!this.theme.primaryColor) this.theme.primaryColor = '#0284c7';
          if (!this.theme.accentColor) this.theme.accentColor = '#f59e0b';
        } catch {
          this.theme = { primaryColor: '#0284c7', accentColor: '#f59e0b' };
        }

        // Parse and normalize content
        try {
          const raw = JSON.parse(page.contentJson || '{}');

          let features = raw.features || raw.benefits || [];
          if (!Array.isArray(features) || features.length === 0) {
            features = [
              { title: 'خامات أصلية وتصنيع فائق الجودة', description: `تم تصنيع ${page.title} بأعلى المعايير لتحمل الاستخدام اليومي الشاق وتقديم كفاءة استثنائية.`, icon: 'bi-shield-check' },
              { title: 'أداء عالي وسرعة استجابة', description: 'تقنيات حديثة مصممة لتوفير وقتك ومجهودك وتمنحك أفضل تجربة استخدام.', icon: 'bi-lightning-charge-fill' },
              { title: 'ضمان ذهبي للاستبدال والمعاينة', description: 'حق فحص ومعاينة المنتج بالكامل مع المندوب قبل دفع أي مليم للتأكد من سلامته.', icon: 'bi-patch-check-fill' },
              { title: 'أفضل قيمة حقيقية مقابل السعر', description: 'سعر اقتصادي استثنائي ومباشر من المورد دون أي وسيط أو تكاليف إضافية.', icon: 'bi-tag-fill' }
            ];
          }

          let whyChooseUs = raw.whyChooseUs || raw.painPoints || [];
          if (!Array.isArray(whyChooseUs) || whyChooseUs.length === 0) {
            whyChooseUs = [
              { title: 'تجنب المنتجات الرديئة والمقلدة', text: 'نوفر لك النسخة الأصلية 100% مع ضمان حقيقي واسترجاع مجاني.', problem: 'الخوف من شراء منتج مخالف للصور والوصف؟', solution: 'نضمن تطابق المنتج بنسبة 100% مع صور الإعلان والمعاينة قبل الدفع.' },
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
              { name: 'منى عبد العزيز', city: 'الجيزة', rating: 5, comment: 'وصلني في أقل من 24 ساعة، والمندوب كان محترم وانتظرني لحد ما عاينت المنتج. خدمة 10 على 10.' },
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
              { question: 'هل يمكنني معاينة المنتج قبل الاستلام والدفع؟', answer: 'بالتأكيد! يمكنك فتح الشحنة ومعاينة المنتج والتأكد التام منه قبل دفع أي مبلغ للمندوب.' },
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

          // Parse Visual Specs Callouts (Image 2 style)
          let parsedSpecs: any[] = [];
          try {
            parsedSpecs = JSON.parse(page.specsJson || '[]');
          } catch {}
          if (!Array.isArray(parsedSpecs) || parsedSpecs.length === 0) {
            parsedSpecs = raw.specs || [];
          }
          if (!Array.isArray(parsedSpecs) || parsedSpecs.length === 0) {
            parsedSpecs = [
              { title: 'خامات ومواد أصلية فاخرة', description: 'مقاومة للصدمات والخدوش وعوامل الاستخدام', badge: 'Top Notch' },
              { title: 'مقاومة الماء والغبار', description: 'معايير تصنيع موثوقة لحماية فائقة', badge: 'Water-Resistant' },
              { title: 'ضمان معتمد واستبدال فوري', description: 'معاينة وفحص مجاني قبل دفع الحساب', badge: '2 Years Warranty' }
            ];
          }
          this.specs.set(parsedSpecs);

          // Parse Variants / Colors (Image 1 style)
          let parsedVariants: any[] = [];
          try {
            parsedVariants = JSON.parse(page.variantOptionsJson || '[]');
          } catch {}
          if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
            parsedVariants = raw.variantOptions || [];
          }
          this.variantOptions.set(parsedVariants);
          if (parsedVariants.length > 0) {
            this.selectedVariant.set(parsedVariants[0].name);
          }

          // Parse Circular Feature Nodes (Image 1 style)
          let circular = raw.circularFeatures || [];
          if (!Array.isArray(circular) || circular.length === 0) {
            circular = [
              { title: 'إصدار وتوافق', spec: 'أداء فائق', icon: 'bi-cpu-fill' },
              { title: 'عمر البطارية', spec: 'تدوم طويلاً', icon: 'bi-battery-charging' },
              { title: 'اتصال ومكالمات', spec: 'استجابة سريعة', icon: 'bi-lightning-charge-fill' },
              { title: 'إعدادات متقدمة', spec: 'تخصيص كامل', icon: 'bi-gear-wide-connected' },
              { title: 'مشغل صوتيات', spec: 'صوت نقي', icon: 'bi-music-note-beamed' },
              { title: 'إشعارات وتطبيقات', spec: 'تنبيهات فورية', icon: 'bi-chat-dots-fill' }
            ];
          }
          this.circularFeatures.set(circular);

          // Conditional Size Selection (only if product has sizes e.g. shoes, clothes)
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

        // Parse images
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

        this.injectPixels(page.storeFacebookPixelId, page.storeTikTokPixelId);

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.Message || 'عذراً، صفحة الهبوط المطلوبة غير موجودة أو تم إيقاف نشرها.');
      }
    });
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

  changeQuantity(delta: number): void {
    const newQty = this.orderForm.quantity + delta;
    if (newQty >= 1 && newQty <= 20) {
      this.orderForm.quantity = newQty;
    }
  }

  scrollToOrderForm(): void {
    const element = document.getElementById('orderSection');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  get shippingCost(): number {
    const p = this.pageData();
    if (!p || p.isFreeShipping) return 0;
    return p.customShippingCost ?? 40;
  }

  get totalAmount(): number {
    const p = this.pageData();
    if (!p) return 0;
    return (p.sellingPrice * this.orderForm.quantity) + this.shippingCost;
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

    this.submitting.set(true);
    this.storefrontService.submitPublicOrder(this.subdomain, this.slug, this.orderForm).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.orderSuccessData.set(res);

        // Track purchase event if pixel exists
        if ((window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            value: res.totalAmount,
            currency: 'EGP'
          });
        }

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
