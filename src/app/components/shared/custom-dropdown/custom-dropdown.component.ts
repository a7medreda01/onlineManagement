import { Component, Input, Output, EventEmitter, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

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
  @Input() icon: string = 'fa-solid fa-box';

  @Output() valueChange = new EventEmitter<any>();

  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  failedImages = signal<Set<any>>(new Set());

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.searchTerm.set('');
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

  selectOption(opt: DropdownOption, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.value = opt.value;
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.value = null;
    this.valueChange.emit(null);
  }

  handleImageError(optValue: any): void {
    this.failedImages.update(set => {
      const updated = new Set(set);
      updated.add(optValue);
      return updated;
    });
  }

  hasImageFailed(optValue: any): boolean {
    return this.failedImages().has(optValue);
  }

  formatImageUrl(url?: string): string | undefined {
    if (!url || url === 'null' || url === 'undefined') return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = environment.apiBaseUrl || 'https://besnesy.runasp.net';
    return `${baseUrl}/${url.replace(/^\//, '')}`;
  }
}
