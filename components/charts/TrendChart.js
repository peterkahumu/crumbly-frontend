import { useMemo, useState } from "react";
import { INK, SURFACE } from "@/lib/chartTheme";
import { areaFromLine, niceTicks, smoothPath } from "@/lib/charts";
import { ChartTooltip, EndDot, GridLines, TABULAR, useMeasure, useTooltip } from "@/components/charts/primitives";

const PAD = { top: 14, right: 14, bottom: 26, left: 50 };

/**
 * Time series on one y-axis; every series must share a unit. The crosshair
 * snaps to the nearest x and reads out all series there, and arrow keys walk
 * the same positions.
 */
export default function TrendChart({
  data = [],
  series = [],
  height = 230,
  formatValue = (v) => v,
  formatTick = (v) => v,
  labelEvery,
}) {
  const [ref, width] = useMeasure();
  const { tip, show, hide } = useTooltip();
  const [focusIndex, setFocusIndex] = useState(null);

  const safeData = Array.isArray(data) ? data : [];
  const safeSeries = Array.isArray(series) ? series : [];

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;

  const { ticks, scaleY, xAt, geometry } = useMemo(() => {
    const max = Math.max(
      ...safeData.flatMap((d) => (d && Array.isArray(d.values) ? d.values.map((v) => v || 0) : [])),
      0
    );
    const t = niceTicks(max, 4);
    const top = t[t.length - 1] || 1;
    const sy = (v) => PAD.top + plotH - (v / top) * plotH;
    const step = safeData.length > 1 ? plotW / (safeData.length - 1) : 0;
    const x = (i) => PAD.left + (safeData.length > 1 ? i * step : plotW / 2);

    const geo = safeSeries.map((s, si) => {
      const pts = safeData.map((d, i) => ({ x: x(i), y: sy(d?.values?.[si] || 0) }));
      const line = smoothPath(pts);
      return { ...s, points: pts, line, area: areaFromLine(line, pts, PAD.top + plotH) };
    });

    return { ticks: t, scaleY: sy, xAt: x, geometry: geo };
  }, [safeData, safeSeries, plotW, plotH]);

  const active = focusIndex;

  function pointerIndex(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const rel = event.clientX - box.left - PAD.left;
    if (safeData.length < 2) return 0;
    const step = plotW / (safeData.length - 1);
    return Math.max(0, Math.min(safeData.length - 1, Math.round(rel / step)));
  }

  function readout(i) {
    if (!safeData[i]) return;
    const values = Array.isArray(safeData[i].values) ? safeData[i].values : [];
    show(xAt(i), scaleY(Math.max(...values.map((v) => v || 0), 0)), {
      title: safeData[i].label,
      rows: safeSeries.map((s, si) => ({
        label: s.label,
        color: s.color,
        value: formatValue(values[si] || 0),
      })),
    });
    setFocusIndex(i);
  }

  const tickEvery = labelEvery ?? Math.max(1, Math.ceil(safeData.length / 7));

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${safeSeries.map((s) => s.label).join(" and ")} over ${safeData.length} points`}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-terracotta-300 focus-visible:ring-offset-2 rounded-xl"
          onPointerMove={(e) => readout(pointerIndex(e))}
          onPointerLeave={() => {
            hide();
            setFocusIndex(null);
          }}
          onFocus={() => readout(safeData.length - 1)}
          onBlur={() => {
            hide();
            setFocusIndex(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const next = Math.max(
              0,
              Math.min(safeData.length - 1, (focusIndex ?? safeData.length - 1) + (e.key === "ArrowRight" ? 1 : -1))
            );
            readout(next);
          }}
        >
          <defs>
            {geometry.map((g, i) => (
              <linearGradient key={i} id={`trend-wash-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={g.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={g.color} stopOpacity="0.01" />
              </linearGradient>
            ))}
          </defs>

          <GridLines ticks={ticks} x={PAD.left} width={plotW} scaleY={scaleY} format={formatTick} />

          {geometry.map((g, i) =>
            g.type === "area" ? <path key={`a${i}`} d={g.area} fill={`url(#trend-wash-${i})`} /> : null
          )}

          {geometry.map((g, i) => (
            <path
              key={`l${i}`}
              d={g.line}
              fill="none"
              stroke={g.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={g.type === "trend" ? "0" : undefined}
              opacity={g.type === "trend" ? 0.9 : 1}
            />
          ))}

          {/* Crosshair */}
          {active != null && (
            <g aria-hidden="true">
              <line
                x1={xAt(active)}
                x2={xAt(active)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke={INK.axis}
                strokeWidth="1"
              />
              {geometry.map((g, i) => {
                const pt = g.points[active];
                if (!pt) return null;
                return (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="4.5"
                    fill={g.color}
                    stroke={SURFACE}
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* Resting state: mark the latest value */}
          {active == null &&
            geometry.map((g, i) => {
              const lastPt = g.points[g.points.length - 1];
              if (!lastPt) return null;
              return <EndDot key={i} x={lastPt.x} y={lastPt.y} color={g.color} />;
            })}

          <line
            x1={PAD.left}
            x2={PAD.left + plotW}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke={INK.axis}
            strokeWidth="1"
          />

          {safeData.map((d, i) =>
            i % tickEvery === 0 || i === safeData.length - 1 ? (
              <text
                key={(d?.label || "") + i}
                x={xAt(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === safeData.length - 1 ? "end" : "middle"}
                fontSize="10"
                fill={INK.muted}
                style={TABULAR}
              >
                {d?.label}
              </text>
            ) : null
          )}
        </svg>
      )}
      <ChartTooltip tip={tip} width={196} containerWidth={width} />
    </div>
  );
}
