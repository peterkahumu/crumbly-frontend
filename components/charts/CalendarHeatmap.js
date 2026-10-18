import { useState } from "react";
import { SEQUENTIAL, heatStep, INK } from "@/lib/chartTheme";
import { ChartTooltip, useTooltip } from "@/components/charts/primitives";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Weekday x week activity grid on a sequential ramp, palest for zero. Each
 * cell is its own hit target and carries its date and count.
 */
export default function CalendarHeatmap({ weeks = [], cellSize = 15, gap = 4, formatValue = (v) => v }) {
  const { tip, show, hide } = useTooltip();
  const [hover, setHover] = useState(null);

  const safeWeeks = Array.isArray(weeks) ? weeks : [];
  const max = Math.max(
    ...safeWeeks.flatMap((w) => (w && Array.isArray(w.days) ? w.days.map((d) => (d ? d.value : 0)) : [])),
    1
  );
  const width = safeWeeks.length * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="flex shrink-0 flex-col justify-between pt-[1px] text-[9px] text-cocoa-400">
          {WEEKDAYS.map((d, i) => (
            <span key={d} style={{ height: cellSize, lineHeight: `${cellSize}px` }}>
              {i % 2 === 1 ? d : ""}
            </span>
          ))}
        </div>

        <div className="shrink-0">
          <svg width={width} height={height} role="img" aria-label="Daily order activity">
            {safeWeeks.map((week, wi) =>
              (week && Array.isArray(week.days) ? week.days : []).map((day, di) => {
                if (!day) return null;
                const key = `${wi}-${di}`;
                const t = day.value / max;
                const fill = day.value > 0 ? heatStep(t) : SEQUENTIAL[0];
                return (
                  <rect
                    key={key}
                    x={wi * (cellSize + gap)}
                    y={di * (cellSize + gap)}
                    width={cellSize}
                    height={cellSize}
                    rx="3.5"
                    fill={fill}
                    stroke={hover === key ? INK.secondary : "transparent"}
                    strokeWidth="1.5"
                    tabIndex={day.value > 0 ? 0 : -1}
                    aria-label={`${day.label}: ${formatValue(day.value)}`}
                    className="cursor-default outline-none"
                    onPointerEnter={() => {
                      setHover(key);
                      show(wi * (cellSize + gap) + cellSize / 2 + 34, di * (cellSize + gap), {
                        title: day.label,
                        rows: [{ label: "Orders", color: fill, value: formatValue(day.value) }].concat(
                          day.extra || []
                        ),
                      });
                    }}
                    onFocus={() => {
                      setHover(key);
                      show(wi * (cellSize + gap) + cellSize / 2 + 34, di * (cellSize + gap), {
                        title: day.label,
                        rows: [{ label: "Orders", color: fill, value: formatValue(day.value) }].concat(
                          day.extra || []
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
                );
              })
            )}
          </svg>
          <div className="mt-1 flex justify-between text-[9px] text-cocoa-400">
            <span>{safeWeeks[0]?.label}</span>
            <span>{safeWeeks[safeWeeks.length - 1]?.label}</span>
          </div>
        </div>
      </div>

      {/* Scale legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-cocoa-400">Quieter</span>
        {SEQUENTIAL.slice(0, 7).map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} aria-hidden="true" />
        ))}
        <span className="text-[10px] text-cocoa-400">Busier</span>
      </div>

      <ChartTooltip tip={tip} width={176} />
    </div>
  );
}
