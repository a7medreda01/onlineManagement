import { Injectable } from '@angular/core';

export interface TrackingConfig {
  facebookPixelId?: string;
  tiktokPixelId?: string;
  snapchatPixelId?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PixelTrackingService {
  private initializedPixels = new Set<string>();

  /**
   * Initializes enabled tracking pixels for the current page/store.
   */
  initialize(config: TrackingConfig): void {
    if (typeof window === 'undefined') return;

    // 1. Meta / Facebook Pixel
    if (config.facebookPixelId?.trim() && !this.initializedPixels.has('fb_' + config.facebookPixelId)) {
      this.initFacebookPixel(config.facebookPixelId.trim());
      this.initializedPixels.add('fb_' + config.facebookPixelId);
    }

    // 2. TikTok Pixel
    if (config.tiktokPixelId?.trim() && !this.initializedPixels.has('tt_' + config.tiktokPixelId)) {
      this.initTikTokPixel(config.tiktokPixelId.trim());
      this.initializedPixels.add('tt_' + config.tiktokPixelId);
    }

    // 3. Snapchat Pixel
    if (config.snapchatPixelId?.trim() && !this.initializedPixels.has('snap_' + config.snapchatPixelId)) {
      this.initSnapchatPixel(config.snapchatPixelId.trim());
      this.initializedPixels.add('snap_' + config.snapchatPixelId);
    }

    // 4. Google Analytics / Google Tag Manager
    if (config.googleAnalyticsId?.trim() && !this.initializedPixels.has('ga_' + config.googleAnalyticsId)) {
      this.initGoogleAnalytics(config.googleAnalyticsId.trim());
      this.initializedPixels.add('ga_' + config.googleAnalyticsId);
    }

    if (config.googleTagManagerId?.trim() && !this.initializedPixels.has('gtm_' + config.googleTagManagerId)) {
      this.initGoogleTagManager(config.googleTagManagerId.trim());
      this.initializedPixels.add('gtm_' + config.googleTagManagerId);
    }
  }

  // ==========================================
  // E-Commerce Tracking Events
  // ==========================================

  trackPageView(pageTitle?: string): void {
    const win = window as any;
    try {
      if (win.fbq) win.fbq('track', 'PageView');
      if (win.ttq) win.ttq.page();
      if (win.snaptr) win.snaptr('track', 'PAGE_VIEW');
      if (win.gtag) win.gtag('event', 'page_view', { page_title: pageTitle });
    } catch (e) {
      console.warn('Pixel trackPageView error:', e);
    }
  }

  trackViewContent(data: { id?: string; name: string; category?: string; price: number; currency?: string }): void {
    const win = window as any;
    const currency = data.currency || 'EGP';
    try {
      // Facebook
      if (win.fbq) {
        win.fbq('track', 'ViewContent', {
          content_name: data.name,
          content_ids: data.id ? [data.id] : [],
          content_type: 'product',
          value: data.price,
          currency: currency
        });
      }

      // TikTok
      if (win.ttq) {
        win.ttq.track('ViewContent', {
          contents: [{
            content_id: data.id || data.name,
            content_name: data.name,
            content_category: data.category || 'عام',
            price: data.price
          }],
          value: data.price,
          currency: currency
        });
      }

      // Snapchat
      if (win.snaptr) {
        win.snaptr('track', 'VIEW_CONTENT', {
          item_ids: data.id ? [data.id] : [data.name],
          item_category: data.category || 'عام',
          price: data.price,
          currency: currency
        });
      }

      // Google Analytics (GA4)
      if (win.gtag) {
        win.gtag('event', 'view_item', {
          currency: currency,
          value: data.price,
          items: [{
            item_id: data.id || data.name,
            item_name: data.name,
            item_category: data.category || 'عام',
            price: data.price
          }]
        });
      }
    } catch (e) {
      console.warn('Pixel trackViewContent error:', e);
    }
  }

  trackInitiateCheckout(data: { id?: string; name: string; quantity: number; totalAmount: number; currency?: string }): void {
    const win = window as any;
    const currency = data.currency || 'EGP';
    try {
      // Facebook
      if (win.fbq) {
        win.fbq('track', 'InitiateCheckout', {
          content_name: data.name,
          num_items: data.quantity,
          value: data.totalAmount,
          currency: currency
        });
      }

      // TikTok
      if (win.ttq) {
        win.ttq.track('InitiateCheckout', {
          value: data.totalAmount,
          currency: currency
        });
      }

      // Snapchat
      if (win.snaptr) {
        win.snaptr('track', 'START_CHECKOUT', {
          number_items: data.quantity,
          price: data.totalAmount,
          currency: currency
        });
      }

      // Google Analytics (GA4)
      if (win.gtag) {
        win.gtag('event', 'begin_checkout', {
          currency: currency,
          value: data.totalAmount,
          items: [{
            item_name: data.name,
            quantity: data.quantity
          }]
        });
      }
    } catch (e) {
      console.warn('Pixel trackInitiateCheckout error:', e);
    }
  }

  trackPurchase(data: { orderNumber: string; totalAmount: number; currency?: string; productName?: string; quantity?: number }): void {
    const win = window as any;
    const currency = data.currency || 'EGP';
    try {
      // Facebook Purchase
      if (win.fbq) {
        win.fbq('track', 'Purchase', {
          value: data.totalAmount,
          currency: currency,
          content_type: 'product',
          order_id: data.orderNumber
        });
      }

      // TikTok Purchase
      if (win.ttq) {
        win.ttq.track('CompletePayment', {
          contents: [{
            content_name: data.productName || 'طلب منتج',
            quantity: data.quantity || 1,
            price: data.totalAmount
          }],
          value: data.totalAmount,
          currency: currency
        });
      }

      // Snapchat Purchase
      if (win.snaptr) {
        win.snaptr('track', 'PURCHASE', {
          price: data.totalAmount,
          currency: currency,
          transaction_id: data.orderNumber
        });
      }

      // Google Analytics (GA4) Purchase
      if (win.gtag) {
        win.gtag('event', 'purchase', {
          transaction_id: data.orderNumber,
          value: data.totalAmount,
          currency: currency,
          items: [{
            item_name: data.productName || 'طلب منتج',
            quantity: data.quantity || 1,
            price: data.totalAmount
          }]
        });
      }
    } catch (e) {
      console.warn('Pixel trackPurchase error:', e);
    }
  }

  // ==========================================
  // Pixel Script Injections
  // ==========================================

  private initFacebookPixel(pixelId: string): void {
    const win = window as any;
    if (win.fbq) {
      win.fbq('init', pixelId);
      win.fbq('track', 'PageView');
      return;
    }

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
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  private initTikTokPixel(pixelId: string): void {
    const win = window as any;
    if (win.ttq) {
      win.ttq.load(pixelId);
      win.ttq.page();
      return;
    }

    const script = document.createElement('script');
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }

  private initSnapchatPixel(pixelId: string): void {
    const win = window as any;
    if (win.snaptr) {
      win.snaptr('init', pixelId);
      win.snaptr('track', 'PAGE_VIEW');
      return;
    }

    const script = document.createElement('script');
    script.innerHTML = `
      (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
      {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
      r.src=n;var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);})(window,document,
      'https://sc-static.net/scevent.min.js');
      snaptr('init', '${pixelId}');
      snaptr('track', 'PAGE_VIEW');
    `;
    document.head.appendChild(script);
  }

  private initGoogleAnalytics(measurementId: string): void {
    const win = window as any;
    if (win.gtag) {
      win.gtag('config', measurementId);
      return;
    }

    const scriptAsync = document.createElement('script');
    scriptAsync.async = true;
    scriptAsync.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(scriptAsync);

    const scriptInit = document.createElement('script');
    scriptInit.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(scriptInit);
  }

  private initGoogleTagManager(gtmId: string): void {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);
  }
}
