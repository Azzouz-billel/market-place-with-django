import Image from "next/image";
import Link from "next/link";

import Stars from "@/components/Stars";
import WishlistButton from "@/components/WishlistButton";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/types/catalog";

export default function ProductCard({ product }: { product: ProductListItem }) {
  const image = product.primary_image;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-base border border-border bg-card transition-shadow hover:shadow-md">
      <div className="absolute right-2 top-2 z-10">
        <WishlistButton slug={product.slug} />
      </div>
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="relative aspect-square overflow-hidden bg-background">
        {image ? (
          <Image
            src={image.image}
            alt={image.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs uppercase tracking-wide text-muted">{product.category.name}</p>
        <h3 className="font-medium leading-snug">{product.name}</h3>
        {product.review_count > 0 && product.average_rating !== null && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Stars rating={product.average_rating} />
            <span>({product.review_count})</span>
          </p>
        )}
        <p className="mt-auto pt-2 font-semibold">{formatPrice(product.base_price)}</p>
        </div>
      </Link>
    </div>
  );
}
