import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../services/notification.service';
import { Product } from '../../models/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html'
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  loading = signal<boolean>(true);

  searchTerm = '';
  showLowStockOnly = false;

  showModal = false;
  isEditMode = false;
  currentProduct: any = {};

  showStockModal = false;
  selectedProductForStock: Product | null = null;
  stockChangeAmount = 0;
  stockChangeReason = '';

  constructor(
    private productService: ProductService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products.set(res);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    let list = this.products();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
    }
    if (this.showLowStockOnly) {
      list = list.filter(p => p.isLowStock);
    }
    this.filteredProducts.set(list);
  }

  toggleLowStockFilter(): void {
    this.showLowStockOnly = !this.showLowStockOnly;
    this.applyFilter();
  }

  uploadingImage = signal<boolean>(false);

  onProductImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingImage.set(true);
    this.productService.uploadImage(file).subscribe({
      next: (res) => {
        this.currentProduct.imageUrl = res.relativeUrl;
        this.uploadingImage.set(false);
        this.notificationService.success('تم رفع صورة المنتج بنجاح');
      },
      error: (err) => {
        this.uploadingImage.set(false);
        this.notificationService.error(err?.error?.Message || 'فشل رفع صورة المنتج');
      }
    });
  }

  removeProductImage(): void {
    this.currentProduct.imageUrl = '';
  }

  getImageUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentProduct = { stockQuantity: 0, lowStockThreshold: 10, wholesalePrice: 0, sellingPrice: 0 };
    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.isEditMode = true;
    this.currentProduct = { ...product };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveProduct(): void {
    if (this.isEditMode) {
      this.productService.update(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.closeModal();
          this.notificationService.success('تم تعديل بيانات المنتج بنجاح');
          this.loadProducts();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في التعديل')
      });
    } else {
      this.productService.create(this.currentProduct).subscribe({
        next: () => {
          this.closeModal();
          this.notificationService.success('تمت إضافة المنتج الجديد بنجاح');
          this.loadProducts();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في الإضافة')
      });
    }
  }

  openStockModal(product: Product): void {

    this.selectedProductForStock = product;
    this.stockChangeAmount = 0;
    this.stockChangeReason = 'تعديل يدوي للمخزون';
    this.showStockModal = true;
  }

  closeStockModal(): void {
    this.showStockModal = false;
    this.selectedProductForStock = null;
  }

  saveStockAdjustment(): void {
    if (!this.selectedProductForStock || this.stockChangeAmount === 0) return;

    this.productService.adjustStock(this.selectedProductForStock.id, this.stockChangeAmount, this.stockChangeReason).subscribe({
      next: () => {
        this.closeStockModal();
        this.notificationService.success('تم تعديل كمية المخزون بنجاح');
        this.loadProducts();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في التعديل')
    });
  }

  async deleteProduct(product: Product): Promise<void> {
    const confirmed = await this.notificationService.confirm(`هل أنت تأكد من حذف المنتج '${product.name}'؟`, 'تأكيد حذف المنتج');
    if (confirmed) {
      this.productService.delete(product.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف المنتج بنجاح');
          this.loadProducts();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ أثناء الحذف')
      });
    }
  }

  cleanDescription(desc?: string): string {
    if (!desc) return '';
    return desc.replace(/<[^>]*>/g, '').trim();
  }
}
