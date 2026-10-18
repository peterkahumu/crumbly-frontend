import { useState } from "react";
import { SURFACE } from "@/lib/chartTheme";
import { percent } from "@/lib/charts";

/**
 * Part-to-whole as one stacked bar, for a two- or three-way split. Segments
 * are separated by a surface gap; a segment too narrow for its percentage
 * keeps the number in the legend below.
 */
export default function ShareBar({ segments, height = 34, formatValue = (v) => v }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const [hover, setHover] = useState(null);

  if (!total) return null;

  return (
    <div>
      <div
        className="flex w-full overflow-hidden rounded-[5px]"
        style={{ height, background: SURFACE }}
        role="img"
        aria-label={segments.map((s) => `${s.label} ${formatValue(s.value)}`).join(", ")}
      >
        {segments.map((s, i) => {
          const pct = percent(s.value, total, 1);
          if (!s.value) return null;
          return (
            <div
              key={s.label}
              tabIndex={0}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              title={`${s.label}: ${formatValue(s.value)} (${pct}%)`}
              className="flex items-center justify-center outline-none transition-opacity first:rounded-l-[5px] last:rounded-r-[5px]"
              style={{
                width: `${pct}%`,
                background: s.color,
                marginLeft: i === 0 ? 0 : 2,
                opacity: hover == null || hover === i ? 1 : 0.55,
              }}
            >
              {pct >= 14 && (
                <span className="font-heading text-[11px] font-bold text-white drop-shadow-sm">{pct}%</span>
              )}
            </div>
          );
        })}
      </div>

      <ul className="mt-3 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
              <span className="truncate font-medium text-cocoa-600">{s.label}</span>
            </span>
            <span className="shrink-0 font-heading font-bold text-cocoa-900">
              {formatValue(s.value)}
              <span className="ml-1.5 font-sans text-[11px] font-medium text-cocoa-400">
                {percent(s.value, total, 0)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
