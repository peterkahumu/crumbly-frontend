import { useId, useState } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { TABULAR } from "@/components/charts/primitives";

/**
 * Card frame for a chart. Ships a table view of the same numbers so no value
 * is reachable only by hovering, and an explicit empty state so a chart with
 * no data never renders as a convincing chart of nothing.
 */
export default function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  legend,
  footer,
  table,
  isEmpty = false,
  emptyLabel = "No data yet",
  emptyHint,
  className = "",
  children,
}) {
  const [showTable, setShowTable] = useState(false);
  const panelId = useId();

  return (
    <section
      className={`flex min-w-0 flex-col rounded-3xl border border-cream-300 bg-white p-4 shadow-[0_1px_2px_rgba(46,27,25,0.04)] sm:p-6 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-2 font-heading text-sm font-bold text-cocoa-900 sm:text-base">
            {Icon && <Icon size={17} className="mt-0.5 shrink-0 text-terracotta-500" aria-hidden="true" />}
            <span className="min-w-0">{title}</span>
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-cocoa-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {table && !isEmpty && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              aria-expanded={showTable}
              aria-controls={panelId}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 px-2.5 py-1 text-[11px] font-semibold text-cocoa-500 transition-colors hover:bg-cream-100 hover:text-cocoa-800"
            >
              {showTable ? <BarChart3 size={12} /> : <Table2 size={12} />}
              {showTable ? "Chart" : "Table"}
            </button>
          )}
        </div>
      </header>

      {legend && !isEmpty && !showTable && <div className="mt-3">{legend}</div>}

      <div id={panelId} className="mt-4 min-w-0 flex-1">
        {isEmpty ? (
          <EmptyPlot label={emptyLabel} hint={emptyHint} />
        ) : showTable ? (
          <DataTable {...table} />
        ) : (
          children
        )}
      </div>

      {footer && !isEmpty && (
        <footer className="mt-4 border-t border-cream-100 pt-3 text-[11px] text-cocoa-500">{footer}</footer>
      )}
    </section>
  );
}

function EmptyPlot({ label, hint }) {
  return (
    <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 px-4 py-8 text-center">
      <p className="font-heading text-sm font-semibold text-cocoa-700">{label}</p>
      {hint && <p className="mt-1 max-w-xs text-xs text-cocoa-500">{hint}</p>}
    </div>
  );
}

function DataTable({ columns, rows, caption }) {
  return (
    <div className="max-h-72 overflow-auto rounded-2xl border border-cream-200">
      <table className="w-full text-left text-xs">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="sticky top-0 bg-cream-100/95 backdrop-blur-sm">
          <tr>
            {columns.map((c, i) => (
              <th key={c} scope="col" className={`px-3 py-2 font-semibold text-cocoa-500 ${i ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-1.5 ${j ? "text-right font-medium text-cocoa-800" : "text-cocoa-600"}`}
                  style={j ? TABULAR : undefined}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-4 text-center text-cocoa-400">
                Nothing in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Row-count control for the ranked lists, so the cut-off is the reader's. */
export function TopNSelect({ value, onChange, total, options = [5, 10, 25] }) {
  const choices = options.filter((n) => n < total);
  if (!choices.length) return null;
  return (
    <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-cocoa-500">
      <span className="sr-only">Rows to show</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-full border border-cream-300 bg-white px-2 py-1 text-[11px] font-semibold text-cocoa-600 outline-none transition-colors hover:border-terracotta-300 focus:border-terracotta-500"
      >
        {choices.map((n) => (
          <option key={n} value={n}>
            Top {n}
          </option>
        ))}
        <option value={total}>All {total}</option>
      </select>
    </label>
  );
}
