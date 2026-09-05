import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { StorefrontService } from '../../services/storefront.service';
import { StorefrontSettings, ProductLandingPage } from '../../models/models';
import { getSubdomain } from '../../utils/subdomain.util';

@Component({
  selector: 'app-public-store',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './public-store.component.html',
  styleUrls: ['./public-store.component.css']
})
export class PublicStoreComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storefrontService = inject(StorefrontService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  subdomain = '';
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  settings = signal<StorefrontSettings | null>(null);
  pages = signal<ProductLandingPage[]>([]);
  searchTerm = '';
  activeFilter = signal<'all' | 'deals' | 'free_shipping'>('all');
  sortBy = signal<'default' | 'price_asc' | 'price_desc' | 'discount'>('default');
  viewMode = signal<'grid' | 'compact'>('grid');

  // Quick View Modal
  quickViewProduct = signal<ProductLandingPage | null>(null);
  quickViewActiveImageIndex = signal<number>(0);

  // FAQ state
  activeFaqIndex = signal<number | null>(null);

  currentYear = new Date().getFullYear();

  // Testimonials / Social Proof
  storeReviews = [
    { name: 'أحمد محمود', city: 'القاهرة', rating: 5, comment: 'تجربة ممتازة وسريعة جداً. عاينت المنتج مع مندوب الشحن وتأكدت من الجودة قبل ما أدفع قرش واحد!', verified: true, date: 'منذ يومين' },
    { name: 'سارة إبراهيم', city: 'الإسكندرية', rating: 5, comment: 'خامة المنتج رائعة ومطابقة للصور بالظبط، والتغليف راقي وفخم. هتعامل معاكم دايماً بإذن الله.', verified: true, date: 'منذ 4 أيام' },
    { name: 'طارق عبد الله', city: 'الجيزة', rating: 5, comment: 'خدمة العملاء في قمة الذوق وسرعة الرد على الواتساب. التوصيل تم في أقل من 48 ساعة.', verified: true, date: 'منذ أسبوع' }
  ];

  // Store FAQs
  storeFaqs = [
    { question: 'هل يمكنني معاينة وفحص المنتج قبل الدفع؟', answer: 'نعم بكل تأكيد! يحق لك فتح الشحنة وفحص المنتج والتأكد من مطابقته للمواصفات أمام مندوب التوصيل قبل دفع أي مبلغ.' },
    { question: 'ما هي مدة التوصيل لكافة المحافظات؟', answer: 'يتم تسليم الطلبات داخل القاهرة والجيزة والإسكندرية خلال 24 إلى 48 ساعة، وخلال 2 إلى 3 أيام عمل لباقي محافظات الجمهورية عبر شركات شحن موثوقة (بوسطة).' },
    { question: 'كيف يمكنني تأكيد طلبي أو الاستفسار؟', answer: 'يمكنك اختيار المنتج والضغط على "طلب سريع" وملء بياناتك مباشرة، أو الضغط على زر "طلب عبر واتساب" للتواصل الفوري مع خدمة العملاء.' },
    { question: 'ما هي سياسة الاستبدال والاسترجاع؟', answer: 'نضمن لك استبدال أو استرجاع سهل وسريع خلال 14 يوماً من استلام الشحنة في حالة وجود أي عيب مصنعي أو رغبة في استبدال المقاس/اللون.' }
  ];

  get storeFeatures(): Array<{ title: string; description: string; icon: string }> {
    try {
      const raw = this.settings()?.featuresJson;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { title: 'معاينة قبل الدفع', description: 'افحص المنتج بنفسك وتأكد من جودته أمام مندوب الشحن قبل سداد أي مليم.', icon: 'bi-eye' },
      { title: 'دفع عند الاستلام', description: 'لا تدفع أي مبلغ مسبقاً — الدفع نقداً عند استلام شحنتك بيدك.', icon: 'bi-cash-stack' },
      { title: 'شحن سريع ومجاني', description: 'شحن فوري ومتابعة خطوة بخطوة حتى باب البيت.', icon: 'bi-truck' },
      { title: 'ضمان ذهبي 14 يوم', description: 'حق الاستبدال أو الاسترجاع الفوري في حال وجود أي ملاحظة.', icon: 'bi-shield-check' }
    ];
  }

  get storeStats(): Array<{ label: string; value: string }> {
    try {
      const raw = this.settings()?.statsJson;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { label: 'منتج متوفر', value: `${this.pages().length}+` },
      { label: 'تقييم موثق', value: '4.9 ★' },
      { label: 'دفع باستلام', value: 'COD' },
      { label: 'معاينة وفحص', value: '100%' }
    ];
  }

  resolveUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.subdomain = params['subdomain'] || getSubdomain() || '';
      if (this.subdomain) {
        this.loadStore();
      }
    });
  }

  loadStore(): void {
    this.loading.set(true);
    this.error.set(null);

    this.storefrontService.getPublicStore(this.subdomain).subscribe({
      next: (settings) => {
        this.settings.set(settings);

        const storeName = settings?.storeDisplayName || 'المتجر الإلكتروني';
        const bio = settings?.bio || `أهلاً بكم في ${storeName}. تسوق أفضل المنتجات بأعلى جودة وضمان.`;
        this.titleService.setTitle(storeName);
        this.metaService.updateTag({ name: 'description', content: bio });
        this.metaService.updateTag({ property: 'og:title', content: storeName });
        this.metaService.updateTag({ property: 'og:description', content: bio });
        if (settings?.logoUrl) {
          this.metaService.updateTag({ property: 'og:image', content: settings.logoUrl });
        }

        this.storefrontService.getPublicStorePages(this.subdomain).subscribe({
          next: (pages) => {
            this.pages.set(pages || []);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.Message || 'عذراً، هذا المتجر غير موجود أو تم إيقافه.');
      }
    });
  }

  getProductRoute(slug: string): any[] {
    if (getSubdomain()) {
      return ['/', slug];
    }
    return ['/store', this.subdomain, slug];
  }

  get filteredPages(): ProductLandingPage[] {
    let result = [...this.pages()];

    // 1. Search Query Filter
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.headline && p.headline.toLowerCase().includes(q))
      );
    }

    // 2. Tab Filter
    if (this.activeFilter() === 'deals') {
      result = result.filter(p => p.originalPrice && p.originalPrice > p.sellingPrice);
    } else if (this.activeFilter() === 'free_shipping') {
      result = result.filter(p => p.isFreeShipping);
    }

    // 3. Sorting
    if (this.sortBy() === 'price_asc') {
      result.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (this.sortBy() === 'price_desc') {
      result.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (this.sortBy() === 'discount') {
      result.sort((a, b) => {
        const discA = a.originalPrice && a.originalPrice > a.sellingPrice ? (a.originalPrice - a.sellingPrice) / a.originalPrice : 0;
        const discB = b.originalPrice && b.originalPrice > b.sellingPrice ? (b.originalPrice - b.sellingPrice) / b.originalPrice : 0;
        return discB - discA;
      });
    }

    return result;
  }

  get dealsCount(): number {
    return this.pages().filter(p => p.originalPrice && p.originalPrice > p.sellingPrice).length;
  }

  get freeShippingCount(): number {
    return this.pages().filter(p => p.isFreeShipping).length;
  }

  parseImages(json: string): string[] {
    try {
      const parsed = JSON.parse(json || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getDiscountPercentage(original?: number, selling?: number): number {
    if (!original || !selling || original <= selling) return 0;
    return Math.round(((original - selling) / original) * 100);
  }

  getSavedAmount(original?: number, selling?: number): number {
    if (!original || !selling || original <= selling) return 0;
    return Math.round(original - selling);
  }

  // Quick View
  openQuickView(product: ProductLandingPage, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.quickViewProduct.set(product);
    this.quickViewActiveImageIndex.set(0);
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.quickViewProduct.set(null);
    document.body.style.overflow = '';
  }

  getQuickViewImages(): string[] {
    const p = this.quickViewProduct();
    if (!p) return [];
    return this.parseImages(p.mediaUrlsJson);
  }

  selectQuickViewImage(index: number): void {
    this.quickViewActiveImageIndex.set(index);
  }

  toggleFaq(index: number): void {
    if (this.activeFaqIndex() === index) {
      this.activeFaqIndex.set(null);
    } else {
      this.activeFaqIndex.set(index);
    }
  }

  getWhatsAppStoreUrl(productTitle?: string): string {
    const phone = this.settings()?.whatsAppNumber || this.settings()?.contactPhone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const storeName = this.settings()?.storeDisplayName || 'المتجر';
    let text = `مرحباً، أود الاستفسار عن منتجات متجر ${storeName}`;
    if (productTitle) {
      text = `مرحباً، أود الاستفسار وطلب منتج: *${productTitle}* من متجر ${storeName}`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
