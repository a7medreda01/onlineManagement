import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { NotificationService } from '../../services/notification.service';
import { Customer, Governorate } from '../../models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit {
  customers = signal<Customer[]>([]);
  governorates = signal<Governorate[]>([]);
  loading = signal<boolean>(true);

  // Pagination & Filter state
  searchTerm = '';
  filterBlacklist: boolean | null = null;
  pageNumber = signal<number>(1);
  pageSize: number = 10;
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  hasPreviousPage = signal<boolean>(false);
  hasNextPage = signal<boolean>(false);

  showModal = false;
  isEditMode = false;
  currentCustomer: any = {};

  constructor(
    private customerService: CustomerService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
    this.customerService.getGovernorates().subscribe(res => this.governorates.set(res));
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerService.getAll(this.searchTerm, this.filterBlacklist, this.pageNumber(), this.pageSize).subscribe({
      next: (res) => {
        this.customers.set(res.items || []);
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
    this.loadCustomers();
  }

  onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadCustomers();
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.pageNumber.update(p => p + 1);
      this.loadCustomers();
    }
  }

  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.pageNumber.update(p => p - 1);
      this.loadCustomers();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageNumber.set(page);
      this.loadCustomers();
    }
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentCustomer = { governorateId: this.governorates()[0]?.id || 1 };
    this.showModal = true;
  }

  openEditModal(cust: Customer): void {
    this.isEditMode = true;
    this.currentCustomer = { ...cust };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCustomer(): void {
    if (this.isEditMode) {
      this.customerService.update(this.currentCustomer.id, this.currentCustomer).subscribe({
        next: () => {
          this.closeModal();
          this.notificationService.success('تم تعديل بيانات العميل بنجاح');
          this.loadCustomers();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في التعديل')
      });
    } else {
      this.customerService.create(this.currentCustomer).subscribe({
        next: () => {
          this.closeModal();
          this.notificationService.success('تمت إضافة العميل الجديد بنجاح');
          this.loadCustomers();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ في الإضافة')
      });
    }
  }

  toggleBlacklist(cust: Customer): void {
    this.customerService.toggleBlacklist(cust.id).subscribe({
      next: () => {
        this.notificationService.success(cust.isBlacklisted ? 'تم إلغاء حظر العميل' : 'تم إضافة العميل للقائمة السوداء');
        this.loadCustomers();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ')
    });
  }
}
