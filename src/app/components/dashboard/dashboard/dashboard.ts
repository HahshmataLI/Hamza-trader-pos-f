// dashboard.ts - Updated component
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { UtilsModule } from '../../../utils.module';
import { DashboardService } from '../../../services/dashboard/dashboard-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardData } from '../../../interfaces/dashboard.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [SkeletonModule, ChartModule, UtilsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [DatePipe]
})
export class Dashboard implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  // Use signals for reactive state management
  dashboardData = signal<DashboardData | null>(null);
  loading = signal(true);
  error = signal('');

  // Chart data as signals
  salesChartData = signal<any>(null);
  paymentChartData = signal<any>(null);
  chartOptions = signal<any>(null);
  paymentChartOptions = signal<any>(null);
  
  // Current date for header
  currentDate = new Date();

  private refreshInterval: any;

  ngOnInit() {
    this.loadDashboardData();
    this.setupCharts();
    
    // Refresh data every 60 seconds (increased from 30 to reduce load)
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadDashboardData() {
    this.loading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        this.dashboardData.set(response.data);
        this.loading.set(false);
        this.updateCharts();
        this.updatePaymentChart();
      },
      error: (error) => {
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
        console.error('Dashboard error:', error);
      }
    });
  }

  refreshData() {
    this.loadDashboardData();
    this.currentDate = new Date();
  }

  setupCharts() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    // Revenue chart options
    this.chartOptions.set({
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += this.dashboardService.formatCurrency(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            callback: (value: any) => this.dashboardService.formatCurrency(value)
          },
          grid: {
            color: surfaceBorder
          }
        }
      }
    });

    // Payment chart options
    this.paymentChartOptions.set({
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${this.dashboardService.formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    });

    // Initial chart data
    this.salesChartData.set({
      labels: [],
      datasets: [
        {
          label: 'Revenue',
          data: [],
          backgroundColor: documentStyle.getPropertyValue('--blue-500'),
          borderColor: documentStyle.getPropertyValue('--blue-400'),
          borderWidth: 1
        }
      ]
    });

    this.paymentChartData.set({
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            documentStyle.getPropertyValue('--green-500'),
            documentStyle.getPropertyValue('--blue-500'),
            documentStyle.getPropertyValue('--purple-500'),
            documentStyle.getPropertyValue('--orange-500')
          ],
          hoverBackgroundColor: [
            documentStyle.getPropertyValue('--green-400'),
            documentStyle.getPropertyValue('--blue-400'),
            documentStyle.getPropertyValue('--purple-400'),
            documentStyle.getPropertyValue('--orange-400')
          ]
        }
      ]
    });
  }

  updateCharts() {
    const data = this.dashboardData();
    if (!data) return;

    // Update sales chart with daily data
    if (data.dailySales && data.dailySales.length > 0) {
      const labels = data.dailySales.map(sale => {
        const date = new Date(sale._id);
        return this.datePipe.transform(date, 'MMM dd') || sale._id;
      });
      const revenues = data.dailySales.map(sale => sale.revenue);

      this.salesChartData.update(current => ({
        ...current,
        labels: labels,
        datasets: [
          {
            ...current.datasets[0],
            data: revenues
          }
        ]
      }));
    } else {
      // Fallback to period data
      this.salesChartData.update(current => ({
        ...current,
        labels: ['Today', 'This Week', 'This Month'],
        datasets: [
          {
            ...current.datasets[0],
            data: [
              data.today.revenue,
              data.week.revenue,
              data.month.revenue
            ]
          }
        ]
      }));
    }
  }

  updatePaymentChart() {
    const data = this.dashboardData();
    if (!data || !data.salesByPaymentMethod) return;

    const labels = data.salesByPaymentMethod.map(item => item._id);
    const values = data.salesByPaymentMethod.map(item => item.total);

    this.paymentChartData.update(current => ({
      ...current,
      labels: labels,
      datasets: [
        {
          ...current.datasets[0],
          data: values
        }
      ]
    }));
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getSalesGrowth(): number {
    const data = this.dashboardData();
    if (!data) return 0;
    
    const todayAvg = data.today.averageOrderValue || 0;
    const monthAvg = data.month.averageOrderValue || 0;
    
    if (monthAvg === 0) return 0;
    return ((todayAvg - monthAvg) / monthAvg) * 100;
  }

  getProfitMargin(): number {
    const data = this.dashboardData();
    if (!data || data.today.revenue === 0) return 0;
    return (data.today.profit / data.today.revenue) * 100;
  }
}