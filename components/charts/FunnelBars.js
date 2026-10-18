import { ORDINAL, inkOn, INK } from "@/lib/chartTheme";
import { percent } from "@/lib/charts";

/** Ordered stages on a one-hue ramp, with the carry-over rate between rows. */
export default function FunnelBars({ stages, exit }) {
  const top = Math.max(stages[0]?.count || 0, 1);

  return (
    <div className="min-w-0">
      <ol className="space-y-2">
        {stages.map((stage, i) => {
          const width = Math.max(percent(stage.count, top, 1), stage.count > 0 ? 4 : 0);
          const color = ORDINAL[Math.min(i, ORDINAL.length - 1)];
          const carried = i === 0 ? null : percent(stage.count, stages[i - 1].count || 0, 0);
          const labelFits = width > 34;

          return (
            <li key={stage.label}>
              {i > 0 && (
                <p className="mb-1 pl-1 text-[10px] font-medium text-cocoa-400">
                  ↓ {stages[i - 1].count ? `${carried}% carried over` : "—"}
                </p>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-7 min-w-0 flex-1 overflow-hidden rounded-[4px] bg-cream-200/60">
                  <div
                    className="flex h-full items-center justify-end rounded-r-[4px] px-2 transition-[width] duration-700 ease-out"
                    style={{ width: `${width}%`, background: color }}
                  >
                    {labelFits && (
                      <span className="font-heading text-[11px] font-bold" style={{ color: inkOn(color) }}>
                        {stage.count}
                      </span>
                    )}
                  </div>
                </div>
                <span className="w-20 shrink-0 truncate text-[11px] font-semibold text-cocoa-700 sm:w-28">
                  {stage.label}
                  {!labelFits && <span className="ml-1 font-bold text-cocoa-900">{stage.count}</span>}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {exit && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-cream-200 bg-cream-50/70 px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-cocoa-600">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: exit.color || INK.muted }}
            />
            <span className="truncate">{exit.label}</span>
          </span>
          <span className="font-heading text-xs font-bold text-cocoa-900">{exit.count}</span>
        </div>
      )}
    </div>
  );
}
