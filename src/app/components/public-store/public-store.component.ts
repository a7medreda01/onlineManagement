import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
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

  subdomain = '';
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  settings = signal<StorefrontSettings | null>(null);
  pages = signal<ProductLandingPage[]>([]);
  searchTerm = '';

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

  get filteredPages(): ProductLandingPage[] {
    if (!this.searchTerm.trim()) {
      return this.pages();
    }
    const q = this.searchTerm.toLowerCase();
    return this.pages().filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.headline && p.headline.toLowerCase().includes(q))
    );
  }

  parseImages(json: string): string[] {
    try {
      return JSON.parse(json || '[]');
    } catch {
      return [];
    }
  }
}
