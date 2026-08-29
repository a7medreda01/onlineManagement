import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../../services/purchase.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseInvoice, Supplier } from '../../../models/models';

@Component({
  selector: 'app-purchase-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './purchase-invoices.component.html'
})
export class PurchaseInvoicesComponent implements OnInit {
  invoices = signal<PurchaseInvoice[]>([]);
  suppliers = signal<Supplier[]>([]);
  loading = signal<boolean>(true);

  // Filters & Pagination
  searchTerm = '';
  selectedSupplierId: number | null = null;
  filterFromDate = '';
  filterToDate = '';
  filterIsPaid: boolean | null = null;

  pageNumber = signal<number>(1);
  pageSize: number = 10;
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  hasPreviousPage = signal<boolean>(false);
  hasNextPage = signal<boolean>(false);

  // View modal
  selectedInvoice: PurchaseInvoice | null = null;
  showViewModal = false;

  constructor(
    private purchaseService: PurchaseService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadInvoices();
  }

  loadSuppliers(): void {
    this.purchaseService.getSuppliersList().subscribe({
      next: (res) => this.suppliers.set(res),
      error: (err) => console.error(err)
    });
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.purchaseService.getPurchaseInvoices(
      this.searchTerm,
      this.selectedSupplierId || undefined,
      this.filterFromDate || undefined,
      this.filterToDate || undefined,
      this.filterIsPaid,
      this.pageNumber(),
      this.pageSize
    ).subscribe({
      next: (res) => {
        this.invoices.set(res.items || []);
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

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadInvoices();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedSupplierId = null;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterIsPaid = null;
    this.pageNumber.set(1);
    this.loadInvoices();
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.pageNumber.update(p => p + 1);
      this.loadInvoices();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageNumber.update(p => p - 1);
      this.loadInvoices();
    }
  }

  openViewModal(inv: PurchaseInvoice): void {
    this.selectedInvoice = inv;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedInvoice = null;
  }

  deleteInvoice(inv: PurchaseInvoice): void {
    if (confirm(`هل أنت تأكد من حذف فاتورة المشتريات رقم ${inv.invoiceNumber}؟ سيمحى أيضاً المصروف المرتبط بها.`)) {
      this.purchaseService.deletePurchaseInvoice(inv.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف فاتورة المشتريات وإلغاء المصروف بنجاح');
          this.loadInvoices();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في الحذف')
      });
    }
  }
}
