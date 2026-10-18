import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { INK, SURFACE } from "@/lib/chartTheme";

/**
 * Measures a container's rendered width. Charts draw at real pixel size rather
 * than being scaled by a viewBox, so labels hold their type size at every
 * breakpoint. Returns 0 until measured; callers skip drawing until then.
 */
export function useMeasure() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

/** Tooltip state, driven from both pointermove and focus. */
export function useTooltip() {
  const [tip, setTip] = useState(null);
  const show = useCallback((x, y, content) => setTip({ x, y, content }), []);
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
}

/**
 * Floating readout: value leads, series name follows, keyed by a colour stroke.
 * Clamped to the plot so it never spills out of the card on a narrow screen.
 */
export function ChartTooltip({ tip, width = 176, containerWidth = 0 }) {
  if (!tip) return null;
  const { x, y, content } = tip;
  const half = width / 2;
  const left = containerWidth ? Math.min(Math.max(x, half), Math.max(containerWidth - half, half)) : x;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute z-20 max-w-full rounded-xl border border-cream-300 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      style={{
        left,
        top: Math.max(y, 0),
        width,
        transform: "translate(-50%, calc(-100% - 12px))",
      }}
    >
      {content.title && (
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-cocoa-500">{content.title}</p>
      )}
      <ul className="space-y-1">
        {content.rows.map((row, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5">
              {row.color && (
                <span
                  className="h-0.5 w-3 shrink-0 rounded-full"
                  style={{ background: row.color }}
                  aria-hidden="true"
                />
              )}
              <span className="truncate text-[11px] text-cocoa-500">{row.label}</span>
            </span>
            <span className="shrink-0 font-heading text-xs font-bold text-cocoa-900">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Legend for two or more series. The swatch mirrors the mark it names. */
export function Legend({ items, shape = "rect", className = "" }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={shape === "line" ? "h-0.5 w-4 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"}
            style={{ background: item.color }}
          />
          <span className="text-[11px] font-medium text-cocoa-500">{item.label}</span>
          {item.value != null && (
            <span className="text-[11px] font-bold text-cocoa-800">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Recessive hairline gridlines. */
export function GridLines({ ticks, x, width, scaleY, format }) {
  return (
    <g aria-hidden="true">
      {ticks.map((t) => {
        const y = scaleY(t);
        return (
          <g key={t}>
            <line x1={x} x2={x + width} y1={y} y2={y} stroke={INK.grid} strokeWidth="1" />
            <text x={x - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill={INK.muted} style={TABULAR}>
              {format ? format(t) : t}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Tabular figures for numbers that align vertically. */
export const TABULAR = { fontVariantNumeric: "tabular-nums" };

/** End-dot with a surface ring so it stays legible over other marks. */
export function EndDot({ x, y, color, r = 4.5 }) {
  return <circle cx={x} cy={y} r={r} fill={color} stroke={SURFACE} strokeWidth="2" />;
}
