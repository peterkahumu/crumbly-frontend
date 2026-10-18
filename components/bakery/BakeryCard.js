import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

export default function BakeryCard({ bakery }) {
  return (
    <Link
      href={`/bakery/${bakery.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative h-32 w-full overflow-hidden bg-cream-200 sm:h-40">
        {bakery.coverImageUrl && (
          <Image
            src={bakery.coverImageUrl}
            alt={bakery.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex items-center gap-3 p-4">
        <Avatar name={bakery.name} src={bakery.logoUrl} size={44} className="-mt-8 border-4 border-white shadow" />
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold text-cocoa-800">{bakery.name}</p>
          <p className="flex items-center gap-1 text-xs text-cocoa-400">
            <MapPin size={12} /> {bakery.city}
            {bakery._count?.cakes != null && <span>· {bakery._count.cakes} cakes</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
