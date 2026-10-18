import { useState } from "react";
import { X, ShoppingBag, User, Phone, DollarSign, Calendar, MessageSquare, Check, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/currency";

const STATUS_TONE = {
  PENDING: "warning",
  CONTACTED: "brand",
  CONFIRMED: "brand",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const STATUSES = ["PENDING", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default function OrderDetailModal({ order, onClose, onOrderUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: order?.customerName || "",
    customerPhone: order?.customerPhone || "",
    status: order?.status || "PENDING",
    totalAmount: order?.totalAmount || 0,
    mpesaReceiptNumber: order?.mpesaReceiptNumber || "",
  });

  if (!order) return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Failed to update order");
      toast.success("Order updated successfully");
      const updatedOrder = data.order || data;
      if (onOrderUpdated && updatedOrder && updatedOrder.id) {
        onOrderUpdated(updatedOrder);
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const items = Array.isArray(order?.items) ? order.items : [];
  const cleanPhone = order?.customerPhone ? order.customerPhone.replace(/[^0-9+]/g, "") : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-950/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cream-300 bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-cocoa-400 hover:bg-cream-100 hover:text-cocoa-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-cream-200 pb-4">
          <div className="rounded-2xl bg-terracotta-50 p-3 text-terracotta-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-cocoa-900">Order #{order.id.slice(-6).toUpperCase()}</h3>
              <Badge tone={STATUS_TONE[form.status] || "brand"}>{form.status}</Badge>
            </div>
            <p className="text-xs text-cocoa-500">
              Placed on {new Date(order.createdAt).toLocaleString()} · via {order.channel || "WHATSAPP"}
              {order.bakery?.name ? ` · Bakery: ${order.bakery.name}` : ""}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mt-6 space-y-6">
          {/* Status Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream-50 p-4 border border-cream-200">
            <div>
              <p className="text-xs font-semibold text-cocoa-500 uppercase tracking-wider">Current Status</p>
              <p className="font-heading text-base font-bold text-cocoa-900">{form.status}</p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-cocoa-700 hover:bg-cream-100 transition-colors shadow-sm"
                >
                  <Edit2 size={13} /> Edit Order Details
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-cocoa-600 hover:bg-cream-100 transition-colors"
                >
                  Cancel Edit
                </button>
              )}

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone.replace("+", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <MessageSquare size={14} /> WhatsApp Customer
                </a>
              )}
            </div>
          </div>

          {/* EDIT FORM or READ VIEW */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-terracotta-200 bg-terracotta-50/20 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-terracotta-700">Update Order Information</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cocoa-600 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cocoa-600 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    required
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cocoa-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-500 bg-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-cocoa-600 mb-1">Total Amount (KES)</label>
                  <input
                    type="number"
                    required
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cocoa-600 mb-1">M-Pesa Ref (Optional)</label>
                  <input
                    type="text"
                    value={form.mpesaReceiptNumber}
                    onChange={(e) => setForm({ ...form, mpesaReceiptNumber: e.target.value })}
                    placeholder="e.g. QKH7892ABC"
                    className="w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-cream-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-cocoa-400 uppercase tracking-wider mb-2">
                  <User size={14} /> Customer Information
                </div>
                <p className="font-semibold text-cocoa-900">{order.customerName}</p>
                <p className="text-xs text-cocoa-600 mt-1 flex items-center gap-1.5">
                  <Phone size={13} className="text-cocoa-400" /> {order.customerPhone}
                </p>
                {order.mpesaReceiptNumber && (
                  <p className="text-xs text-cocoa-500 mt-2">
                    <span className="font-semibold">M-Pesa Receipt:</span> {order.mpesaReceiptNumber}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-cream-200 bg-white p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-cocoa-400 uppercase tracking-wider mb-2">
                  <DollarSign size={14} /> Financial Summary
                </div>
                <p className="text-2xl font-bold font-heading text-terracotta-600">
                  {formatPrice(order.totalAmount)}
                </p>
                <p className="text-xs text-cocoa-400 mt-1">Payment Method: {order.channel || "WhatsApp Order"}</p>
              </div>
            </div>
          )}

          {/* Items Purchased List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cocoa-400 mb-2">
              Ordered Items ({items.length})
            </h4>
            <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white divide-y divide-cream-100">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-xs font-bold text-cocoa-800">
                      {item.qty}×
                    </span>
                    <div>
                      <p className="font-medium text-cocoa-900">{item.name}</p>
                      {item.size && <p className="text-xs text-cocoa-400">Size: {item.size}</p>}
                    </div>
                  </div>
                  <span className="font-semibold text-cocoa-800">
                    {formatPrice((item.price || 0) * (item.qty || 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-cream-200 pt-4">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
