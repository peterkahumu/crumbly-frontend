import { formatPrice } from "@/lib/currency";
import { percent } from "@/lib/charts";

/**
 * Flattens an analytics payload into named sheets. Both the workbook and the
 * PDF render from this one shape, so the two downloads can never disagree.
 */
export function buildReport(a, meta) {
  const money = (v) => formatPrice(v);
  const sheets = [];

  sheets.push({
    name: "Summary",
    columns: ["Metric", "Value"],
    rows: [
      ["Reporting period", a.window.label],
      ["From", a.window.from ?? "Earliest record"],
      ["To", a.window.to],
      ...(meta.filterSummary.length ? meta.filterSummary : []),
      ["Orders", a.totals.orders],
      ["Revenue", money(a.totals.revenue)],
      ["Average order value", money(a.totals.avgOrderValue)],
      ["Completion rate", `${a.totals.completionRate}%`],
      ...(a.scope === "baker"
        ? [
            ["Cakes listed", a.totals.cakes],
            ["Cakes available", a.totals.available],
            ["Cakes featured", a.totals.featured],
            ["Cakes discounted", a.totals.discounted],
            ["Portfolio photos", a.totals.portfolio],
          ]
        : [
            ["Bakeries", a.totals.bakeries],
            ["Approved", a.totals.approved],
            ["Awaiting approval", a.totals.pending],
            ["Suspended", a.totals.suspended],
            ["Cakes listed", a.totals.cakes],
            ["Average cake price", money(a.totals.avgCakePrice)],
            ["Cities covered", a.totals.cities],
          ]),
      ["Reviews", a.ratings.total],
      ["Average rating", a.ratings.average ?? "No reviews"],
    ],
  });

  sheets.push({
    name: "Revenue trend",
    columns: ["Period", "Revenue", "Orders", `${a.trend.averageWindow}-point average`],
    rows: a.trend.points.map((p) => [p.label, p.revenue, p.orders, p.revenueAvg]),
    money: [1, 3],
    bars: 1,
    chart: {
      type: "line",
      title: "Revenue over time",
      points: a.trend.points.map((p) => ({ label: p.label, value: p.revenue, secondary: p.revenueAvg })),
      format: money,
    },
  });

  sheets.push({
    name: "Order workflow",
    columns: ["Stage", "Orders reached", "Share of total"],
    rows: [
      ...a.funnel.map((s) => [s.label, s.count, `${percent(s.count, a.totals.orders, 1)}%`]),
      ["Cancelled", a.cancelled, `${percent(a.cancelled, a.totals.orders, 1)}%`],
    ],
    bars: 1,
    chart: {
      type: "bar",
      title: "Order workflow",
      points: a.funnel.map((s) => ({ label: s.label, value: s.count })),
    },
  });

  sheets.push({
    name: "Channels",
    columns: ["Channel", "Orders", "Value"],
    rows: a.channels.map((c) => [c.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa", c.count, c.revenue]),
    money: [2],
    chart: {
      type: "bar",
      title: "Orders by channel",
      points: a.channels.map((c) => ({
        label: c.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa",
        value: c.count,
      })),
    },
  });

  sheets.push({
    name: "Top cakes",
    columns: ["Cake", a.scope === "baker" ? "Category" : "Bakery", "Units", "Revenue"],
    rows: a.topCakes.map((c) => [c.name, (a.scope === "baker" ? c.category : c.bakery) ?? "—", c.qty, c.revenue]),
    money: [3],
    bars: 3,
    chart: {
      type: "bar",
      title: "Top cakes by revenue",
      points: a.topCakes.slice(0, 8).map((c) => ({ label: c.name, value: c.revenue })),
      format: money,
    },
  });

  if (a.scope === "baker") {
    sheets.push({
      name: "Categories",
      columns: ["Category", "Cakes listed", "Units ordered"],
      rows: a.categorySupply.map((c) => [
        c.label,
        c.value,
        a.categoryDemand.find((d) => d.label === c.label)?.value ?? 0,
      ]),
      bars: 1,
      chart: {
        type: "bar",
        title: "Cakes listed by category",
        points: a.categorySupply.slice(0, 10).map((c) => ({ label: c.label, value: c.value })),
      },
    });

    sheets.push({
      name: "Portfolio",
      columns: ["Event type", "Photos"],
      rows: a.portfolioMix.map((p) => [p.label, p.value]),
      bars: 1,
    });
  } else {
    sheets.push({
      name: "Bakeries",
      columns: ["Bakery", "City", "Orders", "Revenue"],
      rows: a.leaderboard.map((b) => [b.label, b.city ?? "—", b.orders, b.value]),
      money: [3],
      bars: 3,
      chart: {
        type: "bar",
        title: "Top bakeries by revenue",
        points: a.leaderboard.slice(0, 8).map((b) => ({ label: b.label, value: b.value })),
        format: money,
      },
    });

    sheets.push({
      name: "Cities",
      columns: ["City", "Bakeries", "Approved", "Cakes listed"],
      rows: a.cities.map((c) => [c.label, c.value, c.approved, c.cakes]),
      bars: 1,
      chart: {
        type: "bar",
        title: "Bakeries per city",
        points: a.cities.slice(0, 10).map((c) => ({ label: c.label, value: c.value })),
      },
    });

    sheets.push({
      name: "Category balance",
      columns: ["Category", "Cakes listed", "Supply %", "Units ordered", "Demand %", "Gap (pp)"],
      rows: a.categoryBalance.map((c) => [
        c.label,
        c.supply,
        c.supplyShare,
        c.demand,
        c.demandShare,
        c.value,
      ]),
      chart: {
        type: "diverging",
        title: "Demand share minus supply share",
        points: a.categoryBalance.map((c) => ({ label: c.label, value: c.value })),
        format: (v) => `${v > 0 ? "+" : ""}${v} pp`,
      },
    });

    sheets.push({
      name: "Recent orders",
      columns: ["Date", "Bakery", "Customer", "Channel", "Status", "Total"],
      rows: a.recentOrders.map((o) => [
        new Date(o.createdAt).toISOString().slice(0, 10),
        o.bakery,
        o.customerName,
        o.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa",
        o.status,
        o.totalAmount,
      ]),
      money: [5],
    });
  }

  sheets.push({
    name: "Price bands",
    columns: ["From", "To", "Cakes"],
    rows: a.priceBins.map((b) => [b.from, b.to, b.value]),
    money: [0, 1],
    bars: 2,
    chart: {
      type: "bar",
      title: "Cakes per price band",
      points: a.priceBins.map((b) => ({ label: b.label, value: b.value })),
    },
  });

  sheets.push({
    name: "Ratings",
    columns: ["Rating", "Reviews"],
    rows: a.ratings.breakdown.map((r) => [r.label, r.value]),
    bars: 1,
  });

  sheets.push({
    name: "Daily activity",
    columns: ["Day", "Orders", "Value"],
    rows: (a.heatmap || [])
      .flatMap((w) => (w?.days || []))
      .filter((d) => d && d.value > 0)
      .map((d) => [d.label, d.value, d.revenue]),
    money: [2],
  });

  return { ...meta, window: a.window, totals: a.totals, sheets };
}
