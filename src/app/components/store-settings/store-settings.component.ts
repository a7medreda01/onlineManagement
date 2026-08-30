import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../services/notification.service';
import { SalesPlatform } from '../../models/models';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './store-settings.component.html'
})
export class StoreSettingsComponent implements OnInit {
  activeTab: 'platforms' | 'shipping' = 'platforms';
  platforms = signal<SalesPlatform[]>([]);
  loading = signal<boolean>(true);

  // New Platform State
  showAddPlatformModal = false;
  newPlatformName = '';
  savingPlatform = false;

  constructor(
    private orderService: OrderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPlatforms();
  }

  loadPlatforms(): void {
    this.loading.set(true);
    this.orderService.getSalesPlatforms().subscribe({
      next: (res: SalesPlatform[]) => {
        this.platforms.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('فشل تحميل قائمة منصات البيع');
      }
    });
  }

  openAddModal(): void {
    this.newPlatformName = '';
    this.showAddPlatformModal = true;
  }

  closeAddModal(): void {
    this.showAddPlatformModal = false;
  }

  savePlatform(): void {
    if (!this.newPlatformName.trim()) {
      this.notificationService.error('يرجى كتابة اسم منصة البيع');
      return;
    }

    this.savingPlatform = true;
    this.orderService.createSalesPlatform({ name: this.newPlatformName.trim() }).subscribe({
      next: (created) => {
        this.savingPlatform = false;
        this.showAddPlatformModal = false;
        this.notificationService.success(`تمت إضافة منصة "${created.name}" بنجاح!`);
        this.loadPlatforms();
      },
      error: (err) => {
        this.savingPlatform = false;
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء إضافة منصة البيع');
      }
    });
  }

  deletePlatform(platform: SalesPlatform): void {
    if (!confirm(`هل أنت أثق من حذف منصة البيع "${platform.name}"؟`)) return;

    this.orderService.deleteSalesPlatform(platform.id).subscribe({
      next: () => {
        this.notificationService.success(`تم حذف منصة "${platform.name}" بنجاح`);
        this.loadPlatforms();
      },
      error: (err) => {
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء حذف المنصة');
      }
    });
  }

  getPlatformIcon(name: string): string {
    const lower = (name || '').toLowerCase();
    if (lower.includes('facebook') || lower.includes('فيسبوك')) return 'fa-brands fa-facebook text-blue-500';
    if (lower.includes('instagram') || lower.includes('انستجرام')) return 'fa-brands fa-instagram text-pink-500';
    if (lower.includes('whatsapp') || lower.includes('واتساب')) return 'fa-brands fa-whatsapp text-emerald-500';
    if (lower.includes('tiktok') || lower.includes('تيك توك')) return 'fa-brands fa-tiktok text-slate-100';
    if (lower.includes('website') || lower.includes('موقع')) return 'fa-solid fa-globe text-sky-400';
    if (lower.includes('snap') || lower.includes('سناب')) return 'fa-brands fa-snapchat text-amber-400';
    return 'fa-solid fa-store text-indigo-400';
  }
}
