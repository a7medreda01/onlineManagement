import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { PayrollService } from '../../services/payroll.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { User, UserRole, StaffMemberPayrollSummary, StaffPayrollRecord, Wallet } from '../../models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  payrollSummaries = signal<StaffMemberPayrollSummary[]>([]);
  payrollHistory = signal<StaffPayrollRecord[]>([]);
  wallets = signal<Wallet[]>([]);
  UserRole = UserRole;

  activeTab: 'users' | 'payroll' | 'history' = 'users';

  // Add / Edit User Modal
  showModal = false;
  isEditMode = false;
  currentUser: any = {
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.Moderator,
    baseSalary: 0,
    salaryDueDay: 1,
    shiftStartTime: '09:00',
    shiftEndTime: '17:00',
    shiftTargetOrders: 0,
    shiftBonusAmount: 0
  };

  // Salary Disbursement Modal
  showDisburseModal = false;
  disburseData = {
    userId: 0,
    userName: '',
    amount: 0,
    walletId: 0,
    notes: ''
  };

  // Advance Loan Modal
  showAdvanceModal = false;
  advanceData = {
    userId: 0,
    userName: '',
    amount: 0,
    walletId: 0,
    reason: 'سلفة على المرتب'
  };

  // Bonus / Penalty Modal
  showBonusPenaltyModal = false;
  bonusPenaltyData = {
    userId: 0,
    userName: '',
    type: 1, // 1 = ManualBonus, 3 = PenaltyDeduction
    amount: 0,
    reason: ''
  };

  constructor(
    private userService: UserService,
    private payrollService: PayrollService,
    private walletService: WalletService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadPayrollSummaries();
    this.loadWallets();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (res) => this.users.set(res),
      error: (err) => console.error(err)
    });
  }

  loadPayrollSummaries(): void {
    this.payrollService.getStaffSummaries().subscribe({
      next: (res) => this.payrollSummaries.set(res),
      error: (err) => console.error(err)
    });
  }

  loadPayrollHistory(): void {
    this.payrollService.getHistory().subscribe({
      next: (res) => this.payrollHistory.set(res),
      error: (err) => console.error(err)
    });
  }

  loadWallets(): void {
    this.walletService.getAll().subscribe({
      next: (res) => this.wallets.set(res),
      error: (err) => console.error(err)
    });
  }

  setTab(tab: 'users' | 'payroll' | 'history'): void {
    this.activeTab = tab;
    if (tab === 'payroll') this.loadPayrollSummaries();
    if (tab === 'history') this.loadPayrollHistory();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentUser = {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      role: UserRole.Moderator,
      baseSalary: 0,
      salaryDueDay: 1,
      shiftStartTime: '09:00',
      shiftEndTime: '17:00',
      shiftTargetOrders: 0,
      shiftBonusAmount: 0
    };
    this.showModal = true;
  }

  openEditModal(u: User): void {
    this.isEditMode = true;
    this.currentUser = {
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      baseSalary: u.baseSalary || 0,
      salaryDueDay: u.salaryDueDay || 1,
      shiftStartTime: u.shiftStartTime || '09:00',
      shiftEndTime: u.shiftEndTime || '17:00',
      shiftTargetOrders: u.shiftTargetOrders || 0,
      shiftBonusAmount: u.shiftBonusAmount || 0,
      isActive: u.isActive
    };
    this.showModal = true;
  }

  saveUser(): void {
    if (this.isEditMode) {
      this.userService.update(this.currentUser.id, this.currentUser).subscribe({
        next: () => {
          this.showModal = false;
          this.notificationService.success('تم تحديث بيانات المستخدم بنجاح');
          this.loadUsers();
          this.loadPayrollSummaries();
        },
        error: (err) => {
          const msg = err?.error?.Message || err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'خطأ أثناء التعديل';
          this.notificationService.error(msg);
        }
      });
    } else {
      this.userService.create(this.currentUser).subscribe({
        next: () => {
          this.showModal = false;
          this.notificationService.success('تم إنشاء حساب المستخدم بنجاح');
          this.loadUsers();
          this.loadPayrollSummaries();
        },
        error: (err) => {
          const msg = err?.error?.Message || err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'خطأ أثناء إنشاء حساب المستخدم';
          this.notificationService.error(msg);
        }
      });
    }
  }

  async deleteUser(u: User): Promise<void> {
    const confirmed = await this.notificationService.confirm(`هل أنت تأكد من حذف حساب '${u.fullName}'؟`, 'تأكيد الحذف');
    if (confirmed) {
      this.userService.delete(u.id).subscribe({
        next: () => {
          this.notificationService.success('تم حذف حساب المستخدم بنجاح');
          this.loadUsers();
          this.loadPayrollSummaries();
        },
        error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ أثناء الحذف')
      });
    }
  }

  // =====================
  // Payroll Actions
  // =====================

  openDisburseModal(staff: StaffMemberPayrollSummary): void {
    const defaultWallet = this.wallets()[0];
    this.disburseData = {
      userId: staff.userId,
      userName: staff.fullName,
      amount: Math.max(0, staff.netPayableSalary),
      walletId: defaultWallet?.id || 0,
      notes: `صرف مرتب شهر ${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`
    };
    this.showDisburseModal = true;
  }

  confirmDisburseSalary(): void {
    if (!this.disburseData.walletId) {
      this.notificationService.error('يرجى اختيار الخزينة أو المحفظة للخصم منها');
      return;
    }

    this.payrollService.disburseSalary(this.disburseData).subscribe({
      next: () => {
        this.showDisburseModal = false;
        this.notificationService.success('تم صرف المرتب بنجاح وتسجيله في المصروفات');
        this.loadPayrollSummaries();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'فشل صرف المرتب')
    });
  }

  openAdvanceModal(staff: StaffMemberPayrollSummary): void {
    const defaultWallet = this.wallets()[0];
    this.advanceData = {
      userId: staff.userId,
      userName: staff.fullName,
      amount: 0,
      walletId: defaultWallet?.id || 0,
      reason: 'سلفة نقدية على المرتب'
    };
    this.showAdvanceModal = true;
  }


  confirmRecordAdvance(): void {
    if (!this.advanceData.walletId || this.advanceData.amount <= 0) {
      this.notificationService.error('يرجى تحديد المبلغ والخزينة بشكل صحيح');
      return;
    }

    this.payrollService.recordAdvance(this.advanceData).subscribe({
      next: () => {
        this.showAdvanceModal = false;
        this.notificationService.success('تم تسجيل السلفة وتحديث رصيد الموظف والخزينة');
        this.loadPayrollSummaries();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'فشل تسجيل السلفة')
    });
  }

  openBonusPenaltyModal(staff: StaffMemberPayrollSummary, type: number): void {
    this.bonusPenaltyData = {
      userId: staff.userId,
      userName: staff.fullName,
      type: type, // 1 = ManualBonus, 3 = PenaltyDeduction
      amount: 0,
      reason: type === 1 ? 'مكافأة أداء وتميز' : 'خصم جزاء'
    };
    this.showBonusPenaltyModal = true;
  }

  confirmRecordBonusPenalty(): void {
    if (this.bonusPenaltyData.amount <= 0) {
      this.notificationService.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    this.payrollService.recordBonusPenalty(this.bonusPenaltyData).subscribe({
      next: () => {
        this.showBonusPenaltyModal = false;
        this.notificationService.success('تم تسجيل المعاملة بنجاح');
        this.loadPayrollSummaries();
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'فشل التسجيل')
    });
  }

  getRoleBadgeClass(role?: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case UserRole.Manager:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case UserRole.FinancialManager:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case UserRole.Moderator:
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  }
}
