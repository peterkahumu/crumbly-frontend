import { SERIES } from "@/lib/chartTheme";
import { formatPrice } from "@/lib/currency";

/** Ranked cake list with a photo, units sold and a revenue track. */
export default function CakeLeaderboard({ cakes, secondary = () => null }) {
  const max = Math.max(...cakes.map((c) => c.revenue), 1);

  return (
    <ol className="space-y-2.5">
      {cakes.map((cake, i) => {
        const sub = secondary(cake);
        return (
          <li
            key={`${cake.name}-${i}`}
            className="flex items-center gap-3 rounded-2xl border border-cream-100 bg-cream-50/40 p-2.5 transition-colors hover:bg-cream-100/60"
          >
            <span className="w-4 shrink-0 text-center text-[11px] font-bold text-cocoa-300">{i + 1}</span>
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-cream-200">
              {cake.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cake.image} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate font-heading text-xs font-bold text-cocoa-900">{cake.name}</span>
                <span className="shrink-0 font-heading text-xs font-bold text-cocoa-900">
                  {formatPrice(cake.revenue)}
                </span>
              </span>
              <span className="mb-1.5 mt-0.5 block truncate text-[11px] text-cocoa-400">
                {cake.qty} sold{sub ? ` · ${sub}` : ""}
              </span>
              <span className="block h-1.5 w-full overflow-hidden rounded-[3px] bg-cream-200/70">
                <span
                  className="block h-full rounded-r-[3px]"
                  style={{ width: `${(cake.revenue / max) * 100}%`, background: SERIES[0] }}
                />
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
