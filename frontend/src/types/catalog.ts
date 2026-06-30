// Mirrors the Django REST Framework catalog serializers.
// Note: DRF serializes DecimalField as a string (e.g. "24.00").

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  description: string;
  image: string | null;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price_override: string | null;
  effective_price: string;
  stock_quantity: number;
  in_stock: boolean;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  base_price: string;
  category: Category;
  primary_image: ProductImage | null;
  average_rating: number | null;
  review_count: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  author: string;
  created_at: string;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  images: ProductImage[];
  variants: ProductVariant[];
  meta_title: string;
  meta_description: string;
  created_at: string;
  related: ProductListItem[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
