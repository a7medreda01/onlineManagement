import { Component, Input, Output, EventEmitter, OnInit, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-date-picker.component.html'
})
export class CustomDatePickerComponent implements OnInit {
  @Input() label: string = '';
  @Input() placeholder: string = 'اختر التاريخ...';
  @Input() value: string = ''; // YYYY-MM-DD
  @Output() valueChange = new EventEmitter<string>();

  @Input() openUpward: boolean = false;

  isOpen = signal<boolean>(false);
  isUpward = signal<boolean>(false);

  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());

  monthNames = [
    'يناير (1)', 'فبراير (2)', 'مارس (3)', 'أبريل (4)', 
    'مايو (5)', 'يونيو (6)', 'يوليو (7)', 'أغسطس (8)', 
    'سبتمبر (9)', 'أكتوبر (10)', 'نوفمبر (11)', 'ديسمبر (12)'
  ];

  weekDays = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  calendarDays: Array<{ dateStr: string, dayNum: number, isCurrentMonth: boolean, isToday: boolean, isSelected: boolean }> = [];

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    if (this.value) {
      const parts = this.value.split('-');
      if (parts.length === 3) {
        this.currentYear.set(parseInt(parts[0], 10));
        this.currentMonth.set(parseInt(parts[1], 10) - 1);
      }
    }
    this.generateCalendar();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.checkDirection();
      this.generateCalendar();
    }
  }

  checkDirection(): void {
    if (this.openUpward) {
      this.isUpward.set(true);
      return;
    }
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    this.isUpward.set(spaceBelow < 320);
  }

  generateCalendar(): void {
    const year = this.currentYear();
    const month = this.currentMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    const days: Array<{ dateStr: string, dayNum: number, isCurrentMonth: boolean, isToday: boolean, isSelected: boolean }> = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = this.formatDateIso(prevDate);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.value
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = this.formatDateIso(curDate);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.value
      });
    }

    // Next month padding days to fill 42 slots (6 weeks)
    const remainingSlots = 42 - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = this.formatDateIso(nextDate);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.value
      });
    }

    this.calendarDays = days;
  }

  formatDateIso(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  selectDate(dateStr: string): void {
    this.value = dateStr;
    this.valueChange.emit(this.value);
    this.isOpen.set(false);
    this.generateCalendar();
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.generateCalendar();
  }

  // Quick Preset Actions
  setToday(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.selectDate(todayStr);
  }

  setYesterday(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.selectDate(this.formatDateIso(yesterday));
  }

  setFirstOfCurrentMonth(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.selectDate(this.formatDateIso(firstDay));
  }

  clearDate(): void {
    this.value = '';
    this.valueChange.emit('');
    this.isOpen.set(false);
  }

  get formattedDisplayValue(): string {
    if (!this.value) return '';
    const parts = this.value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return this.value;
  }
}
