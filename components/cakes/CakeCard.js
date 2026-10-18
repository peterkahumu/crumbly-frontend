import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import Badge from "@/components/ui/Badge";

export default function CakeCard({ cake, bakerySlug, bakeryName }) {
  const image = cake.images?.[0];
  const hasDiscount = cake.discountPrice && cake.discountPrice < cake.price;

  return (
    <Link
      href={`/bakery/${bakerySlug}/cakes/${cake.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-cream-200">
        {image && (
          <Image
            src={image}
            alt={cake.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {hasDiscount && (
          <Badge tone="brand" className="absolute left-2 top-2">
            Sale
          </Badge>
        )}
        {!cake.isAvailable && (
          <span className="absolute inset-0 flex items-center justify-center bg-cocoa-900/50 text-sm font-semibold text-white">
            Sold out
          </span>
        )}
        {cake.isFeatured && (
          <Badge tone="warning" className="absolute right-2 top-2 gap-1">
            <Star size={11} className="fill-current" /> Featured
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {bakeryName && <p className="truncate text-xs font-medium text-cocoa-400">{bakeryName}</p>}
        <p className="line-clamp-2 font-heading text-sm font-semibold text-cocoa-800">{cake.name}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-heading text-base font-bold text-terracotta-600">
            {formatPrice(cake.discountPrice ?? cake.price)}
          </span>
          {hasDiscount && <span className="text-xs text-cocoa-300 line-through">{formatPrice(cake.price)}</span>}
        </div>
      </div>
    </Link>
  );
}
