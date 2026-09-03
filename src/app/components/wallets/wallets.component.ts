import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet.service';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { PlanFeatureLockComponent } from '../shared/plan-feature-lock/plan-feature-lock.component';
import { UpgradeModalComponent } from '../shared/upgrade-modal/upgrade-modal.component';
import {
  Wallet,
  WalletSummaryDto,
  WalletTransaction,
  WalletType,
  WalletTransactionType,
  CreateWalletDto,
  UpdateWalletDto,
  RecordOrderDepositDto,
  TransferFundsDto,
  AdjustBalanceDto,
  Order
} from '../../models/models';

@Component({
  selector: 'app-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule, PlanFeatureLockComponent, UpgradeModalComponent],
  templateUrl: './wallets.component.html'
})
export class WalletsComponent implements OnInit {
  summary = signal<WalletSummaryDto | null>(null);
  wallets = signal<Wallet[]>([]);
  transactions = signal<WalletTransaction[]>([]);
  isUpgradeModalOpen = false;

  canAccessWallets(): boolean {
    return this.authService.canAccessWallets();
  }
  loading = signal<boolean>(true);
  loadingTx = signal<boolean>(false);

  // Filter states for transactions
  selectedWalletFilter: number | null = null;
  selectedTypeFilter: WalletTransactionType | null = null;
  filterFromDate: string = '';
  filterToDate: string = '';
  searchQuery: string = '';

  // Modals state
  showCreateWalletModal = false;
  showEditWalletModal = false;
  showDepositModal = false;
  showTransferModal = false;
  showAdjustModal = false;

  // Form Models
  newWallet: CreateWalletDto = {
    name: '',
    type: WalletType.VodafoneCash,
    accountNumber: '',
    initialBalance: 0,
    notes: ''
  };

  editWalletId: number | null = null;
  editWallet: UpdateWalletDto = {
    name: '',
    type: WalletType.CashDrawer,
    accountNumber: '',
    notes: '',
    isActive: true
  };

  // Deposit Form
  depositForm: RecordOrderDepositDto = {
    orderNumber: '',
    walletId: 0,
    amount: 0,
    referenceNumber: '',
    notes: ''
  };
  searchingOrder = false;
  foundOrder: Order | null = null;
  orderSearchError: string = '';

  // Transfer Form
  transferForm: TransferFundsDto = {
    fromWalletId: 0,
    toWalletId: 0,
    amount: 0,
    referenceNumber: '',
    notes: ''
  };

  // Adjust Form
  adjustForm: AdjustBalanceDto = {
    walletId: 0,
    type: WalletTransactionType.ManualDeposit,
    amount: 0,
    referenceNumber: '',
    notes: ''
  };

  submitting = false;

  WalletTypeEnum = WalletType;
  WalletTxTypeEnum = WalletTransactionType;

  constructor(
    private walletService: WalletService,
    private orderService: OrderService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.canAccessWallets()) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading.set(true);
    this.walletService.getSummary().subscribe({
      next: (res) => {
        this.summary.set(res);
        this.wallets.set(res.wallets);
        this.loading.set(false);
        this.loadTransactions();
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.notificationService.error('فشل تحميل بيانات الخزائن والمحافظ');
      }
    });
  }

  loadTransactions(): void {
    this.loadingTx.set(true);
    this.walletService.getTransactions(
      this.selectedWalletFilter || undefined,
      undefined,
      this.selectedTypeFilter || undefined,
      this.filterFromDate || undefined,
      this.filterToDate || undefined
    ).subscribe({
      next: (res) => {
        this.transactions.set(res);
        this.loadingTx.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loadingTx.set(false);
      }
    });
  }

  // --- Modal Openers ---

  openCreateWallet(): void {
    this.newWallet = {
      name: '',
      type: WalletType.VodafoneCash,
      accountNumber: '',
      initialBalance: 0,
      notes: ''
    };
    this.showCreateWalletModal = true;
  }

  openEditWallet(w: Wallet): void {
    this.editWalletId = w.id;
    this.editWallet = {
      name: w.name,
      type: w.type,
      accountNumber: w.accountNumber,
      notes: w.notes,
      isActive: w.isActive
    };
    this.showEditWalletModal = true;
  }

  openDepositModal(preselectedWalletId?: number): void {
    const activeWallets = this.wallets().filter(w => w.isActive);
    this.depositForm = {
      orderNumber: '',
      walletId: preselectedWalletId || (activeWallets.length > 0 ? activeWallets[0].id : 0),
      amount: null as any,
      referenceNumber: '',
      notes: ''
    };
    this.foundOrder = null;
    this.orderSearchError = '';
    this.showDepositModal = true;
  }

  openTransferModal(fromWalletId?: number): void {
    const activeWallets = this.wallets().filter(w => w.isActive);
    this.transferForm = {
      fromWalletId: fromWalletId || (activeWallets.length > 0 ? activeWallets[0].id : 0),
      toWalletId: activeWallets.length > 1 ? (activeWallets[0].id === fromWalletId ? activeWallets[1].id : activeWallets[0].id) : 0,
      amount: null as any,
      referenceNumber: '',
      notes: ''
    };
    this.showTransferModal = true;
  }

  openAdjustModal(walletId?: number): void {
    const activeWallets = this.wallets().filter(w => w.isActive);
    this.adjustForm = {
      walletId: walletId || (activeWallets.length > 0 ? activeWallets[0].id : 0),
      type: WalletTransactionType.ManualDeposit,
      amount: null as any,
      referenceNumber: '',
      notes: ''
    };
    this.showAdjustModal = true;
  }

  // --- Order Search for Deposit ---
  searchOrder(): void {
    if (!this.depositForm.orderNumber || !this.depositForm.orderNumber.trim()) {
      this.orderSearchError = 'يرجى إدخال رقم الأوردر للبحث';
      this.foundOrder = null;
      return;
    }

    this.searchingOrder = true;
    const term = this.depositForm.orderNumber ? this.depositForm.orderNumber.trim().replace('#', '') : '';

    this.orderService.getAll(undefined, undefined, undefined, undefined, 1, 10, term).subscribe({
      next: (res) => {
        this.searchingOrder = false;
        const match = res.items.find(o => 
          o.orderNumber.replace('#', '').trim() === term || 
          o.orderNumber.trim() === term || 
          o.orderNumber === `#${term}` ||
          o.id.toString() === term
        ) || (res.items.length > 0 ? res.items[0] : null);

        if (match) {
          this.orderService.getById(match.id).subscribe({
            next: (fullOrder) => {
              this.foundOrder = fullOrder;
              this.orderSearchError = '';
            }
          });
        } else {
          this.orderSearchError = `لم يتم العثور على أوردر برقم "${term}"`;
        }
      },
      error: (err) => {
        this.searchingOrder = false;
        this.orderSearchError = 'حدث خطأ أثناء البحث عن الأوردر';
      }
    });
  }

  // --- Form Submissions ---

  saveNewWallet(): void {
    if (!this.newWallet.name.trim()) {
      this.notificationService.error('يرجى كتابة اسم المحفظة / الخزينة');
      return;
    }

    this.submitting = true;
    this.walletService.create(this.newWallet).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateWalletModal = false;
        this.notificationService.success('تم إنشاء المحفظة بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err.error?.message || 'فشل إنشاء المحفظة');
      }
    });
  }

  saveEditWallet(): void {
    if (!this.editWalletId || !this.editWallet.name.trim()) {
      this.notificationService.error('يرجى كتابة اسم المحفظة / الخزينة');
      return;
    }

    this.submitting = true;
    this.walletService.update(this.editWalletId, this.editWallet).subscribe({
      next: () => {
        this.submitting = false;
        this.showEditWalletModal = false;
        this.notificationService.success('تم تعديل بيانات المحفظة بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err.error?.message || 'فشل تعديل المحفظة');
      }
    });
  }

  deleteWallet(w: Wallet): void {
    if (!confirm(`هل أنت متأكد من حذف محفظة "${w.name}"؟`)) return;

    this.walletService.delete(w.id).subscribe({
      next: () => {
        this.notificationService.success('تم حذف المحفظة بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'فشل حذف المحفظة');
      }
    });
  }

  submitDeposit(): void {
    const rawOrderNumber = this.depositForm.orderNumber ? this.depositForm.orderNumber.trim() : '';
    if (!this.foundOrder && !rawOrderNumber) {
      this.notificationService.error('يرجى تحديد أوردر لتسجيل العربون');
      return;
    }

    if (!this.depositForm.walletId) {
      this.notificationService.error('يرجى اختيار المحفظة المستلمة للعربون');
      return;
    }

    if (this.depositForm.amount <= 0) {
      this.notificationService.error('يرجى إدخال مبلغ عربون صحيح أكبر من صفر');
      return;
    }

    this.submitting = true;
    const payload: RecordOrderDepositDto = {
      orderId: this.foundOrder ? this.foundOrder.id : undefined,
      orderNumber: this.foundOrder ? this.foundOrder.orderNumber : rawOrderNumber,
      walletId: Number(this.depositForm.walletId),
      amount: Number(this.depositForm.amount),
      referenceNumber: this.depositForm.referenceNumber?.trim(),
      notes: this.depositForm.notes?.trim()
    };

    this.walletService.recordDeposit(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showDepositModal = false;
        this.notificationService.success(`تم استلام وتسجيل عربون بقيمة ${payload.amount} ج.م بنجاح وتحديث الأوردر والخزينة`);
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err.error?.message || 'فشل تسجيل العربون');
      }
    });
  }

  submitTransfer(): void {
    if (this.transferForm.fromWalletId === this.transferForm.toWalletId) {
      this.notificationService.error('لا يمكن التحويل لنفس المحفظة');
      return;
    }

    if (this.transferForm.amount <= 0) {
      this.notificationService.error('يرجى إدخال مبلغ تحويل أكبر من الصفر');
      return;
    }

    this.submitting = true;
    this.walletService.transfer({
      fromWalletId: Number(this.transferForm.fromWalletId),
      toWalletId: Number(this.transferForm.toWalletId),
      amount: Number(this.transferForm.amount),
      referenceNumber: this.transferForm.referenceNumber?.trim(),
      notes: this.transferForm.notes?.trim()
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showTransferModal = false;
        this.notificationService.success('تم تحويل المبلغ بنجاح بين الخزائن');
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err.error?.message || 'فشل التحويل');
      }
    });
  }

  submitAdjust(): void {
    if (this.adjustForm.amount <= 0) {
      this.notificationService.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    this.submitting = true;
    this.walletService.adjustBalance({
      walletId: Number(this.adjustForm.walletId),
      type: Number(this.adjustForm.type),
      amount: Number(this.adjustForm.amount),
      referenceNumber: this.adjustForm.referenceNumber?.trim(),
      notes: this.adjustForm.notes?.trim()
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.showAdjustModal = false;
        this.notificationService.success('تمت تسوية الرصيد بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err.error?.message || 'فشل تسوية الرصيد');
      }
    });
  }

  // --- Helpers ---
  getWalletGradient(type: WalletType): string {
    switch (type) {
      case WalletType.VodafoneCash:
        return 'from-rose-600/30 via-red-700/20 to-slate-900 border-red-500/40 text-red-400';
      case WalletType.InstaPay:
        return 'from-purple-600/30 via-indigo-700/20 to-slate-900 border-purple-500/40 text-purple-400';
      case WalletType.BankAccount:
        return 'from-sky-600/30 via-blue-700/20 to-slate-900 border-sky-500/40 text-sky-400';
      case WalletType.CashDrawer:
      default:
        return 'from-emerald-600/30 via-teal-700/20 to-slate-900 border-emerald-500/40 text-emerald-400';
    }
  }

  getWalletIcon(type: WalletType): string {
    switch (type) {
      case WalletType.VodafoneCash:
        return 'bi-phone';
      case WalletType.InstaPay:
        return 'bi-lightning-charge';
      case WalletType.BankAccount:
        return 'bi-bank';
      case WalletType.CashDrawer:
      default:
        return 'bi-cash-stack';
    }
  }

  getSelectedWalletBalance(walletId: number): number {
    const w = this.wallets().find(item => item.id === Number(walletId));
    return w ? w.balance : 0;
  }
}
