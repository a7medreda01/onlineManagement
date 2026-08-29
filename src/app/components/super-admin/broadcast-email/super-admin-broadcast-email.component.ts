import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-super-admin-broadcast-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-card p-6 border-indigo-500/30 bg-slate-900/90 space-y-6">
      <div class="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div class="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl">
          <i class="bi bi-envelope-paper-heart-fill"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-100">إرسال حملة بريدية وعروض لمديري المتاجر</h3>
          <p class="text-xs text-slate-400">قم بإرسال رسائل بريد إلكتروني HTML احترافية لجميع أصحاب المتاجر لعرض ترقيات الباقات والمميزات الجديدة.</p>
        </div>
      </div>

      <form (ngSubmit)="send.emit()" class="space-y-4 max-w-2xl">
        <div class="form-group">
          <label class="form-label">موضوع الإيميل (Subject)</label>
          <input type="text" [(ngModel)]="emailForm.subject" name="subject" class="form-control" placeholder="مثال: 🔥 عرض خاص: قم بترقية باقة متجرك الآن بسعر حصري!" required />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">عنوان الرسالة الرئيسي (Title)</label>
            <input type="text" [(ngModel)]="emailForm.title" name="title" class="form-control" placeholder="مثال: استفد من ترقية باقة متجرك الاحترافية" required />
          </div>
          <div class="form-group">
            <label class="form-label">شارة العرض (Offer Badge)</label>
            <input type="text" [(ngModel)]="emailForm.offerBadge" name="offerBadge" class="form-control" placeholder="مثال: خصم 50% لفترة محدودة" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">محتوى الرسالة (يدعم أسطر متعددة)</label>
          <textarea [(ngModel)]="emailForm.messageContent" name="messageContent" rows="5" class="form-textarea" placeholder="اكتب تفاصيل العرض ومميزات الترقية..." required></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">نص زر الإجراء (Call to Action)</label>
            <input type="text" [(ngModel)]="emailForm.actionButtonText" name="actionButtonText" class="form-control" placeholder="تفعيل الباقة الآن" />
          </div>
          <div class="form-group">
            <label class="form-label">رابط الزر (URL)</label>
            <input type="text" [(ngModel)]="emailForm.actionButtonUrl" name="actionButtonUrl" class="form-control font-mono text-xs" placeholder="http://..." />
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" [disabled]="sending" class="btn bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-8 py-2.5 flex items-center justify-center gap-2">
            <i *ngIf="sending" class="bi bi-arrow-repeat animate-spin"></i>
            <i *ngIf="!sending" class="bi bi-send-fill"></i>
            <span>إرسال الحملة البريدية الآن</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class SuperAdminBroadcastEmailComponent {
  @Input() emailForm: any;
  @Input() sending: boolean = false;
  @Output() send = new EventEmitter<void>();
}
