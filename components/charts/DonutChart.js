import { useState } from "react";
import { SURFACE, INK, SERIES } from "@/lib/chartTheme";
import { arcPath, percent } from "@/lib/charts";
import { ChartTooltip, useTooltip } from "@/components/charts/primitives";

/**
 * Part-to-whole at a glance, capped at six segments. The hole carries the
 * total; segments are separated by a surface-coloured stroke.
 */
export default function DonutChart({
  segments = [],
  size = 190,
  thickness = 26,
  centerValue,
  centerLabel,
  formatValue = (v) => v,
}) {
  const { tip, show, hide } = useTooltip();
  const [hover, setHover] = useState(null);

  const safeSegments = Array.isArray(segments) ? segments : [];
  const total = safeSegments.reduce((s, x) => s + (x.value || 0), 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rInner = rOuter - thickness;

  const arcs = safeSegments
    .filter((s) => (s.value || 0) > 0)
    .reduce((acc, s, idx) => {
      const start = acc.length ? acc[acc.length - 1].end : 0;
      const color = s.color || SERIES[idx % SERIES.length] || "#c1502e";
      acc.push({ ...s, color, start, end: start + (s.value / (total || 1)) * 360 });
      return acc;
    }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={safeSegments.map((s) => `${s.label}: ${formatValue(s.value)}`).join(", ")}
      >
        {total === 0 && (
          <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="none" stroke={INK.grid} strokeWidth={thickness} />
        )}

        {arcs.map((a, i) => (
          <path
            key={a.label}
            d={arcPath(cx, cy, rOuter, rInner, a.start, a.end)}
            fill={a.color}
            stroke={SURFACE}
            strokeWidth="2"
            tabIndex={0}
            role="button"
            aria-label={`${a.label}: ${formatValue(a.value)}`}
            className="origin-center cursor-default outline-none transition-opacity"
            opacity={hover == null || hover === i ? 1 : 0.5}
            onPointerEnter={(e) => {
              setHover(i);
              const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
              show(cx, cy - rOuter, {
                title: a.label,
                rows: [
                  { label: "Count", color: a.color, value: formatValue(a.value) },
                  { label: "Share", value: `${percent(a.value, total, 1)}%` },
                ],
              });
              void box;
            }}
            onFocus={() => {
              setHover(i);
              show(cx, cy - rOuter, {
                title: a.label,
                rows: [
                  { label: "Count", color: a.color, value: formatValue(a.value) },
                  { label: "Share", value: `${percent(a.value, total, 1)}%` },
                ],
              });
            }}
            onPointerLeave={() => {
              setHover(null);
              hide();
            }}
            onBlur={() => {
              setHover(null);
              hide();
            }}
          />
        ))}

        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="font-heading"
          fontSize="26"
          fontWeight="700"
          fill={INK.primary}
        >
          {centerValue ?? total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill={INK.muted}>
          {centerLabel}
        </text>
      </svg>
      <ChartTooltip tip={tip} width={176} containerWidth={size} />
    </div>
  );
}
