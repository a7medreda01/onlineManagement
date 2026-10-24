import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamActivitySummary, ModeratorPkBattleResult, ModeratorPkWinner } from '../../../models/models';

@Component({
  selector: 'app-moderator-pk-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moderator-pk-banner.component.html'
})
export class ModeratorPkBannerComponent {
  @Input() teamActivity: TeamActivitySummary[] = [];
  @Input() pkBattleResult: ModeratorPkBattleResult | null = null;

  get currentBattleData(): TeamActivitySummary[] {
    if (this.pkBattleResult && this.pkBattleResult.currentBattle) {
      return this.pkBattleResult.currentBattle;
    }
    return this.teamActivity || [];
  }

  get previousWinner(): ModeratorPkWinner | null | undefined {
    return this.pkBattleResult?.previousWinner;
  }

  get shiftName(): string {
    return this.pkBattleResult?.shiftName || 'شيفت الصباح (9 ص — 8 م)';
  }

  private getScore(mod: TeamActivitySummary | null): number {
    if (!mod) return 0;
    return mod.totalOrdersCount !== undefined && mod.totalOrdersCount !== null
      ? mod.totalOrdersCount
      : (mod.ordersCreatedCount + mod.ordersConfirmedCount);
  }

  get moderatorsOnly(): TeamActivitySummary[] {
    const list = this.currentBattleData;
    if (!list) return [];
    return list.filter(t => {
      if (!t.userRole) return false;
      const role = t.userRole.toLowerCase();
      const isMod = role === 'moderator' || role.includes('مودريتور') || role.includes('mod');
      const isManagerOrAdmin = role === 'manager' || role === 'admin' || role.includes('مدير') || role.includes('أدمن') || role.includes('ادمن');
      const score = this.getScore(t);
      return isMod || (isManagerOrAdmin && score > 0);
    }).sort((a, b) => this.getScore(b) - this.getScore(a));
  }

  isManagerRole(role?: string): boolean {
    if (!role) return false;
    const r = role.toLowerCase();
    return r === 'manager' || r === 'admin' || r.includes('مدير') || r.includes('أدمن') || r.includes('ادمن');
  }

  get modA(): TeamActivitySummary | null {
    return this.moderatorsOnly.length > 0 ? this.moderatorsOnly[0] : null;
  }

  get modB(): TeamActivitySummary | null {
    return this.moderatorsOnly.length > 1 ? this.moderatorsOnly[1] : null;
  }

  get modAScore(): number {
    return this.getScore(this.modA);
  }

  get modBScore(): number {
    return this.getScore(this.modB);
  }

  get modAPercent(): number {
    const total = this.modAScore + this.modBScore;
    if (total === 0) return 50;
    return Math.round((this.modAScore / total) * 100);
  }

  get modBPercent(): number {
    const total = this.modAScore + this.modBScore;
    if (total === 0) return 50;
    return 100 - this.modAPercent;
  }
}
