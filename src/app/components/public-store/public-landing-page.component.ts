import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
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

  subdomain = '';
  slug = '';

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

        // Parse theme
        try {
          this.theme = JSON.parse(page.themeConfigJson || '{}');
          if (!this.theme.primaryColor) this.theme.primaryColor = '#0284c7';
          if (!this.theme.accentColor) this.theme.accentColor = '#f59e0b';
        } catch {
          this.theme = { primaryColor: '#0284c7', accentColor: '#f59e0b' };
        }

        // Parse content
        try {
          this.content = JSON.parse(page.contentJson || '{}');
        } catch {
          this.content = {};
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
          this.selectedImage = 'https://placehold.co/600x500/f1f5f9/475569?text=' + encodeURIComponent(page.title);
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
