import { parseFilters } from "@/lib/dashboardFilters";
import { getBakerAnalytics, getPlatformAnalytics } from "@/lib/analytics";
import { buildReport } from "@/lib/export/report";
import { formatPrice } from "@/lib/currency";
import { compact, compactPrice, dayKey } from "@/lib/charts";
import { formatDateTime } from "@/lib/time";

const CONTENT_TYPES = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

/** Serves an analytics download for the given scope, honouring the URL filters. */
export async function serveExport({ req, res, scope, bakeryId, title, cityOptional = false }) {
  const format = String(req.query.format || "xlsx").toLowerCase();
  if (!CONTENT_TYPES[format]) {
    res.status(400).json({ error: "Unsupported format. Use xlsx or pdf." });
    return;
  }

  const filters = parseFilters(req.query);
  const analytics =
    scope === "baker" ? await getBakerAnalytics(bakeryId, filters) : await getPlatformAnalytics(filters);

  const filterSummary = [];
  if (cityOptional && filters.city) filterSummary.push(["City", filters.city]);
  if (filters.bakeryId) {
    filterSummary.push(["Bakery", analytics.options?.bakeries.find((b) => b.id === filters.bakeryId)?.name ?? "—"]);
  }

  const report = buildReport(analytics, {
    title,
    subtitle: scope === "baker" ? "Bakery performance report" : "Marketplace performance report",
    generatedAt: formatDateTime(new Date()),
    filterSummary,
    money: formatPrice,
    maxTableRows: 28,
    kpis: kpisFor(analytics),
  });

  const buffer =
    format === "xlsx"
      ? await (await import("@/lib/export/workbook")).buildWorkbook(report)
      : await (await import("@/lib/export/pdf")).buildPdf(report);

  const stamp = `${analytics.window.from ?? "all"}_${analytics.window.to}`;
  const filename = `crumbly-${scope}-analytics-${stamp}.${format}`;

  res.setHeader("Content-Type", CONTENT_TYPES[format]);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).send(buffer);
}

function kpisFor(a) {
  const shared = [
    { label: "Revenue", value: compactPrice(a.totals.revenue) },
    { label: "Orders", value: compact(a.totals.orders) },
    { label: "Average order", value: formatPrice(a.totals.avgOrderValue) },
  ];

  if (a.scope === "baker") {
    return [
      ...shared,
      { label: "Completion rate", value: `${a.totals.completionRate}%` },
      { label: "Cakes listed", value: compact(a.totals.cakes) },
      { label: "Portfolio photos", value: compact(a.totals.portfolio) },
    ];
  }

  return [
    ...shared,
    { label: "Live bakeries", value: compact(a.totals.approved) },
    { label: "Awaiting approval", value: compact(a.totals.pending) },
    { label: "Cakes listed", value: compact(a.totals.cakes) },
  ];
}

export { dayKey };
