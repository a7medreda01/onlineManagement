import { Component, Input, Output, EventEmitter, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BostaCity, BostaDistrict, Governorate } from '../../../models/models';

export interface GroupedBostaGovItem {
  govName: string;
  govEnglishName?: string;
  isSelectedGov: boolean;
  districtCount: number;
  isExpanded: boolean;
  city: BostaCity;
  districts: BostaDistrict[];
  govMatch?: Governorate;
}

@Component({
  selector: 'app-zone-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zone-modal.component.html'
})
export class ZoneModalComponent implements OnChanges {
  // Input Signals for high performance change detection
  bostaCitiesSignal = signal<BostaCity[]>([]);
  governoratesSignal = signal<Governorate[]>([]);
  selectedGovernorateIdSignal = signal<number>(0);

  @Input() set bostaCities(val: BostaCity[]) {
    this.bostaCitiesSignal.set(val || []);
  }
  get bostaCities(): BostaCity[] {
    return this.bostaCitiesSignal();
  }

  @Input() set governorates(val: Governorate[]) {
    this.governoratesSignal.set(val || []);
  }
  get governorates(): Governorate[] {
    return this.governoratesSignal();
  }

  @Input() set selectedGovernorateId(val: number) {
    this.selectedGovernorateIdSignal.set(val || 0);
  }
  get selectedGovernorateId(): number {
    return this.selectedGovernorateIdSignal();
  }

  @Input() isOpen: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() selectZone = new EventEmitter<{ city: BostaCity; dist: BostaDistrict; govMatch?: Governorate }>();

  zoneSearchQuery = signal<string>('');

  // Track explicit manual user toggles (open/close) per cityId
  collapsedGovIds = signal<Set<string>>(new Set<string>());
  expandedGovIds = signal<Set<string>>(new Set<string>());

  // Computed Signal: Cached memoized calculation to prevent re-computations during Angular CD
  groupedZoneItems = computed<GroupedBostaGovItem[]>(() => {
    const cities = this.bostaCitiesSignal();
    if (!cities || cities.length === 0) return [];

    const query = this.normalizeArabic(this.zoneSearchQuery()).trim();
    const currentGovId = this.selectedGovernorateIdSignal();
    const govs = this.governoratesSignal();
    const currentGov = govs.find(g => g.id === currentGovId);
    const normCurrentGovName = currentGov ? this.normalizeArabic(currentGov.name) : '';
    const collapsed = this.collapsedGovIds();
    const expanded = this.expandedGovIds();

    const groups: GroupedBostaGovItem[] = [];

    for (const city of cities) {
      const normCity = this.normalizeArabic((city.cityOtherName || '') + ' ' + (city.cityName || ''));
      const govMatch = govs.find(g => {
        const ng = this.normalizeArabic(g.name);
        return normCity.includes(ng) || ng.includes(normCity);
      });

      const isSelectedGov = !!(
        (currentGovId > 0 && govMatch?.id === currentGovId) ||
        (normCurrentGovName && normCity.includes(normCurrentGovName))
      );

      const allDistricts = city.districts || [];
      let filteredDistricts = allDistricts;

      if (query) {
        filteredDistricts = allDistricts.filter(dist => {
          const normDist = this.normalizeArabic((dist.districtOtherName || '') + ' ' + (dist.districtName || ''));
          return normDist.includes(query) || normCity.includes(query);
        });
        if (filteredDistricts.length === 0 && !normCity.includes(query)) {
          continue;
        }
      }

      let isExpanded = isSelectedGov;
      if (query.length > 0) {
        isExpanded = true;
      } else if (collapsed.has(city.cityId)) {
        isExpanded = false;
      } else if (expanded.has(city.cityId)) {
        isExpanded = true;
      }

      groups.push({
        govName: city.cityOtherName || city.cityName,
        govEnglishName: city.cityName,
        isSelectedGov,
        districtCount: filteredDistricts.length,
        isExpanded,
        city,
        districts: filteredDistricts,
        govMatch
      });
    }

    groups.sort((a, b) => {
      if (a.isSelectedGov && !b.isSelectedGov) return -1;
      if (!a.isSelectedGov && b.isSelectedGov) return 1;
      return 0;
    });

    return groups;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      // Reset search query and user manual collapse toggles when opening
      this.zoneSearchQuery.set('');
      this.collapsedGovIds.set(new Set<string>());
      this.expandedGovIds.set(new Set<string>());
    }
  }

  normalizeArabic(text?: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\(.*\)/g, '')
      .replace(/[^a-zA-Z0-9\u0621-\u064A\s]/g, '')
      .trim();
  }

  toggleGovAccordion(cityId: string, isSelectedGov: boolean, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const currentlyOpen = this.isGovExpanded(cityId, isSelectedGov);

    if (currentlyOpen) {
      this.collapsedGovIds.update(set => {
        const next = new Set(set);
        next.add(cityId);
        return next;
      });
      this.expandedGovIds.update(set => {
        const next = new Set(set);
        next.delete(cityId);
        return next;
      });
    } else {
      this.expandedGovIds.update(set => {
        const next = new Set(set);
        next.add(cityId);
        return next;
      });
      this.collapsedGovIds.update(set => {
        const next = new Set(set);
        next.delete(cityId);
        return next;
      });
    }
  }

  isGovExpanded(cityId: string, isSelectedGov: boolean): boolean {
    const query = this.normalizeArabic(this.zoneSearchQuery()).trim();
    if (query.length > 0) return true;

    if (this.collapsedGovIds().has(cityId)) return false;
    if (this.expandedGovIds().has(cityId)) return true;

    return isSelectedGov;
  }

  onSelectZone(group: GroupedBostaGovItem, dist: BostaDistrict, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectZone.emit({
      city: group.city,
      dist,
      govMatch: group.govMatch
    });
  }

  onCloseModal(): void {
    this.close.emit();
  }
}
