import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CalendarRange, FileSpreadsheet, FileText, RotateCcw } from "lucide-react";
import { DEFAULT_RANGE, RANGE_PRESETS } from "@/lib/dashboardFilters";

const CONTROL =
  "h-9 rounded-xl border border-cream-300 bg-white px-3 text-xs font-medium text-cocoa-700 outline-none transition-colors hover:border-terracotta-300 focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500";

/**
 * One filter row scoping everything below it. Selections live in the URL, so a
 * filtered view is shareable and survives a reload.
 */
export default function FilterBar({ window: win, dimensions = [], exportPath }) {
  const router = useRouter();
  const isCustom = win.range === "custom";
  const isDefault =
    win.range === DEFAULT_RANGE && dimensions.every((d) => !d.value);

  function apply(next) {
    const query = { ...router.query, ...next };
    for (const [key, value] of Object.entries(query)) {
      if (value === "" || value == null) delete query[key];
    }
    router.push({ pathname: router.pathname, query }, undefined, { scroll: false });
  }

  function onRangeChange(value) {
    if (value === "custom") {
      apply({ range: "custom", from: win.from, to: win.to });
    } else {
      apply({ range: value === DEFAULT_RANGE ? undefined : value, from: undefined, to: undefined });
    }
  }

  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(router.query)) {
    if (typeof value === "string" && value) exportQuery.set(key, value);
  }

  return (
    <section
      aria-label="Dashboard filters"
      className="sticky top-0 z-30 -mx-4 mb-6 border-b border-cream-300 bg-cream-100/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:rounded-2xl md:border md:px-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-cocoa-400">
            <CalendarRange size={13} aria-hidden="true" /> Period
          </span>

          <label className="sr-only" htmlFor="filter-range">
            Reporting period
          </label>
          <select
            id="filter-range"
            className={CONTROL}
            value={win.range}
            onChange={(e) => onRangeChange(e.target.value)}
          >
            {RANGE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>

          {isCustom && (
            <span className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="filter-from">
                From date
              </label>
              <input
                id="filter-from"
                type="date"
                className={CONTROL}
                key={`from-${win.from}`}
                defaultValue={win.from ?? ""}
                max={win.to || undefined}
                onChange={(e) => e.target.value && apply({ range: "custom", from: e.target.value })}
              />
              <span className="text-xs text-cocoa-400">to</span>
              <label className="sr-only" htmlFor="filter-to">
                To date
              </label>
              <input
                id="filter-to"
                type="date"
                className={CONTROL}
                key={`to-${win.to}`}
                defaultValue={win.to ?? ""}
                min={win.from || undefined}
                onChange={(e) => e.target.value && apply({ range: "custom", to: e.target.value })}
              />
            </span>
          )}

          {dimensions.map((dim) => (
            <span key={dim.key} className="flex items-center gap-1.5">
              <label className="sr-only" htmlFor={`filter-${dim.key}`}>
                {dim.label}
              </label>
              <select
                id={`filter-${dim.key}`}
                className={CONTROL}
                value={dim.value ?? ""}
                onChange={(e) => apply({ [dim.key]: e.target.value || undefined })}
              >
                <option value="">{dim.allLabel}</option>
                {dim.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </span>
          ))}

          {!isDefault && (
            <button
              type="button"
              onClick={() => router.push({ pathname: router.pathname }, undefined, { scroll: false })}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-terracotta-600 transition-colors hover:bg-terracotta-50"
            >
              <RotateCcw size={13} aria-hidden="true" /> Reset
            </button>
          )}
        </div>

        {exportPath && (
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-cocoa-400 sm:inline">
              Export
            </span>
            <a
              href={`${exportPath}?${new URLSearchParams({ ...Object.fromEntries(exportQuery), format: "pdf" })}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 text-xs font-semibold text-cocoa-700 transition-colors hover:border-terracotta-300 hover:text-terracotta-600"
            >
              <FileText size={13} aria-hidden="true" /> PDF
            </a>
            <a
              href={`${exportPath}?${new URLSearchParams({ ...Object.fromEntries(exportQuery), format: "xlsx" })}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 text-xs font-semibold text-cocoa-700 transition-colors hover:border-terracotta-300 hover:text-terracotta-600"
            >
              <FileSpreadsheet size={13} aria-hidden="true" /> Excel
            </a>
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-cocoa-400">
        Showing <span className="font-semibold text-cocoa-600">{win.label}</span>
        {win.from ? ` · ${win.from} to ${win.to}` : ""}. Order metrics follow this period; catalog totals are current.
      </p>
    </section>
  );
}

/** True while a filter change is in flight, for the hold-the-frame treatment. */
export function useRouteLoading() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const done = () => setLoading(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", done);
    router.events.on("routeChangeError", done);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", done);
      router.events.off("routeChangeError", done);
    };
  }, [router.events]);

  return loading;
}
