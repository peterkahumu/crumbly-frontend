import { DIVERGING, INK } from "@/lib/chartTheme";

/**
 * Bars either side of a shared zero: which side of the baseline, and by how
 * much. Both arms carry the same unit, so the two sides are comparable.
 *
 * Clean 3-zone layout with guaranteed bounding:
 * [ Label (left) ] [ Central Diverging Bar with 0-axis ] [ Value Badge (right) ]
 *
 * Ensures long labels never overflow the card, bars never push text out of bounds,
 * and numbers never collide with labels.
 */
export default function DivergingBars({
  items,
  positiveLabel = "Under-supplied",
  negativeLabel = "Over-supplied",
  formatValue = (v) => `${v > 0 ? "+" : ""}${v}`,
}) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);

  return (
    <div className="w-full min-w-0">
      {/* Legend & Direction indicators */}
      <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-semibold text-cocoa-500">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-emerald-50/80 px-2.5 py-1 text-emerald-800 border border-emerald-200/60 shadow-xs">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
          <span className="truncate">{negativeLabel}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-terracotta-50/80 px-2.5 py-1 text-terracotta-800 border border-terracotta-200/60 shadow-xs">
          <span className="truncate">{positiveLabel}</span>
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-terracotta-600" />
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const width = (Math.abs(item.value) / max) * 50;
          const positive = item.value >= 0;
          const isZero = item.value === 0;

          return (
            <li
              key={item.label}
              className="flex items-center gap-2 sm:gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-cream-50"
              title={`${item.label}: ${formatValue(item.value)}`}
            >
              {/* Category Label Column */}
              <span className="w-28 sm:w-36 md:w-44 shrink-0 truncate text-xs font-semibold text-cocoa-800">
                {item.label}
              </span>

              {/* Central Diverging Bar Plot */}
              <div className="relative h-4 min-w-0 flex-1 overflow-hidden rounded-md bg-cream-200/60">
                {/* 0-Axis Center Divider */}
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-cocoa-300/80 z-10"
                />

                {/* Left/Right Bar */}
                {!isZero && (
                  <div
                    className="absolute inset-y-0 transition-all duration-500 ease-out"
                    style={{
                      background: positive ? DIVERGING.positive : DIVERGING.negative,
                      width: `${Math.max(width, 2)}%`,
                      left: positive ? "50%" : `${50 - width}%`,
                      borderRadius: positive ? "0 4px 4px 0" : "4px 0 0 4px",
                    }}
                  />
                )}
              </div>

              {/* Value Badge Column */}
              <span
                className={`w-16 sm:w-20 shrink-0 text-right font-heading text-xs font-bold tabular-nums rounded-full px-2.5 py-0.5 ${
                  isZero
                    ? "text-cocoa-400 bg-cream-100"
                    : positive
                    ? "text-terracotta-700 bg-terracotta-50 border border-terracotta-200/60"
                    : "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                }`}
              >
                {formatValue(item.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
