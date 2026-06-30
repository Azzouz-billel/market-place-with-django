import type {
  Category,
  Paginated,
  ProductDetail,
  ProductListItem,
} from "@/types/catalog";

const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000/api";

// fetch is uncached by default in Next.js 16, so each request hits the API
// fresh — appropriate for a catalog driven by URL filters.
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API request failed (${res.status}): ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface ProductQuery {
  category?: string;
  search?: string;
  ordering?: string;
  min_price?: string;
  max_price?: string;
  page?: string;
}

function toQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function getProducts(query: ProductQuery = {}): Promise<Paginated<ProductListItem>> {
  return apiGet<Paginated<ProductListItem>>(`/products/${toQueryString(query)}`);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const res = await fetch(`${API_BASE}/products/${slug}/`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`API request failed (${res.status}): /products/${slug}/`);
  }
  return res.json() as Promise<ProductDetail>;
}

export async function getCategories(): Promise<Category[]> {
  const data = await apiGet<Paginated<Category>>("/categories/");
  return data.results;
}

/** Every active product slug, following pagination — used to build the sitemap. */
export async function getAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let url: string | null = `${API_BASE}/products/`;
  try {
    while (url) {
      const res = await fetch(url);
      if (!res.ok) {
        break;
      }
      const page: Paginated<ProductListItem> = await res.json();
      slugs.push(...page.results.map((product) => product.slug));
      url = page.next;
    }
  } catch {
    // API unreachable (e.g. during an isolated build) — return what we have.
  }
  return slugs;
}
