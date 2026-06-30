"use client";

import Image from "next/image";
import { useState } from "react";

import type { ProductImage } from "@/types/catalog";

export default function ImageGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-base border border-border bg-card text-muted">
        No image available
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-base border border-border bg-card">
        <Image
          src={active.image}
          alt={active.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3" role="list">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-16 overflow-hidden rounded-base border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  index === activeIndex ? "border-accent" : "border-border"
                }`}
              >
                <Image
                  src={image.image}
                  alt={image.alt_text || `${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
