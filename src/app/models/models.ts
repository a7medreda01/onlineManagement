export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  FinancialManager = 'FinancialManager',
  Moderator = 'Moderator'
}

export enum OrderStatus {
  New = 'New',
  Confirming = 'Confirming',
  Confirmed = 'Confirmed',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
  Returned = 'Returned'
}

export enum SubscriptionStatus {
  Active = 'Active',
  Suspended = 'Suspended',
  Expired = 'Expired'
}

export interface DropdownOption<T = any> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: string;
  badge?: string;
  disabled?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  baseSalary?: number;
  salaryDueDay?: number;
  currentAdvanceBalance?: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftTargetOrders?: number;
  shiftBonusAmount?: number;
}


export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  userId: number;
  tenantId?: number;
  storeName?: string;
  username: string;
  fullName: string;
  email: string;
  role?: UserRole;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  subscriptionStatus?: SubscriptionStatus;
  daysRemainingInSubscription?: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  wholesalePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
  availableQuantity: number;
  isLowStock: boolean;
  isActive: boolean;
  isFulfillment?: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  secondaryPhone: string;
  address: string;
  governorateId: number;
  governorateName: string;
  notes: string;
  isBlacklisted: boolean;
  createdAt: string;
}

export interface CustomerSearchDto {
  id: number;
  name: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  governorateId: number;
  governorateName: string;
  isBlacklisted: boolean;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  deliverySuccessRate: number;
}

export interface CustomerOrderHistoryDto {
  id: number;
  orderNumber: string;
  createdAt: string;
  status: string;
  statusArabic: string;
  totalAmount: number;
  itemsCount: number;
  productsSummary: string;
}

export interface CustomerProfileDto extends CustomerSearchDto {
  pastOrders: CustomerOrderHistoryDto[];
}

export interface Governorate {
  id: number;
  name: string;
}

export interface SalesPlatform {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ShippingRate {
  id: number;
  shippingCompanyId: number;
  governorateId: number;
  governorateName: string;
  shippingPrice: number;
  returnPrice: number;
}

export interface ShippingCompany {
  id: number;
  name: string;
  phone: string;
  isActive: boolean;
  apiKey?: string;
  webhookUrl?: string;
  isIntegrated?: boolean;
  rates: ShippingRate[];
}

export interface OrderItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  wholesalePrice: number;
  sellingPrice: number;
  subtotal: number;
}

export interface OrderStatusHistory {
  id: number;
  status: OrderStatus;
  notes: string;
  changedAt: string;
  changedByName: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerSecondaryPhone?: string;
  customerAddress: string;
  shippingCompanyId: number;
  shippingCompanyName: string;
  governorateId: number;
  governorateName: string;
  salesPlatformId: number;
  salesPlatformName: string;
  status: OrderStatus;
  statusName: string;
  notes: string;
  shippingCost: number;
  returnCost: number;
  subTotal: number;
  totalAmount: number;
  depositAmount: number;
  paidToWalletId?: number;
  paidToWalletName?: string;
  remainingAmount: number;
  profitAmount: number;
  lossAmount: number;
  createdAt: string;
  updatedAt?: string;
  createdByName: string;
  confirmedByName?: string;
  orderItems: OrderItem[];
  statusHistories: OrderStatusHistory[];
}

export enum ExpenseCategory {
  Ads = 'Ads',
  Salaries = 'Salaries',
  Products = 'Products',
  ShippingReturns = 'ShippingReturns',
  Operations = 'Operations',
  Other = 'Other'
}

export interface Expense {
  id: number;
  title: string;
  category: ExpenseCategory;
  categoryName: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  createdByName?: string;
  createdAt: string;
}

export interface CreateExpenseDto {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate?: string;
  notes?: string;
}

export interface UpdateExpenseDto {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate?: string;
  notes?: string;
}

export interface ExpenseCategoryItem {
  category: ExpenseCategory;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  adsExpenses: number;
  salariesExpenses: number;
  productsExpenses: number;
  shippingReturnExpenses: number;
  operationsExpenses: number;
  otherExpenses: number;
  categoriesBreakdown: ExpenseCategoryItem[];
}

export interface FinancialSummary {
  totalRevenue: number;
  totalProfits: number;
  totalLosses: number;
  totalExpenses: number;
  adsExpenses: number;
  salariesExpenses: number;
  productsExpenses: number;
  shippingReturnExpenses: number;
  operationsExpenses: number;
  otherExpenses: number;
  netProfit: number;
  totalOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  deliveryRatePercentage: number;
  returnRatePercentage: number;
}

export interface ProductPerformance {
  productId: number;
  code: string;
  productName: string;
  totalQuantitySold: number;
  totalQuantityReturned: number;
  totalGeneratedProfit: number;
}

export interface DashboardSummary {
  todayTotalOrders: number;
  todayNewOrders: number;
  todayConfirmingOrders: number;
  todayConfirmedOrders: number;
  todayShippedOrders: number;
  todayDeliveredOrders: number;
  todayProfits: number;
  todayExpenses: number;
  todayReturnLosses: number;
  todayNetProfit: number;
  monthRevenue: number;
  monthProfits: number;
  monthExpenses: number;
  monthReturnLosses: number;
  monthNetProfit: number;
  todayReturnsCount: number;
  todayCancelledCount: number;
  completedPercentage: number;
  inProgressPercentage: number;
  returnedPercentage: number;
  bestSellerMonth: string;
  lowStockProductsCount: number;
}

export interface Tenant {
  id: number;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  totalProductsCount?: number;
  totalOrdersCount?: number;
  activeSubscription?: {
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    status: SubscriptionStatus;
    isGift: boolean;
    daysRemaining: number;
  };
}

export interface PlanBreakdown {
  planId: number;
  planName: string;
  badge: string;
  price: number;
  annualPrice: number;
  annualOfferPrice: number;
  subscribersCount: number;
  percentage: number;
}

export interface SuperAdminOverview {
  totalStoresCount: number;
  activeStoresCount: number;
  suspendedStoresCount: number;
  expiredStoresCount: number;
  newSignupsThisMonth: number;
  totalPlatformOrdersCount: number;
  totalSubscriptionsCount?: number;
  totalPlatformRevenue?: number;
  pendingPaymentRequestsCount?: number;
  planBreakdowns?: PlanBreakdown[];
}

export interface SubscriptionPaymentRequest {
  id: number;
  tenantId: number;
  storeName: string;
  ownerName: string;
  ownerEmail: string;
  userId: number;
  planId: number;
  planName: string;
  senderPhone: string;
  amount: number;
  transferDate: string;
  referenceNumber?: string;
  notes?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  statusName: string;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface TeamActivitySummary {
  userId: number;
  userName: string;
  userRole: string;
  ordersCreatedCount: number;
  ordersConfirmedCount: number;
}

export interface Plan {
  id: number;
  name: string;
  description?: string;
  badge?: string;
  price: number;
  originalPrice: number;
  annualPrice: number;
  annualOfferPrice: number;
  durationInDays: number;
  maxModerators: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  allowBostaIntegration: boolean;
  allowWalletsAndDeposits: boolean;
  allowExpensesTracking: boolean;
  allowFinancialReports: boolean;
  allowPurchasesManagement?: boolean;
  allowPayrollAndShifts?: boolean;
  isActive: boolean;
  createdAt?: string;
}

export interface SubscriptionDetails {
  subscriptionId: number;
  tenantId: number;
  storeName: string;
  ownerName: string;
  email: string;
  planId?: number;
  planName: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  isGift: boolean;
  daysRemaining: number;
  suspendedReason?: string;
  allowBostaIntegration?: boolean;
  allowWalletsAndDeposits?: boolean;
  allowExpensesTracking?: boolean;
  allowFinancialReports?: boolean;
  allowPurchasesManagement?: boolean;
  allowPayrollAndShifts?: boolean;
}

export interface StaffMemberPayrollSummary {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  baseSalary: number;
  salaryDueDay: number;
  currentAdvanceBalance: number;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftTargetOrders: number;
  shiftBonusAmount: number;
  currentMonthBonuses: number;
  currentMonthDeductions: number;
  netPayableSalary: number;
  nextSalaryDate: string;
}

export interface StaffPayrollRecord {
  id: number;
  userId: number;
  userName: string;
  type: 'SalaryPayment' | 'ShiftBonus' | 'ManualBonus' | 'PenaltyDeduction' | 'AdvanceLoan';
  typeName: string;
  amount: number;
  reason?: string;
  walletId?: number;
  walletName?: string;
  recordDate: string;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  roleName: string;
  storeName: string;
  createdAt: string;
  baseSalary: number;
  salaryDueDay: number;
  currentAdvanceBalance: number;
  currentMonthBonuses: number;
  currentMonthDeductions: number;
  netPayableSalary: number;
  nextSalaryDate: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftTargetOrders: number;
  shiftBonusAmount: number;
}


export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  balance: number;
  notes?: string;
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id?: number;
  productId?: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  supplierPhone: string;
  title?: string;
  invoiceDate: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  notes?: string;
  expenseId?: number;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  items: PurchaseInvoiceItem[];
}

export interface CreatePurchaseInvoiceDto {
  supplierId: number;
  title?: string;
  invoiceDate?: string;
  discount: number;
  paidAmount: number;
  isPaid: boolean;
  notes?: string;
  items: {
    productId?: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreateBostaShipmentDto {
  orderId: number;
  deliveryType?: number;
  source?: number;
  codAmount?: number;
  notes?: string;
  isFulfillment?: boolean;
}

export interface BostaShipmentDto {
  id: number;
  orderId: number;
  orderNumber: string;
  bostaTrackingNumber: string;
  bostaShipmentId: string;
  deliveryType: number;
  deliveryTypeName: string;
  source: number;
  sourceName: string;
  shipmentStatus: number;
  shipmentStatusName: string;
  shippingFee: number;
  codAmount: number;
  trackingUrl: string;
  notes?: string;
  lastStatusUpdate?: string;
}

export enum WalletType {
  CashDrawer = 1,
  VodafoneCash = 2,
  InstaPay = 3,
  BankAccount = 4,
  Other = 5
}

export enum WalletTransactionType {
  DepositReceipt = 1,
  OrderCodSettlement = 2,
  ManualDeposit = 3,
  TransferIn = 4,
  ExpensePayout = 5,
  TransferOut = 6,
  ManualWithdraw = 7,
  DepositRefund = 8
}

export interface Wallet {
  id: number;
  name: string;
  type: WalletType;
  typeName: string;
  accountNumber: string;
  balance: number;
  notes: string;
  isActive: boolean;
  transactionsCount: number;
  createdAt: string;
}

export interface CreateWalletDto {
  name: string;
  type: WalletType;
  accountNumber?: string;
  initialBalance?: number;
  notes?: string;
}

export interface UpdateWalletDto {
  name: string;
  type: WalletType;
  accountNumber?: string;
  notes?: string;
  isActive: boolean;
}

export interface WalletTransaction {
  id: number;
  walletId: number;
  walletName: string;
  walletType: WalletType;
  type: WalletTransactionType;
  typeName: string;
  amount: number;
  isCredit: boolean;
  orderId?: number;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  expenseId?: number;
  expenseTitle?: string;
  relatedWalletId?: number;
  relatedWalletName?: string;
  referenceNumber: string;
  notes: string;
  createdByUserName: string;
  createdAt: string;
}

export interface RecordOrderDepositDto {
  orderId?: number;
  orderNumber?: string;
  walletId: number;
  amount: number;
  referenceNumber?: string;
  notes?: string;
}

export interface TransferFundsDto {
  fromWalletId: number;
  toWalletId: number;
  amount: number;
  referenceNumber?: string;
  notes?: string;
}

export interface AdjustBalanceDto {
  walletId: number;
  type: WalletTransactionType;
  amount: number;
  referenceNumber?: string;
  notes?: string;
}

export interface WalletSummaryDto {
  totalLiquidBalance: number;
  totalDepositsToday: number;
  totalDepositsThisMonth: number;
  activeWalletsCount: number;
  wallets: Wallet[];
}
