import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import { FinancialSummary, ProductPerformance, TeamActivitySummary } from '../../models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  summary = signal<FinancialSummary | null>(null);
  productsPerformance = signal<ProductPerformance[]>([]);
  teamActivity = signal<TeamActivitySummary[]>([]);
  loading = signal<boolean>(true);

  fromDate = '';
  toDate = '';
  selectedPreset = 'month';

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.setPreset('month');
  }

  setPreset(preset: string): void {
    this.selectedPreset = preset;
    const now = new Date();

    if (preset === 'today') {
      const todayStr = this.formatDate(now);
      this.fromDate = todayStr;
      this.toDate = todayStr;
    } else if (preset === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      this.fromDate = this.formatDate(sevenDaysAgo);
      this.toDate = this.formatDate(now);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      this.fromDate = this.formatDate(startOfMonth);
      this.toDate = this.formatDate(now);
    } else if (preset === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      this.fromDate = this.formatDate(startOfLastMonth);
      this.toDate = this.formatDate(endOfLastMonth);
    } else if (preset === 'all') {
      this.fromDate = '';
      this.toDate = '';
    }

    this.loadReports();
  }

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadReports(): void {
    this.loading.set(true);
    this.reportService.getFinancialSummary(this.fromDate, this.toDate).subscribe({
      next: (res: FinancialSummary) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.loading.set(false);
      }
    });

    this.reportService.getProductPerformance(this.fromDate, this.toDate).subscribe({
      next: (res: ProductPerformance[]) => this.productsPerformance.set(res),
      error: (err: any) => console.error(err)
    });

    this.reportService.getTeamActivitySummary(this.fromDate, this.toDate).subscribe({
      next: (res: TeamActivitySummary[]) => this.teamActivity.set(res),
      error: (err: any) => console.error(err)
    });
  }
}
