import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Cake,
  CalendarDays,
  Clock,
  Images,
  LayoutDashboard,
  Layers,
  MessageCircle,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Wallet,
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
import CalendarHeatmap from "@/components/charts/CalendarHeatmap";
import RadialGauge from "@/components/charts/RadialGauge";
import StatTile, { Meter } from "@/components/charts/StatTile";
import CakeLeaderboard from "@/components/charts/CakeLeaderboard";
import { Legend } from "@/components/charts/primitives";
import { requireRole } from "@/lib/session";
import { backendFetch } from "@/lib/backend";
import { parseFilters } from "@/lib/dashboardFilters";
import { CURRENCY, formatPrice } from "@/lib/currency";
import { compact, compactPrice } from "@/lib/charts";
import { NEUTRAL, ORDER_STATUS_COLOR, SEQUENTIAL, SERIES } from "@/lib/chartTheme";

export const BAKER_NAV = [
  { href: "/baker/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/baker/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/baker/dashboard/cakes", label: "Cakes", icon: Cake },
  { href: "/baker/dashboard/portfolio", label: "Portfolio", icon: Images },
  { href: "/baker/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/baker/dashboard/settings", label: "Settings", icon: Settings },
];

export default function BakerDashboard({ bakery, a }) {
  const loading = useRouteLoading();
  const [topCakeCount, setTopCakeCount] = useState(5);
  const hasOrders = a.totals.orders > 0;
  const period = a.window.label.toLowerCase();

  return (
    <DashboardLayout
      title="Overview"
      navItems={BAKER_NAV}
      brandLabel="View storefront"
      brandHref={`/bakery/${bakery.slug}`}
    >
      {bakery.status !== "APPROVED" && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold-300 bg-gold-100 p-4 text-sm text-cocoa-700">
          {bakery.status === "PENDING" ? (
            <Clock size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          )}
          {bakery.status === "PENDING"
            ? "Your bakery is pending approval from our team. It won't be visible to customers until approved."
            : "Your bakery has been suspended. Contact support for details."}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-heading text-lg font-semibold text-cocoa-800">{bakery.name}</h2>
        <Badge tone={bakery.status === "APPROVED" ? "success" : bakery.status === "PENDING" ? "warning" : "danger"}>
          {bakery.status}
        </Badge>
      </div>

      <FilterBar window={a.window} exportPath="/api/analytics/export" />

      <div
        className={`space-y-6 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={loading}
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile
            label="Revenue"
            value={compactPrice(a.totals.revenue)}
            delta={a.comparison.revenueDelta}
            deltaLabel="vs previous period"
            trend={a.trend.points.map((d) => d.revenue)}
            icon={Wallet}
          />
          <StatTile
            label="Orders"
            value={a.totals.orders}
            delta={a.comparison.ordersDelta}
            deltaLabel="vs previous period"
            trend={a.trend.points.map((d) => d.orders)}
            icon={ShoppingBag}
          />
          <StatTile label="Average order" value={formatPrice(a.totals.avgOrderValue)} icon={TrendingUp} />
          <StatTile
            label="Awaiting your reply"
            value={a.totals.pending}
            icon={MessageCircle}
            upIsGood={false}
            accent={ORDER_STATUS_COLOR.PENDING}
          />
          <StatTile label="Cakes listed" value={a.totals.cakes} icon={Cake} accent={SERIES[1]} />
          <StatTile label="Portfolio photos" value={a.totals.portfolio} icon={Images} accent={SERIES[2]} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ChartCard
            className="xl:col-span-2"
            title="Revenue over time"
            subtitle={`Order value by ${a.trend.size}, ${period}`}
            icon={TrendingUp}
            legend={
              <Legend
                shape="line"
                items={[
                  { label: "Revenue", color: SERIES[0] },
                  { label: `${a.trend.averageWindow}-point average`, color: SERIES[1] },
                ]}
              />
            }
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            emptyHint="Orders placed through your storefront's WhatsApp or M-Pesa checkout appear here the day they come in."
            footer={
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span>Both series in {CURRENCY}, on one axis.</span>
                <Link href="/baker/dashboard/orders" className="font-semibold text-terracotta-600 hover:underline">
                  All orders →
                </Link>
              </span>
            }
            table={{
              caption: "Revenue and orders per period",
              columns: ["Period", "Revenue", "Orders"],
              rows: (a.trend?.points || []).map((d) => [d.label, formatPrice(d.revenue), d.orders]),
            }}
          >
            <TrendChart
              height={250}
              data={(a.trend?.points || []).map((d) => ({ label: d.label, values: [d.revenue, d.revenueAvg] }))}
              series={[
                { label: "Revenue", color: SERIES[0], type: "area" },
                { label: `${a.trend?.averageWindow || 7}-point average`, color: SERIES[1], type: "trend" },
              ]}
              formatValue={formatPrice}
              formatTick={compact}
            />
          </ChartCard>

          <ChartCard
            title="Order fulfilment"
            subtitle="Orders you carried through to completed"
            icon={Sparkles}
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            emptyHint="Once customers start ordering, this shows how many you close out."
            footer="Catalog meters reflect your current listings, not the selected period."
            table={{
              caption: "Order outcomes",
              columns: ["Status", "Orders"],
              rows: Object.entries(a.statusCounts).map(([status, count]) => [status, count]),
            }}
          >
            <div className="flex flex-col gap-5">
              <RadialGauge
                value={a.totals.completionRate}
                label="completed"
                caption={`${a.statusCounts.COMPLETED} of ${a.totals.orders} orders`}
              />
              <div className="space-y-3">
                <Meter
                  label="Catalog live"
                  value={a.totals.available}
                  max={a.totals.cakes || 1}
                  formatValue={(v) => `${v} of ${a.totals.cakes}`}
                />
                <Meter
                  label="On promotion"
                  value={a.totals.discounted}
                  max={a.totals.cakes || 1}
                  formatValue={(v) => `${v} of ${a.totals.cakes}`}
                />
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard
            title="Order workflow"
            subtitle="How far your orders get, stage by stage"
            icon={Layers}
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            emptyHint="Your storefront needs to be approved and shared before enquiries arrive."
            footer="Each stage counts orders that reached at least that point, so the gap between rows is the drop-off."
            table={{
              caption: "Order workflow",
              columns: ["Stage", "Reached"],
              rows: a.funnel.map((s) => [s.label, s.count]).concat([["Cancelled", a.cancelled]]),
            }}
          >
            <FunnelBars stages={a.funnel} exit={{ label: "Cancelled along the way", count: a.cancelled, color: NEUTRAL }} />
          </ChartCard>

          <ChartCard
            title="How customers reach you"
            subtitle="Orders split by checkout channel"
            icon={MessageCircle}
            isEmpty={!hasOrders}
            emptyLabel="No orders in this period"
            emptyHint="WhatsApp handoff and M-Pesa checkout are both counted here."
            footer="A channel with no bar has not been used in this period — it is not switched off."
            table={{
              caption: "Orders by channel",
              columns: ["Channel", "Orders", "Value"],
              rows: a.channels.map((c) => [c.channel, c.count, formatPrice(c.revenue)]),
            }}
          >
            <div className="space-y-6">
              <ShareBar
                segments={a.channels.map((c, i) => ({
                  label: c.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa",
                  value: c.count,
                  color: SERIES[i],
                }))}
                formatValue={(v) => `${v} order${v === 1 ? "" : "s"}`}
              />
              <div className="rounded-2xl border border-cream-200 bg-cream-50/60 p-3">
                <p className="text-[11px] font-medium text-cocoa-500">Value carried by each channel</p>
                <ul className="mt-2 space-y-1.5">
                  {a.channels.map((c, i) => (
                    <li key={c.channel} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2 text-cocoa-600">
                        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: SERIES[i] }} />
                        <span className="truncate">{c.channel === "WHATSAPP" ? "WhatsApp" : "M-Pesa"}</span>
                      </span>
                      <span className="font-heading font-bold text-cocoa-900">{formatPrice(c.revenue)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            className="lg:col-span-2 xl:col-span-1"
            title="When orders arrive"
            subtitle="Each day in the period, shaded by how busy it was"
            icon={CalendarDays}
            isEmpty={!hasOrders}
            emptyLabel="Nothing to plot yet"
            emptyHint="Once orders start landing, the busiest days darken here — useful for planning bake days."
            footer="Darker means more orders that day. The palest shade is a day with none."
            table={{
              caption: "Orders per day",
              columns: ["Day", "Orders", "Value"],
              rows: (a.heatmap || [])
                .flatMap((w) => (w?.days || []))
                .filter((d) => d && d.value > 0)
                .map((d) => [d.label, d.value, formatPrice(d.revenue)]),
            }}
          >
            <CalendarHeatmap weeks={a.heatmap || []} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title="Best sellers"
            subtitle={`Cakes by revenue, ${period}`}
            icon={Star}
            action={<TopNSelect value={topCakeCount} onChange={setTopCakeCount} total={a.topCakes.length} />}
            isEmpty={a.topCakes.length === 0}
            emptyLabel="No sales in this period"
            emptyHint="This ranks cakes by the value they actually brought in, not by how many you listed."
            table={{
              caption: "Best selling cakes",
              columns: ["Cake", "Units", "Revenue"],
              rows: a.topCakes.map((c) => [c.name, c.qty, formatPrice(c.revenue)]),
            }}
            footer={
              <Link href="/baker/dashboard/cakes" className="font-semibold text-terracotta-600 hover:underline">
                Manage catalog →
              </Link>
            }
          >
            <CakeLeaderboard cakes={a.topCakes.slice(0, topCakeCount)} secondary={(c) => c.category} />
          </ChartCard>

          <ChartCard
            title="Catalog by category"
            subtitle="What you list, and what customers ordered from it"
            icon={Tag}
            isEmpty={a.categorySupply.length === 0}
            emptyLabel="No cakes listed yet"
            emptyHint="Add cakes to your catalog and this shows where your range sits."
            legend={
              <Legend
                items={[
                  { label: "Cakes listed", color: SERIES[1] },
                  { label: "Units ordered", color: SERIES[0] },
                ]}
              />
            }
            footer="Two measures with different units, so they get two charts rather than two axes on one."
            table={{
              caption: "Category supply and demand",
              columns: ["Category", "Listed", "Ordered"],
              rows: a.categorySupply.map((c) => [
                c.label,
                c.value,
                a.categoryDemand.find((d) => d.label === c.label)?.value ?? 0,
              ]),
            }}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-cocoa-400">Cakes listed</p>
                <RankedBars items={a.categorySupply.slice(0, 7)} color={SERIES[1]} />
              </div>
              <div className="min-w-0">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-cocoa-400">Units ordered</p>
                {a.categoryDemand.length ? (
                  <RankedBars items={a.categoryDemand.slice(0, 7)} color={SERIES[0]} />
                ) : (
                  <p className="text-xs text-cocoa-400">No orders in this period.</p>
                )}
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard
            title="Your price ladder"
            subtitle="How your cakes spread across price bands"
            icon={Wallet}
            isEmpty={!a.priceStats}
            emptyLabel="No cakes priced yet"
            footer={
              a.priceStats
                ? `${formatPrice(a.priceStats.min)} to ${formatPrice(a.priceStats.max)} · average ${formatPrice(
                    a.priceStats.avg
                  )}. Discounted cakes count at their discounted price.`
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
              formatValue={(v) => `${v} cake${v === 1 ? "" : "s"}`}
            />
          </ChartCard>

          <ChartCard
            title="Portfolio mix"
            subtitle="The event types your gallery shows off"
            icon={Images}
            isEmpty={a.portfolioMix.length === 0}
            emptyLabel="Portfolio is empty"
            emptyHint="Photos of past work are the strongest signal for a bakery that has no reviews yet."
            footer={
              <Link href="/baker/dashboard/portfolio" className="font-semibold text-terracotta-600 hover:underline">
                Add photos →
              </Link>
            }
            table={{
              caption: "Portfolio items by event type",
              columns: ["Event type", "Photos"],
              rows: a.portfolioMix.map((p) => [p.label, p.value]),
            }}
          >
            <RankedBars items={a.portfolioMix.slice(0, 7)} color={SERIES[2]} />
          </ChartCard>

          <ChartCard
            title="Customer ratings"
            subtitle={`Reviews left ${period}`}
            icon={Star}
            isEmpty={a.ratings.total === 0}
            emptyLabel="No reviews in this period"
            emptyHint="Ratings appear here as soon as customers leave them on your storefront."
            footer={a.ratings.total ? `${a.ratings.total} review${a.ratings.total === 1 ? "" : "s"}.` : null}
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
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "BAKER");
  if (guard.redirect) return guard;

  try {
    const authHeaders = { Authorization: `Bearer ${guard.session.accessToken}` };
    const bakery = await backendFetch("/api/bakeries/me", { headers: authHeaders });
    if (!bakery) return { redirect: { destination: "/auth/login", permanent: false } };

    const qs = new URLSearchParams();
    if (ctx.query.range) qs.set("range", String(ctx.query.range));
    if (ctx.query.from) qs.set("from", String(ctx.query.from));
    if (ctx.query.to) qs.set("to", String(ctx.query.to));

    const analytics = await backendFetch(`/api/analytics/baker?${qs.toString()}`, { headers: authHeaders });

    return {
      props: {
        bakery: { id: bakery.id, name: bakery.name, slug: bakery.slug, status: bakery.status },
        a: analytics,
      },
    };
  } catch (err) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
}
