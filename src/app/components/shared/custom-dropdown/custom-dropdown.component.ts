import { Component, Input, Output, EventEmitter, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DropdownOption {
  value: any;
  label: string;
  sublabel?: string;
  icon?: string;
  badge?: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-dropdown.component.html'
})
export class CustomDropdownComponent {
  @Input() label: string = '';
  @Input() placeholder: string = 'اختر من القائمة...';
  @Input() options: DropdownOption[] = [];
  @Input() value: any = null;
  @Input() searchable: boolean = true;
  @Input() icon: string = 'fa-solid fa-list-ul';

  @Output() valueChange = new EventEmitter<any>();

  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  popoverStyle = signal<{ top?: string, right?: string, width?: string }>({});

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    if (this.isOpen()) {
      this.calculatePosition();
    }
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.calculatePosition();
      this.searchTerm.set('');
    }
  }

  calculatePosition(): void {
    const triggerEl = this.elementRef.nativeElement.querySelector('.dropdown-trigger');
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      this.popoverStyle.set({
        top: `${rect.bottom + 6}px`,
        right: `${window.innerWidth - rect.right}px`,
        width: `${Math.max(rect.width, 220)}px`
      });
    }
  }

  get selectedOption(): DropdownOption | undefined {
    return this.options.find(opt => opt.value === this.value);
  }

  get filteredOptions(): DropdownOption[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.options;
    return this.options.filter(opt => 
      opt.label.toLowerCase().includes(term) || 
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }

  selectOption(opt: DropdownOption): void {
    this.value = opt.value;
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.value = null;
    this.valueChange.emit(null);
  }
}
