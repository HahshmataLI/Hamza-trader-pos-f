import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { UtilsModule } from '../../../utils.module';
import { DashboardData, DashboardService } from '../../../services/dashboard/dashboard-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
@Component({
  selector: 'app-dashboard',
  imports: [SkeletonModule,ChartModule,UtilsModule,CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  // Use signals for reactive state management
  dashboardData = signal<DashboardData | null>(null);
  loading = signal(true);
  error = signal('');

  // Chart data as signals
  salesChartData = signal<any>(null);
  inventoryChartData = signal<any>(null);
  chartOptions = signal<any>(null);

  private refreshInterval: any;

  ngOnInit() {
    this.loadDashboardData();
    this.setupCharts();
    
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 30000);
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
      },
      error: (error) => {
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
        console.error('Dashboard error:', error);
      }
    });
  }

  setupCharts() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions.set({
      plugins: {
        legend: {
          labels: {
            color: textColor
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
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        }
      }
    });

    // Initial chart data
    this.salesChartData.set({
      labels: ['Today', 'This Month'],
      datasets: [
        {
          label: 'Revenue',
          data: [0, 0],
          backgroundColor: [
            documentStyle.getPropertyValue('--blue-500'),
            documentStyle.getPropertyValue('--green-500')
          ],
          borderColor: [
            documentStyle.getPropertyValue('--blue-400'),
            documentStyle.getPropertyValue('--green-400')
          ],
          borderWidth: 1
        }
      ]
    });

    this.inventoryChartData.set({
      labels: ['In Stock', 'Low Stock'],
      datasets: [
        {
          data: [0, 0],
          backgroundColor: [
            documentStyle.getPropertyValue('--green-500'),
            documentStyle.getPropertyValue('--red-500')
          ],
          hoverBackgroundColor: [
            documentStyle.getPropertyValue('--green-400'),
            documentStyle.getPropertyValue('--red-400')
          ]
        }
      ]
    });
  }

  updateCharts() {
    const data = this.dashboardData();
    if (!data) return;

    // Update sales chart
    this.salesChartData.update(current => ({
      ...current,
      datasets: [
        {
          ...current.datasets[0],
          data: [
            data.today.revenue,
            data.monthly.revenue
          ]
        }
      ]
    }));

    // Update inventory chart
    const totalProducts = data.products.total;
    const lowStockCount = data.inventory.lowStockCount;
    const inStockCount = totalProducts - lowStockCount;

    this.inventoryChartData.update(current => ({
      ...current,
      datasets: [
        {
          ...current.datasets[0],
          data: [inStockCount, lowStockCount]
        }
      ]
    }));
  }

  formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR'
  }).format(amount);
}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getSalesGrowth(): number {
    const data = this.dashboardData();
    if (!data) return 0;
    const todayAvg = data.today.revenue / (data.today.salesCount || 1);
    const monthlyAvg = data.monthly.revenue / (data.monthly.salesCount || 1);
    
    if (monthlyAvg === 0) return 0;
    return ((todayAvg - monthlyAvg) / monthlyAvg) * 100;
  }
}