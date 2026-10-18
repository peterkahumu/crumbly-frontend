import { useState } from "react";
import { ShoppingBag, Search, Eye, MessageSquare, DollarSign, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "@/pages/baker/dashboard/index";
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

export default function BakerOrdersPage({ orders: initialOrders = [] }) {
  const [orders, setOrders] = useState(Array.isArray(initialOrders) ? initialOrders : []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function updateStatus(id, status) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((os) => (Array.isArray(os) ? os : []).map((o) => (o?.id === id ? { ...o, status } : o)));
      toast.success("Order status updated");
    } else {
      toast.error("Could not update order status");
    }
  }

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter((o) => {
    if (!o) return false;
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const query = (search || "").toLowerCase();
    const matchesSearch =
      (o.customerName || "").toLowerCase().includes(query) ||
      (o.customerPhone || "").includes(query);
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = safeOrders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0);
  const pendingCount = safeOrders.filter((o) => o?.status === "PENDING").length;

  return (
    <DashboardLayout title="Store Orders" navItems={BAKER_NAV}>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total Received" value={orders.length} icon={ShoppingBag} />
          <StatCard label="Total Revenue" value={formatPrice(totalRevenue)} icon={DollarSign} />
          <StatCard label="Pending Orders" value={pendingCount} icon={Clock} />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-400" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
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
                className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === status
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
            description="Orders placed via WhatsApp checkout will show up here."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredOrders.map((order) => {
              const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9+]/g, "") : "";
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm hover:border-terracotta-200 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-base font-bold text-cocoa-900">{order.customerName}</p>
                        <Badge tone={STATUS_TONE[order.status] || "brand"}>{order.status}</Badge>
                      </div>
                      <p className="text-xs text-cocoa-500 mt-0.5">
                        {order.customerPhone} · {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone.replace("+", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          <MessageSquare size={13} /> Chat on WhatsApp
                        </a>
                      )}

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-cocoa-700 hover:bg-cream-100 transition-colors"
                      >
                        <Eye size={13} /> View & Edit Details
                      </button>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <ul className="mt-3 space-y-1 text-sm text-cocoa-700">
                    {Array.isArray(order.items) &&
                      order.items.map((item, i) => (
                        <li key={i} className="flex justify-between items-center text-xs sm:text-sm">
                          <span>
                            <span className="font-bold text-cocoa-900">{item.qty}×</span> {item.name}
                            {item.size ? ` (${item.size})` : ""}
                          </span>
                          <span className="font-medium text-cocoa-600">
                            {formatPrice((item.price || 0) * (item.qty || 1))}
                          </span>
                        </li>
                      ))}
                  </ul>

                  {/* Footer Status Dropdown */}
                  <div className="mt-4 flex items-center justify-between border-t border-cream-100 pt-3">
                    <div>
                      <span className="text-xs text-cocoa-400">Total: </span>
                      <span className="font-heading text-base font-bold text-terracotta-600">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-cocoa-500">Update Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="rounded-xl border border-cream-300 bg-white px-3 py-1 text-xs font-semibold text-cocoa-800 outline-none focus:border-terracotta-500 shadow-sm"
                      >
                        {["PENDING", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Modal */}
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
  const guard = await requireRole(ctx, "BAKER");
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
