import { useState } from "react";
import { ShoppingBag, Search, Filter, Eye, DollarSign, Clock, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "@/pages/admin/dashboard/index";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import OrderDetailModal from "@/components/dashboard/OrderDetailModal";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";
import { formatPrice } from "@/lib/currency";

const STATUS_TONE = {
  PENDING: "warning",
  CONTACTED: "brand",
  CONFIRMED: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const ALL_STATUSES = ["ALL", "PENDING", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function AdminOrders({ orders: initialOrders = [] }) {
  const [orders, setOrders] = useState(Array.isArray(initialOrders) ? initialOrders : []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter((o) => {
    if (!o) return false;
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const query = (search || "").toLowerCase();
    const matchesSearch =
      (o.customerName || "").toLowerCase().includes(query) ||
      (o.customerPhone || "").includes(query) ||
      (o.bakery?.name || "").toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = safeOrders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0);
  const pendingCount = safeOrders.filter((o) => o?.status === "PENDING").length;
  const completedCount = safeOrders.filter((o) => o?.status === "COMPLETED").length;

  return (
    <DashboardLayout title="Platform Orders" navItems={ADMIN_NAV}>
      <div className="space-y-6">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Orders" value={safeOrders.length} icon={ShoppingBag} />
          <StatCard label="Platform Volume" value={formatPrice(totalRevenue)} icon={DollarSign} />
          <StatCard label="Pending Attention" value={pendingCount} icon={Clock} />
          <StatCard label="Completed" value={completedCount} icon={CheckCircle} />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-400" />
            <input
              type="text"
              placeholder="Search by customer, phone, or bakery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-cream-300 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-terracotta-500 shadow-sm"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {ALL_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === status
                    ? "bg-terracotta-500 text-white shadow-sm"
                    : "bg-white border border-cream-300 text-cocoa-600 hover:bg-cream-100"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            description={
              search || statusFilter !== "ALL"
                ? "Try adjusting your search or status filter."
                : "Orders placed across all bakeries will appear here."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/50 text-left text-xs uppercase font-semibold text-cocoa-400">
                  <th className="px-5 py-3.5">Bakery</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="cursor-pointer hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-cocoa-900">{o.bakery?.name || "Unknown"}</td>
                    <td className="px-5 py-3.5 text-cocoa-700">{o.customerName || "Customer"}</td>
                    <td className="px-5 py-3.5 text-cocoa-500">{o.customerPhone || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-terracotta-600">{formatPrice(o.totalAmount || 0)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={STATUS_TONE[o.status] || "brand"}>{o.status || "PENDING"}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-cocoa-400 text-xs">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-cream-300 bg-white px-2.5 py-1 text-xs font-semibold text-cocoa-700 hover:border-terracotta-400 hover:text-terracotta-600 transition-colors"
                      >
                        <Eye size={12} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Details & Edit Modal */}
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onOrderUpdated={(updated) => {
              if (updated && updated.id) {
                setOrders((prev) =>
                  (Array.isArray(prev) ? prev : []).map((o) => (o?.id === updated.id ? { ...o, ...updated } : o))
                );
              }
              setSelectedOrder(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "SUPER_ADMIN");
  if (guard.redirect) return guard;

  try {
    const orders = await backendFetch("/api/orders", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    return { props: { orders: Array.isArray(orders) ? orders : [] } };
  } catch (err) {
    return { props: { orders: [] } };
  }
}
