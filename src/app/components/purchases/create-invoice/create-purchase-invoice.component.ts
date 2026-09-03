import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PurchaseService } from '../../../services/purchase.service';
import { ProductService } from '../../../services/product.service';
import { NotificationService } from '../../../services/notification.service';
import { Product, Supplier } from '../../../models/models';
import { AuthService } from '../../../services/auth.service';
import { PlanFeatureLockComponent } from '../../shared/plan-feature-lock/plan-feature-lock.component';
import { UpgradeModalComponent } from '../../shared/upgrade-modal/upgrade-modal.component';

interface InvoiceItemRow {
  productId?: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

@Component({
  selector: 'app-create-purchase-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PlanFeatureLockComponent, UpgradeModalComponent],
  templateUrl: './create-purchase-invoice.component.html'
})
export class CreatePurchaseInvoiceComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);

  isUpgradeModalOpen = false;
  targetPlan = 'خطة قياسية';

  canAccessPurchases(): boolean {
    return this.authService.canAccessPurchases();
  }

  selectedSupplierId: number | null = null;
  title = '';
  invoiceDate = new Date().toISOString().split('T')[0];
  isPaid = true;
  discount = 0;
  paidAmount = 0;
  notes = '';

  items: InvoiceItemRow[] = [];

  // Modals for adding products from inventory or new supplier
  showInventoryModal = false;
  selectedInventoryProductId: number | null = null;
  inventoryQuantity = 1;
  inventoryUnitPrice = 0;

  showNewSupplierModal = false;
  newSupplier = { name: '', phone: '', company: '', address: '' };

  submitting = false;

  constructor(
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.canAccessPurchases()) return;
    this.loadLookups();
    // Add default empty row
    this.addCustomItemRow();
  }

  loadLookups(): void {
    this.purchaseService.getSuppliersList().subscribe({
      next: (res) => {
        this.suppliers.set(res);
        if (res.length > 0) this.selectedSupplierId = res[0].id;
      },
      error: (err) => console.error(err)
    });

    this.productService.getAll().subscribe({
      next: (res) => this.products.set(res),
      error: (err) => console.error(err)
    });
  }

  addCustomItemRow(): void {
    this.items.push({
      itemName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    });
  }

  removeItemRow(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    } else {
      this.items[0] = { itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
    }
  }

  onItemChange(item: InvoiceItemRow): void {
    if (item.quantity < 1) item.quantity = 1;
    if (item.unitPrice < 0) item.unitPrice = 0;
    item.totalPrice = item.quantity * item.unitPrice;
  }

  openInventoryModal(): void {
    if (this.products().length > 0) {
      this.selectedInventoryProductId = this.products()[0].id;
      this.inventoryUnitPrice = this.products()[0].wholesalePrice || this.products()[0].sellingPrice || 0;
    }
    this.inventoryQuantity = 1;
    this.showInventoryModal = true;
  }

  onInventoryProductSelect(): void {
    const p = this.products().find(x => x.id === this.selectedInventoryProductId);
    if (p) {
      this.inventoryUnitPrice = p.wholesalePrice || p.sellingPrice || 0;
    }
  }

  addInventoryItem(): void {
    if (!this.selectedInventoryProductId) return;
    const p = this.products().find(x => x.id === this.selectedInventoryProductId);
    if (!p) return;

    this.items.push({
      productId: p.id,
      itemName: p.name,
      quantity: this.inventoryQuantity,
      unitPrice: this.inventoryUnitPrice,
      totalPrice: this.inventoryQuantity * this.inventoryUnitPrice
    });

    this.showInventoryModal = false;
  }

  openNewSupplierModal(): void {
    this.newSupplier = { name: '', phone: '', company: '', address: '' };
    this.showNewSupplierModal = true;
  }

  saveNewSupplier(): void {
    if (!this.newSupplier.name || !this.newSupplier.phone) {
      this.notificationService.error('اسم المورد ورقم الهاتف حقول مطلوبة');
      return;
    }

    this.purchaseService.createSupplier(this.newSupplier).subscribe({
      next: (created) => {
        this.notificationService.success('تمت إضافة المورد بنجاح');
        this.suppliers.update(list => [...list, created]);
        this.selectedSupplierId = created.id;
        this.showNewSupplierModal = false;
      },
      error: (err) => this.notificationService.error(err?.error?.Message || 'خطأ أثناء إنشاء المورد')
    });
  }

  get subTotal(): number {
    return this.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }

  get totalAmount(): number {
    return Math.max(0, this.subTotal - (this.discount || 0));
  }

  saveInvoice(): void {
    if (!this.selectedSupplierId) {
      this.notificationService.error('يرجى اختيار المورد أولاً');
      return;
    }

    const validItems = this.items.filter(i => i.itemName && i.itemName.trim() !== '' && i.quantity > 0);
    if (validItems.length === 0) {
      this.notificationService.error('يرجى إضافة صنف واحد على الأقل محدد الاسم والكمية');
      return;
    }

    this.submitting = true;
    const dto = {
      supplierId: this.selectedSupplierId,
      title: this.title,
      invoiceDate: this.invoiceDate,
      discount: this.discount || 0,
      paidAmount: this.isPaid ? this.totalAmount : (this.paidAmount || 0),
      isPaid: this.isPaid,
      notes: this.notes,
      items: validItems.map(i => ({
        productId: i.productId,
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    };

    this.purchaseService.createPurchaseInvoice(dto).subscribe({
      next: (res) => {
        this.submitting = false;
        this.notificationService.success(`تم حفظ فاتورة المشتريات رقم #${res.invoiceNumber} والمصروف المرتبط بها بنجاح`);
        this.router.navigate(['/purchases/invoices']);
      },
      error: (err) => {
        this.submitting = false;
        this.notificationService.error(err?.error?.Message || 'خطأ أثناء حفظ الفاتورة');
      }
    });
  }
}
