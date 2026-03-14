// interfaces/dashboard.interface.ts
import { Product } from './product.interface';
import { Customer } from './customer.Interface';
import { Sale } from './sale.Interface';

export interface PeriodStats {
  revenue: number;
  salesCount: number;
  profit: number;
  itemsSold?: number;
  averageOrderValue?: number;
}

export interface TodayStats extends PeriodStats {
  itemsSold: number;
  averageOrderValue: number;
}

export interface WeekStats extends PeriodStats {}

export interface MonthStats extends PeriodStats {}

export interface YearStats extends PeriodStats {}

export interface LowStockProduct {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  minStockLevel: number;
  images: string[];
}

export interface TopProduct {
  _id: string;
  name: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  image?: string;
}

export interface InventorySummary {
  lowStockCount: number;
  lowStockProducts: LowStockProduct[];
  totalProducts: number;
  totalStock: number;
  inventoryValue: number;
  retailValue: number;
  potentialProfit: number;
}

export interface CustomerStats {
  total: number;
  totalLifetimeValue: number;
  averagePurchase: number;
  recentCustomers: Customer[];
}

export interface PendingCredit {
  total: number;
  count: number;
}

export interface PaymentMethodBreakdown {
  _id: string;
  total: number;
  count: number;
}

export interface DailySale {
  _id: string;
  revenue: number;
  salesCount: number;
}

export interface RecentSaleWithProfit {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  saleDate: string;
  paymentMethod: string;
  paymentStatus: string;
  customer?: { _id: string; name: string };
  totalProfit: number;
}

export interface DashboardData {
  today: TodayStats;
  week: WeekStats;
  month: MonthStats;
  year: YearStats;
  inventory: InventorySummary;
  customers: CustomerStats;
  topProducts: TopProduct[];
  recentSales: RecentSaleWithProfit[];
  pendingCreditAmount: PendingCredit;
  salesByPaymentMethod: PaymentMethodBreakdown[];
  dailySales: DailySale[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface SalesChartData {
  _id: string;
  revenue: number;
  salesCount: number;
}

export interface SalesChartResponse {
  success: boolean;
  data: SalesChartData[];
}

export interface SummaryCards {
  todayRevenue: number;
  todaySalesCount: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  pendingPayments: number;
}

export interface SummaryCardsResponse {
  success: boolean;
  data: SummaryCards;
}