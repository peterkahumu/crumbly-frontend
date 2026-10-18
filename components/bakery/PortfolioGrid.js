import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import { ImageOff } from "lucide-react";

export default function PortfolioGrid({ items }) {
  if (!items?.length) {
    return <EmptyState icon={ImageOff} title="No portfolio photos yet" description="This baker hasn't shared past work yet — check back soon." />;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <figure key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-cream-200">
          <Image
            src={item.imageUrl}
            alt={item.caption || "Portfolio photo"}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {item.caption && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
