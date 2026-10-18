import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { NEUTRAL, SERIES, STATUS } from "@/lib/chartTheme";
import { smoothPath } from "@/lib/charts";

/**
 * Label, value, an optional delta against a named period, and an optional
 * sparkline. Delta colour is direction x `upIsGood`, and always ships an arrow
 * so direction never rests on colour alone.
 */
export default function StatTile({
  label,
  value,
  delta,
  deltaLabel = "vs previous period",
  trend,
  icon: Icon,
  upIsGood = true,
  accent = SERIES[0],
  hero = false,
}) {
  const dir = delta?.dir;
  const isGood = dir === "up" ? upIsGood : !upIsGood;
  const deltaColor = !delta || delta.pct === null ? "text-cocoa-400" : isGood ? "text-[#006300]" : "text-[#b3272a]";
  const DeltaIcon = !delta || delta.pct === null ? Minus : dir === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-cream-300 bg-white p-4 shadow-[0_1px_2px_rgba(46,27,25,0.03)] transition-shadow hover:shadow-[0_2px_10px_rgba(46,27,25,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-cocoa-500">{label}</p>
        {Icon && (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${accent}14`, color: accent }}
            aria-hidden="true"
          >
            <Icon size={14} />
          </span>
        )}
      </div>

      <p
        className={`mt-2 font-heading font-bold leading-none text-cocoa-900 ${
          hero ? "text-4xl sm:text-[2.75rem]" : "text-xl sm:text-2xl"
        }`}
      >
        {value}
      </p>

      <div className="mt-2 flex items-end justify-between gap-2">
        {delta ? (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${deltaColor}`}>
            <DeltaIcon size={13} aria-hidden="true" />
            {delta.pct === null ? "new" : `${Math.abs(delta.pct)}%`}
            <span className="ml-1 font-medium text-cocoa-400">{deltaLabel}</span>
          </span>
        ) : (
          <span />
        )}
        {trend?.length > 1 && <Sparkline values={trend} accent={accent} />}
      </div>
    </div>
  );
}

/** Compact context line: muted stroke, accent end-dot, no axis. */
export function Sparkline({ values, accent = SERIES[0], width = 62, height = 22 }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => ({
    x: i * step,
    y: height - 3 - ((v - min) / span) * (height - 6),
  }));
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} aria-hidden="true" className="shrink-0 overflow-visible">
      <path d={smoothPath(points)} fill="none" stroke={NEUTRAL} strokeWidth="2" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="3" fill={accent} stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}

/** A single ratio against a limit; the track is a lighter step of the fill. */
export function Meter({ label, value, max = 100, formatValue = (v) => `${v}%`, tone = "accent" }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const fill = tone === "warning" ? STATUS.warning : tone === "critical" ? STATUS.critical : SERIES[0];

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-cocoa-500">{label}</span>
        <span className="font-heading text-sm font-bold text-cocoa-900">{formatValue(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-[3px]" style={{ background: `${fill}24` }}>
        <div
          className="h-full rounded-r-[3px] transition-[width] duration-700"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}
