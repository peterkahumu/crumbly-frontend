import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Layers,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Scale,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tags,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FilterBar, { useRouteLoading } from "@/components/dashboard/FilterBar";
import Badge from "@/components/ui/Badge";
import ChartCard, { TopNSelect } from "@/components/charts/ChartCard";
import TrendChart from "@/components/charts/TrendChart";
import ColumnChart from "@/components/charts/ColumnChart";
import RankedBars from "@/components/charts/RankedBars";
import FunnelBars from "@/components/charts/FunnelBars";
import ShareBar from "@/components/charts/ShareBar";
import DonutChart from "@/components/charts/DonutChart";
import DivergingBars from "@/components/charts/DivergingBars";
import CalendarHeatmap from "@/components/charts/CalendarHeatmap";
import StatTile from "@/components/charts/StatTile";
import { Legend } from "@/components/charts/primitives";
import CakeLeaderboard from "@/components/charts/CakeLeaderboard";
import { requireRole } from "@/lib/session";
import { backendFetch } from "@/lib/backend";
import { parseFilters } from "@/lib/dashboardFilters";
import { CURRENCY, formatPrice } from "@/lib/currency";
import { compact, compactPrice, formatDay } from "@/lib/charts";
import { BAKERY_STATUS_COLOR, NEUTRAL, SEQUENTIAL, SERIES, STATUS } from "@/lib/chartTheme";

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/dashboard/bakers", label: "Bakers", icon: Store },
  { href: "/admin/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/dashboard/admins", label: "Admins", icon: Users },
];

const STATUS_ICON = { Approved: CheckCircle2, Pending: AlertCircle, Suspended: XCircle };

export default function AdminDashboard({ a }) {
  const loading = useRouteLoading();
  const [topBakeries, setTopBakeries] = useState(5);
  const [topCakes, setTopCakes] = useState(5);
  const hasOrders = a.totals.orders > 0;
  const period = a.window.label.toLowerCase();

  return (
    <DashboardLayout title="Platform analytics" navItems={ADMIN_NAV}>
      <FilterBar
        window={a.window}
        exportPath="/api/admin/analytics/export"
        dimensions={[
          {
            key: "city",
            label: "City",
            allLabel: "All cities",
            value: a.appliedFilters?.city,
            options: (a.options?.cities || []).map((c) => ({ value: c, label: c })),
          },
          {
            key: "bakery",
            label: "Bakery",
            allLabel: "All bakeries",
            value: a.appliedFilters?.bakeryId,
            options: (a.options?.bakeries || []).map((b) => ({ value: b.id, label: b.name })),
          },
        ]}
      />

      <div
        className={`space-y-6 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={loading}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatTile
            label="GMV"
            value={compactPrice(a.totals.revenue)}
            delta={a.comparison.revenueDelta}
            trend={a.trend.points.map((d) => d.revenue)}
            icon={Wallet}
          />
          <StatTile
            label="Orders"
            value={a.totals.orders}
            delta={a.comparison.ordersDelta}
            trend={a.trend.points.map((d) => d.orders)}
            icon={ShoppingBag}
          />
          <StatTile label="Average order" value={formatPrice(a.totals.avgOrderValue)} icon={TrendingUp} />
          <StatTile label="Live bakeries" value={a.totals.approved} icon={Store} accent={SERIES[1]} />
          <StatTile
            label="Awaiting approval"
            value={a.totals.pending}
            icon={AlertCircle}
            upIsGood={false}
            accent={STATUS.warning}
          />
          <StatTile label="Cakes listed" value={compact(a.totals.cakes)} icon={Tags} accent={SERIES[2]} />
          <StatTile label="Cities covered" value={a.totals.cities} icon={MapPin} accent={SERIES[3]} />
        </div>

        {a.pendingBakers.length > 0 && (
          <section className="rounded-3xl border border-gold-300 bg-gradient-to-r from-gold-100 via-cream-100 to-cream-50 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-2xl bg-white/70 p-2.5 text-gold-600">
                  <AlertCircle size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-base font-bold text-cocoa-900">
                    {a.pendingBakers.length} {a.pendingBakers.length === 1 ? "bakery" : "bakeries"} awaiting approval
                  </h2>
                  <p className="text-xs text-cocoa-600">
                    Storefronts stay invisible to customers until you verify them.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/dashboard/bakers"
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-2xl bg-terracotta-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-terracotta-600 sm:self-auto"
              >
                Review applications <ChevronRight size={14} />
              </Link>
            </div>

            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {a.pendingBakers.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/admin/dashboard/bakers/${b.id}`}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-cream-300 bg-white p-3.5 transition-colors hover:border-terracotta-300"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-sm font-bold text-cocoa-900">{b.name}</span>
                      <span className="block truncate text-xs text-cocoa-500">
                        {b.city} · applied {formatDay(b.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-terracotta-600">Review →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Marketplace revenue"
            subtitle={`Gross order value by ${a.trend.size}, ${period}`}
            icon={TrendingUp}
            legend={
              <Legend
                shape="line"
                items={[
                  { label: "GMV", color: SERIES[0] },
                  { label: `${a.trend.averageWindow}-point average`, color: SERIES[1] },
                ]}
              />
            }
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            emptyHint="Once approved bakeries start taking orders, marketplace volume plots here."
            footer={
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>Both series in {CURRENCY} on a single axis.</span>
                <Link href="/admin/dashboard/orders" className="font-semibold text-terracotta-600 hover:underline">
                  All orders →
                </Link>
              </span>
            }
            table={{
              caption: "Marketplace revenue per period",
              columns: ["Period", "GMV", "Orders"],
              rows: (a.trend?.points || []).map((d) => [d.label, formatPrice(d.revenue), d.orders]),
            }}
          >
            <TrendChart
              height={250}
              data={(a.trend?.points || []).map((d) => ({ label: d.label, values: [d.revenue, d.revenueAvg] }))}
              series={[
                { label: "GMV", color: SERIES[0], type: "area" },
                { label: `${a.trend?.averageWindow || 7}-point average`, color: SERIES[1], type: "trend" },
              ]}
              formatValue={formatPrice}
              formatTick={compact}
            />
          </ChartCard>

          <ChartCard
            title="Supply health"
            subtitle="Where every registered bakery stands"
            icon={Store}
            isEmpty={a.totals.bakeries === 0}
            emptyLabel="No bakeries match these filters"
            footer="Status colours are reserved and always labelled — the palette alone never carries the meaning."
            table={{
              caption: "Bakeries by status",
              columns: ["Status", "Bakeries"],
              rows: a.statusMix.map((s) => [s.label, s.value]),
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={a.statusMix.map((s) => {
                  const statusKey = s.status || s.label?.toUpperCase();
                  const color =
                    BAKERY_STATUS_COLOR[statusKey] ||
                    BAKERY_STATUS_COLOR[s.label] ||
                    STATUS.good;
                  return {
                    label: s.label,
                    value: s.value,
                    color,
                  };
                })}
                centerValue={a.totals.bakeries}
                centerLabel="bakeries"
              />
              <ul className="w-full space-y-1.5">
                {a.statusMix.map((s) => {
                  const statusKey = s.status || s.label?.toUpperCase();
                  const color =
                    BAKERY_STATUS_COLOR[statusKey] ||
                    BAKERY_STATUS_COLOR[s.label] ||
                    STATUS.good;
                  const Icon = STATUS_ICON[s.label] ?? CheckCircle2;
                  return (
                    <li key={s.label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-cocoa-600">
                        <Icon size={13} style={{ color }} aria-hidden="true" />
                        {s.label}
                      </span>
                      <span className="font-heading font-bold text-cocoa-900">{s.value}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard
            title="Order workflow"
            subtitle="How far marketplace orders get"
            icon={Layers}
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            footer="Cumulative: each stage counts orders that reached at least that point."
            table={{
              caption: "Marketplace order workflow",
              columns: ["Stage", "Reached"],
              rows: a.funnel.map((s) => [s.label, s.count]).concat([["Cancelled", a.cancelled]]),
            }}
          >
            <FunnelBars stages={a.funnel} exit={{ label: "Cancelled along the way", count: a.cancelled, color: NEUTRAL }} />
          </ChartCard>

          <ChartCard
            title="Checkout channels"
            subtitle="How orders reach bakeries"
            icon={MessageCircle}
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            footer="M-Pesa reads zero until the till integration goes live for a bakery — a real zero, not a gap."
            table={{
              caption: "Orders by channel",
              columns: ["Channel", "Orders", "Value"],
              rows: a.channels.map((c) => [c.channel, c.count, formatPrice(c.revenue)]),
            }}
          >
            <div className="space-y-6">
              <ShareBar
                segments={a.channels.map((c, i) => ({
                  label: c.channel === "WHATSAPP" ? "WhatsApp handoff" : "M-Pesa checkout",
                  value: c.count,
                  color: SERIES[i],
                }))}
                formatValue={(v) => `${v} order${v === 1 ? "" : "s"}`}
              />
              <ColumnChart
                height={150}
                data={a.channels.map((c, i) => ({
                  label: c.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa",
                  value: c.revenue,
                  color: SERIES[i],
                  tipLabel: "Value",
                  extra: [{ label: "Orders", value: c.count }],
                }))}
                formatValue={formatPrice}
                formatTick={compact}
              />
            </div>
          </ChartCard>

          <ChartCard
            className="lg:col-span-2 xl:col-span-1"
            title="Top bakeries by revenue"
            subtitle={`Order value ${period}`}
            icon={Sparkles}
            action={<TopNSelect value={topBakeries} onChange={setTopBakeries} total={a.leaderboard.length} />}
            isEmpty={a.leaderboard.length === 0}
            emptyLabel="No revenue in this period"
            footer="One colour for every bar: length already carries the ranking."
            table={{
              caption: "Bakery revenue leaderboard",
              columns: ["Bakery", "Revenue", "Orders"],
              rows: a.leaderboard.map((b) => [b.label, formatPrice(b.value), b.orders]),
            }}
          >
            <RankedBars
              showRank
              items={a.leaderboard.slice(0, topBakeries).map((b) => ({
                label: b.label,
                value: b.value,
                meta: `${b.orders} order${b.orders === 1 ? "" : "s"}`,
              }))}
              formatValue={formatPrice}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="City coverage"
            subtitle="Registered bakeries and the catalog depth behind them"
            icon={MapPin}
            isEmpty={a.cities.length === 0}
            emptyLabel="No bakeries match these filters"
            footer="Catalog counts are real cake rows per city — a thin catalog behind several bakeries is a recruitment signal."
            table={{
              caption: "Bakeries and cakes per city",
              columns: ["City", "Bakeries", "Approved", "Cakes"],
              rows: a.cities.map((c) => [c.label, c.value, c.approved, c.cakes]),
            }}
          >
            <RankedBars
              items={a.cities.slice(0, 8).map((c) => ({
                label: c.label,
                value: c.value,
                meta: `${c.cakes} cakes`,
              }))}
              formatValue={(v) => `${v} baker${v === 1 ? "y" : "ies"}`}
              color={SERIES[1]}
            />
          </ChartCard>

          <ChartCard
            title="Category balance"
            subtitle="Share of demand minus share of catalog, in percentage points"
            icon={Scale}
            isEmpty={a.categoryBalance.every((c) => c.demand === 0)}
            emptyLabel="Not enough order history"
            emptyHint="This compares what customers order against what bakers list, so it needs orders in the selected period."
            footer="Both arms are the same unit — share of total — so the two sides are comparable. A warm bar means bakers under-supply what sells."
            table={{
              caption: "Category demand versus supply",
              columns: ["Category", "Listed", "Supply %", "Ordered", "Demand %", "Gap (pp)"],
              rows: a.categoryBalance.map((c) => [
                c.label,
                c.supply,
                `${c.supplyShare}%`,
                c.demand,
                `${c.demandShare}%`,
                `${c.value > 0 ? "+" : ""}${c.value}`,
              ]),
            }}
          >
            <DivergingBars
              items={a.categoryBalance}
              positiveLabel="Under-supplied"
              negativeLabel="Over-supplied"
              formatValue={(v) => `${v > 0 ? "+" : ""}${v} pp`}
            />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard
            className="lg:col-span-2"
            title="When the marketplace is busy"
            subtitle="Each day in the period, shaded by order volume"
            icon={CalendarDays}
            isEmpty={!hasOrders}
            emptyLabel="Nothing to plot yet"
            emptyHint="Daily order counts across all bakeries fill this in as orders arrive."
            footer="Sequential shading: one hue, light to dark. The palest cell is a day with no orders."
            table={{
              caption: "Marketplace orders per day",
              columns: ["Day", "Orders", "Value"],
              rows: (a.heatmap || [])
                .flatMap((w) => (w?.days || []))
                .filter((d) => d && d.value > 0)
                .map((d) => [d.label, d.value, formatPrice(d.revenue)]),
            }}
          >
            <CalendarHeatmap weeks={a.heatmap || []} />
          </ChartCard>

          <ChartCard
            title="Review scores"
            subtitle={`Ratings left ${period}`}
            icon={Star}
            isEmpty={a.ratings.total === 0}
            emptyLabel="No reviews in this period"
            emptyHint="Nothing here is inferred from order data — an empty chart is the honest reading."
            footer={a.ratings.total ? `${a.ratings.total} reviews.` : null}
            table={{
              caption: "Ratings breakdown",
              columns: ["Rating", "Reviews"],
              rows: a.ratings.breakdown.map((r) => [r.label, r.value]),
            }}
          >
            <div>
              <p className="font-heading text-4xl font-bold leading-none text-cocoa-900">
                {a.ratings.average ?? "—"}
                <span className="ml-1 text-base font-medium text-cocoa-400">/ 5</span>
              </p>
              <div className="mt-4">
                <RankedBars
                  items={a.ratings.breakdown.map((r) => ({
                    label: r.label,
                    value: r.value,
                    color: SEQUENTIAL[r.rating + 2],
                  }))}
                />
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Marketplace price ladder"
            subtitle="Every listed cake, by price band"
            icon={Wallet}
            isEmpty={!a.priceStats}
            emptyLabel="No cakes listed"
            footer={
              a.priceStats
                ? `${compact(a.totals.cakes)} cakes from ${formatPrice(a.priceStats.min)} to ${formatPrice(
                    a.priceStats.max
                  )} · average ${formatPrice(a.priceStats.avg)}.`
                : null
            }
            table={{
              caption: "Cakes per price band",
              columns: ["Band", "Cakes"],
              rows: a.priceBins.map((b) => [`${formatPrice(b.from)} – ${formatPrice(b.to)}`, b.value]),
            }}
          >
            <ColumnChart
              height={190}
              data={a.priceBins.map((b) => ({
                label: b.label,
                value: b.value,
                tipLabel: "Cakes",
                extra: [{ label: "Band", value: `${compactPrice(b.from)}–${compactPrice(b.to)}` }],
              }))}
              color={SERIES[3]}
              formatValue={(v) => `${compact(v)} cakes`}
            />
          </ChartCard>

          <ChartCard
            title="Best sellers platform-wide"
            subtitle={`By revenue, ${period}`}
            icon={Star}
            action={<TopNSelect value={topCakes} onChange={setTopCakes} total={a.topCakes.length} />}
            isEmpty={a.topCakes.length === 0}
            emptyLabel="No sales in this period"
            table={{
              caption: "Best selling cakes",
              columns: ["Cake", "Units", "Revenue"],
              rows: a.topCakes.map((c) => [c.name, c.qty, formatPrice(c.revenue)]),
            }}
            footer={
              <Link href="/cakes" target="_blank" className="font-semibold text-terracotta-600 hover:underline">
                View public catalog →
              </Link>
            }
          >
            <CakeLeaderboard cakes={a.topCakes.slice(0, topCakes)} secondary={(c) => c.bakery} />
          </ChartCard>
        </div>

        <ChartCard
          title="Recent transactions"
          subtitle="The latest orders in this period"
          icon={Users}
          isEmpty={a.recentOrders.length === 0}
          emptyLabel="No orders in this period"
          action={
            <Link href="/admin/dashboard/orders" className="text-xs font-bold text-terracotta-600 hover:underline">
              All orders →
            </Link>
          }
        >
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-cream-100 text-left text-[11px] uppercase tracking-wide text-cocoa-400">
                  <th scope="col" className="pb-3 font-semibold">Bakery</th>
                  <th scope="col" className="pb-3 font-semibold">Customer</th>
                  <th scope="col" className="pb-3 font-semibold">Channel</th>
                  <th scope="col" className="pb-3 text-right font-semibold">Total</th>
                  <th scope="col" className="pb-3 font-semibold">Status</th>
                  <th scope="col" className="pb-3 text-right font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {a.recentOrders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-cream-50/60">
                    <td className="py-3 font-medium text-cocoa-900">{o.bakery}</td>
                    <td className="py-3 text-cocoa-700">{o.customerName}</td>
                    <td className="py-3 text-xs text-cocoa-500">
                      {o.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa"}
                    </td>
                    <td className="py-3 text-right font-semibold tabular-nums text-cocoa-900">
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td className="py-3">
                      <Badge
                        tone={
                          o.status === "COMPLETED"
                            ? "success"
                            : o.status === "CANCELLED"
                            ? "danger"
                            : o.status === "PENDING"
                            ? "warning"
                            : "brand"
                        }
                      >
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-xs tabular-nums text-cocoa-400">{formatDay(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "SUPER_ADMIN");
  if (guard.redirect) return guard;

  try {
    const qs = new URLSearchParams();
    if (ctx.query.range) qs.set("range", String(ctx.query.range));
    if (ctx.query.from) qs.set("from", String(ctx.query.from));
    if (ctx.query.to) qs.set("to", String(ctx.query.to));
    if (ctx.query.city) qs.set("city", String(ctx.query.city));
    if (ctx.query.bakery) qs.set("bakery", String(ctx.query.bakery));

    const analytics = await backendFetch(`/api/analytics/platform?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });

    return { props: { a: analytics } };
  } catch (err) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
}
