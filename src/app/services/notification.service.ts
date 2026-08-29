import { Injectable, signal } from '@angular/core';

export interface ModalAlert {
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  activeModal = signal<ModalAlert | null>(null);

  alert(message: string, title = 'تنبيه', type: 'success' | 'error' | 'warning' | 'info' = 'info'): Promise<void> {
    return new Promise(resolve => {
      this.activeModal.set({
        type,
        title,
        message,
        confirmText: 'حسناً',
        resolve: () => {
          this.activeModal.set(null);
          resolve();
        }
      });
    });
  }

  success(message: string, title = 'تم بنجاح'): Promise<void> {
    return this.alert(message, title, 'success');
  }

  error(message: string, title = 'خطأ'): Promise<void> {
    return this.alert(message, title, 'error');
  }

  warning(message: string, title = 'تنبيه'): Promise<void> {
    return this.alert(message, title, 'warning');
  }

  info(message: string, title = 'معلومات'): Promise<void> {
    return this.alert(message, title, 'info');
  }

  confirm(message: string, title = 'تأكيد الإجراء'): Promise<boolean> {
    return new Promise(resolve => {
      this.activeModal.set({
        type: 'confirm',
        title,
        message,
        confirmText: 'نعم، تأكيد',
        cancelText: 'إلغاء',
        resolve: (result: boolean) => {
          this.activeModal.set(null);
          resolve(result);
        }
      });
    });
  }

  handleConfirm(result: boolean): void {
    const current = this.activeModal();
    if (current && current.resolve) {
      current.resolve(result);
    }
    this.activeModal.set(null);
  }
}
