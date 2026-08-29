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

  get moderatorsOnly(): TeamActivitySummary[] {
    const list = this.currentBattleData;
    if (!list) return [];
    return list.filter(t => {
      if (!t.userRole) return false;
      const role = t.userRole.toLowerCase();
      return role === 'moderator' || role.includes('مودريتور') || role.includes('mod');
    }).sort((a, b) => (b.ordersCreatedCount + b.ordersConfirmedCount) - (a.ordersCreatedCount + a.ordersConfirmedCount));
  }

  get modA(): TeamActivitySummary | null {
    return this.moderatorsOnly.length > 0 ? this.moderatorsOnly[0] : null;
  }

  get modB(): TeamActivitySummary | null {
    return this.moderatorsOnly.length > 1 ? this.moderatorsOnly[1] : null;
  }

  get modAScore(): number {
    const a = this.modA;
    return a ? (a.ordersCreatedCount + a.ordersConfirmedCount) : 0;
  }

  get modBScore(): number {
    const b = this.modB;
    return b ? (b.ordersCreatedCount + b.ordersConfirmedCount) : 0;
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
