import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../../services/purchase.service';
import { NotificationService } from '../../../services/notification.service';
import { Supplier } from '../../../models/models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html'
})
export class SuppliersComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal<boolean>(true);

  searchTerm = '';
  pageNumber = signal<number>(1);
  pageSize: number = 10;
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  hasPreviousPage = signal<boolean>(false);
  hasNextPage = signal<boolean>(false);

  showModal = false;
  isEditMode = false;
  currentSupplier: any = {};

  constructor(
    private purchaseService: PurchaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.purchaseService.getSuppliers(this.searchTerm, this.pageNumber(), this.pageSize).subscribe({
      next: (res) => {
        this.suppliers.set(res.items || []);
        this.totalCount.set(res.totalCount || 0);
        this.totalPages.set(res.totalPages || 1);
        this.hasPreviousPage.set(res.hasPreviousPage || false);
        this.hasNextPage.set(res.hasNextPage || false);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(): void {
    this.pageNumber.set(1);
    this.loadSuppliers();
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.pageNumber.update(p => p + 1);
      this.loadSuppliers();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageNumber.update(p => p - 1);
      this.loadSuppliers();
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentSupplier = {};
    this.showModal = true;
  }

  openEditModal(sup: Supplier): void {
    this.isEditMode = true;
    this.currentSupplier = { ...sup };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveSupplier(): void {
    if (!this.currentSupplier.name || !this.currentSupplier.phone) {
      this.notificationService.error('اسم المورد ورقم الهاتف الحقول مطلوبة');
      return;
    }

    if (this.isEditMode) {
      this.purchaseService.updateSupplier(this.currentSupplier.id, this.currentSupplier).subscribe({
        next: () => {
          this.closeModal();
          this.notificationService.success('تم تعديل بيانات المورد بنجاح');
          this.loadSuppliers();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في التعديل')
      });
    } else {
      this.purchaseService.createSupplier(this.currentSupplier).subscribe({
        next: () => {
          this.closeModal();
          this.notificationService.success('تم إضافة المورد الجديد بنجاح');
          this.loadSuppliers();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في الإضافة')
      });
    }
  }

  deleteSupplier(sup: Supplier): void {
    if (confirm(`هل أنت تأكد من حذف المورد '${sup.name}'؟`)) {
      this.purchaseService.deleteSupplier(sup.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف المورد بنجاح');
          this.loadSuppliers();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في الحذف')
      });
    }
  }
}
