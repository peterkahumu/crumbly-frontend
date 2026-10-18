import Image from "next/image";
import { getInitials, colorFromString } from "@/lib/initials";

/**
 * Bakery avatar — shows the logo photo if the baker uploaded one, otherwise
 * falls back to a colored initials badge (most small bakers won't have a
 * logo on day one).
 */
export default function Avatar({ name, src, size = 48, className = "" }) {
  const dimension = `${size}px`;

  if (src) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-cream-200 ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        <Image src={src} alt={name ?? "Bakery"} fill sizes={dimension} className="object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-heading font-semibold text-cream-50 ${className}`}
      style={{ width: dimension, height: dimension, background: colorFromString(name ?? "?"), fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </span>
  );
}
