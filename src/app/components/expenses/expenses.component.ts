import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { NotificationService } from '../../services/notification.service';
import { Expense, ExpenseCategory, CreateExpenseDto, ExpenseSummary } from '../../models/models';

import { CustomDatePickerComponent } from '../shared/custom-date-picker/custom-date-picker.component';
import { CustomDropdownComponent } from '../shared/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomDatePickerComponent, CustomDropdownComponent],
  templateUrl: './expenses.component.html'
})
export class ExpensesComponent implements OnInit {
  ExpenseCategory = ExpenseCategory;

  expenses = signal<Expense[]>([]);
  summary = signal<ExpenseSummary | null>(null);
  loading = signal<boolean>(false);

  filterCategory: string = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  isModalOpen = false;
  isEditMode = false;
  editingId: number | null = null;
  saving = false;

  formData = {
    title: '',
    category: ExpenseCategory.Ads,
    amount: 0,
    expenseDate: new Date().toISOString().substring(0, 10),
    notes: ''
  };

  constructor(
    private expenseService: ExpenseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
    this.loadSummary();
  }

  loadExpenses(): void {
    this.loading.set(true);
    this.expenseService.getAll(this.filterCategory, this.filterStartDate, this.filterEndDate, 1, 100).subscribe({
      next: (res) => {
        this.expenses.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadSummary(): void {
    this.expenseService.getSummary(this.filterStartDate, this.filterEndDate).subscribe({
      next: (res) => this.summary.set(res)
    });
  }

  resetFilters(): void {
    this.filterCategory = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.loadExpenses();
    this.loadSummary();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.formData = {
      title: '',
      category: ExpenseCategory.Ads,
      amount: 0,
      expenseDate: new Date().toISOString().substring(0, 10),
      notes: ''
    };
    this.isModalOpen = true;
  }

  openEditModal(item: Expense): void {
    this.isEditMode = true;
    this.editingId = item.id;
    this.formData = {
      title: item.title,
      category: item.category,
      amount: item.amount,
      expenseDate: item.expenseDate ? item.expenseDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
      notes: item.notes || ''
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveExpense(): void {
    if (!this.formData.title || this.formData.amount <= 0) {
      this.notificationService.error('يرجى إدخال بيان المصروف والمبلغ بشكل صحيح');
      return;
    }

    this.saving = true;

    if (this.isEditMode && this.editingId) {
      this.expenseService.update(this.editingId, {
        id: this.editingId,
        title: this.formData.title,
        category: this.formData.category,
        amount: this.formData.amount,
        expenseDate: this.formData.expenseDate,
        notes: this.formData.notes
      }).subscribe({
        next: () => {
          this.notificationService.success('تم تعديل المصروف بنجاح');
          this.saving = false;
          this.closeModal();
          this.loadExpenses();
          this.loadSummary();
        },
        error: (err) => {
          this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء التعديل');
          this.saving = false;
        }
      });
    } else {
      this.expenseService.create({
        title: this.formData.title,
        category: this.formData.category,
        amount: this.formData.amount,
        expenseDate: this.formData.expenseDate,
        notes: this.formData.notes
      }).subscribe({
        next: () => {
          this.notificationService.success('تمت إضافة المصروف بنجاح');
          this.saving = false;
          this.closeModal();
          this.loadExpenses();
          this.loadSummary();
        },
        error: (err) => {
          this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء الإضافة');
          this.saving = false;
        }
      });
    }
  }

  async deleteExpense(item: Expense): Promise<void> {
    const confirmed = await this.notificationService.confirm(`هل أنت تأكد من حذف المصروف '${item.title}' بقيمة ${item.amount} ج.م؟`, 'تأكيد الحذف');
    if (confirmed) {
      this.expenseService.delete(item.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف المصروف بنجاح');
          this.loadExpenses();
          this.loadSummary();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'حدث خطأ أثناء الحذف')
      });
    }
  }

  getCategoryBadgeClass(category: ExpenseCategory): string {
    switch (category) {
      case ExpenseCategory.Ads: return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case ExpenseCategory.Salaries: return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case ExpenseCategory.Products: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case ExpenseCategory.ShippingReturns: return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case ExpenseCategory.Operations: return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default: return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  }
}
