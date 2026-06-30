export interface OrderItem {
  id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface Order {
  reference: string;
  email: string;
  status: string;
  subtotal: string;
  discount: string;
  coupon_code: string;
  total: string;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  phone: string;
}
