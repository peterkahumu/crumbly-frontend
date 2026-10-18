import { useMemo, useState } from "react";
import { INK, SERIES } from "@/lib/chartTheme";
import { barPath, niceTicks } from "@/lib/charts";
import { ChartTooltip, GridLines, TABULAR, useMeasure, useTooltip } from "@/components/charts/primitives";

const PAD = { top: 14, right: 8, bottom: 28, left: 44 };
const MAX_BAR = 24; // cap the mark; the band's leftover is air, not ink

/**
 * Columns for a small ordered set. Each column is its own hit target and
 * carries its own tooltip; neighbours are separated by a surface gap.
 */
export default function ColumnChart({
  data,
  height = 200,
  color = SERIES[0],
  formatValue = (v) => v,
  formatTick = (v) => v,
  labelEvery = 1,
  emphasisIndex = null,
  emphasisColor = SERIES[0],
  baseColor,
}) {
  const [ref, width] = useMeasure();
  const { tip, show, hide } = useTooltip();
  const [hover, setHover] = useState(null);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;

  const { ticks, scaleY, band, barW } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), 0);
    const t = niceTicks(max, 4);
    const top = t[t.length - 1] || 1;
    const sy = (v) => PAD.top + plotH - (v / top) * plotH;
    const b = data.length ? plotW / data.length : 0;
    return { ticks: t, scaleY: sy, band: b, barW: Math.min(MAX_BAR, Math.max(3, b - 6)) };
  }, [data, plotW, plotH]);

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${data.length} columns`}>
          <GridLines ticks={ticks} x={PAD.left} width={plotW} scaleY={scaleY} format={formatTick} />

          {data.map((d, i) => {
            const x = PAD.left + i * band + (band - barW) / 2;
            const y = scaleY(d.value);
            const h = PAD.top + plotH - y;
            const isEmph = emphasisIndex != null && emphasisIndex === i;
            const fill = isEmph ? emphasisColor : baseColor || d.color || color;
            return (
              <g key={d.label + i}>
                {h > 0 && (
                  <path
                    d={barPath(x, y, barW, h, 4, "up")}
                    fill={fill}
                    opacity={hover === i ? 0.82 : 1}
                    className="transition-opacity"
                  />
                )}
                {/* Hit area spans the full band, not just the painted bar */}
                <rect
                  x={PAD.left + i * band}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${d.label}: ${formatValue(d.value)}`}
                  className="cursor-default outline-none focus-visible:fill-terracotta-50"
                  onPointerEnter={() => {
                    setHover(i);
                    show(PAD.left + i * band + band / 2, y, {
                      title: d.label,
                      rows: [{ label: d.tipLabel || "Value", color: fill, value: formatValue(d.value) }].concat(
                        d.extra || []
                      ),
                    });
                  }}
                  onFocus={() => {
                    setHover(i);
                    show(PAD.left + i * band + band / 2, y, {
                      title: d.label,
                      rows: [{ label: d.tipLabel || "Value", color: fill, value: formatValue(d.value) }].concat(
                        d.extra || []
                      ),
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
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke={INK.axis}
            strokeWidth="1"
          />

          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text
                key={d.label + i}
                x={PAD.left + i * band + band / 2}
                y={height - 9}
                textAnchor="middle"
                fontSize="10"
                fill={INK.muted}
                style={TABULAR}
              >
                {d.label}
              </text>
            ) : null
          )}
        </svg>
      )}
      <ChartTooltip tip={tip} width={188} containerWidth={width} />
    </div>
  );
}
