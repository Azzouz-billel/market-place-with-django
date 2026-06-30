import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ImageGallery from "@/components/ImageGallery";
import ProductGrid from "@/components/ProductGrid";
import ProductReviews from "@/components/ProductReviews";
import VariantSelector from "@/components/VariantSelector";
import WishlistButton from "@/components/WishlistButton";
import { getProduct } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  const title = product.meta_title || product.name;
  const description = product.meta_description || product.description.slice(0, 160);
  const images = product.primary_image ? [product.primary_image.image] : [];
  const canonical = `/products/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    notFound();
  }

  const inStock = product.variants.some((variant) => variant.in_stock);
  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => image.image),
    category: product.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.base_price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/products/${slug}`,
    },
  };
  if (product.review_count > 0 && product.average_rating !== null) {
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.average_rating,
      reviewCount: product.review_count,
    };
  }

  return (
    <div className="flex flex-col gap-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-wide text-muted">{product.category.name}</p>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
              <WishlistButton slug={product.slug} />
            </div>
            <p className="text-2xl font-semibold">{formatPrice(product.base_price)}</p>
          </div>

          {product.description && (
            <p className="leading-relaxed text-muted">{product.description}</p>
          )}

          {product.variants.length > 0 ? (
            <VariantSelector variants={product.variants} />
          ) : (
            <p className="text-sm text-muted">No options available.</p>
          )}
        </div>
      </div>

      <ProductReviews
        slug={product.slug}
        initialAverage={product.average_rating}
        initialCount={product.review_count}
      />

      {product.related.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">You might also like</h2>
          <ProductGrid products={product.related} />
        </section>
      )}
    </div>
  );
}
