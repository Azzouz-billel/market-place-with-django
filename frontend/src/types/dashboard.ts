import type { Order } from "./order";

export interface LowStockVariant {
  id: number;
  product_name: string;
  product_slug: string;
  name: string;
  sku: string;
  stock_quantity: number;
}

export interface DashboardStats {
  revenue: string;
  orders_total: number;
  orders_by_status: Record<string, number>;
  products_total: number;
  products_active: number;
  customers: number;
  subscribers: number;
  low_stock: LowStockVariant[];
  recent_orders: Order[];
}

export interface DashboardVariant {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
}

export interface DashboardProduct {
  id: number;
  name: string;
  slug: string;
  base_price: string;
  is_active: boolean;
  category_name: string;
  total_stock: number;
  variants: DashboardVariant[];
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  date_joined: string;
  order_count: number;
}

export interface PaginatedOrders {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}
