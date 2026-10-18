import { SERIES, INK } from "@/lib/chartTheme";
import { arcPath } from "@/lib/charts";

/** One rate against its limit as a 240-degree arc, with the value in the middle. */
export default function RadialGauge({
  value,
  max = 100,
  size = 168,
  thickness = 14,
  label,
  caption,
  color = SERIES[0],
  formatValue = (v) => `${Math.round(v)}%`,
}) {
  const SWEEP = 240;
  const START = 180 - SWEEP / 2 + 180;
  const ratio = Math.max(0, Math.min(1, value / (max || 1)));
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 2;
  const rInner = rOuter - thickness;

  return (
    <figure className="flex flex-col items-center">
      <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.86}`} role="img" aria-label={`${label}: ${formatValue(value)}`}>
        <path
          d={arcPath(cx, cy, rOuter, rInner, START, START + SWEEP)}
          fill={`${color}1f`}
        />
        {ratio > 0 && (
          <path
            d={arcPath(cx, cy, rOuter, rInner, START, START + SWEEP * ratio)}
            fill={color}
            className="transition-all duration-700"
          />
        )}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          className="font-heading"
          fontSize="30"
          fontWeight="700"
          fill={INK.primary}
        >
          {formatValue(value)}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="10" fill={INK.muted}>
          {label}
        </text>
      </svg>
      {caption && <figcaption className="-mt-1 text-center text-[11px] text-cocoa-500">{caption}</figcaption>}
    </figure>
  );
}
