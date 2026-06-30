import type { ProductImage } from "./catalog";

export interface CartLineVariant {
  id: number;
  name: string;
  sku: string;
  effective_price: string;
  stock_quantity: number;
  in_stock: boolean;
  product_name: string;
  product_slug: string;
  product_image: ProductImage | null;
}

export interface CartItem {
  id: number;
  variant: CartLineVariant;
  quantity: number;
  line_total: string;
}

export interface Cart {
  token: string | null;
  items: CartItem[];
  subtotal: string;
  discount: string;
  total: string;
  coupon_code: string | null;
  total_quantity: number;
}
