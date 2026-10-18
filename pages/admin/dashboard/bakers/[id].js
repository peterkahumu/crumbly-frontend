import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ExternalLink,
  Store,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  ShoppingBag,
  Tags,
  DollarSign,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "@/pages/admin/dashboard/index";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import ImageUploader from "@/components/dashboard/ImageUploader";
import OrderDetailModal from "@/components/dashboard/OrderDetailModal";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";
import { formatPrice } from "@/lib/currency";

const STATUS_TONE = {
  PENDING: "warning",
  APPROVED: "success",
  SUSPENDED: "danger",
  DELETED: "danger",
};

export default function AdminBakerDetailPage({ bakery: initialBakery }) {
  const router = useRouter();
  const [bakery, setBakery] = useState(initialBakery);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'cakes' | 'orders' | 'security'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState({
    name: bakery.name,
    email: bakery.email || bakery.owner?.email || "",
    city: bakery.city,
    address: bakery.address || "",
    whatsappNumber: bakery.whatsappNumber,
    mpesaTillNumber: bakery.mpesaTillNumber || "",
    description: bakery.description || "",
    logoUrl: bakery.logoUrl || "",
    coverImageUrl: bakery.coverImageUrl || "",
    status: bakery.status,
  });

  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSaveDetails(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/bakeries/${bakery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bakery");
      setBakery((prev) => ({ ...prev, ...data.bakery }));
      toast.success("Bakery information updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/bakeries/${bakery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      toast.success("Baker password successfully updated");
      setNewPassword("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleQuickStatusChange(newStatus) {
    try {
      const res = await fetch(`/api/admin/bakeries/${bakery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change status");
      setBakery((prev) => ({ ...prev, status: newStatus }));
      setForm((f) => ({ ...f, status: newStatus }));
      toast.success(`Bakery marked as ${newStatus.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSoftDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${bakery.name}"?\n\nThis will remove all published cakes from the marketplace while keeping historical orders and owner contact details preserved for auditing.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/bakeries/${bakery.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete bakery");
      toast.success("Bakery cakes deleted and account archived");
      setBakery((prev) => ({ ...prev, status: "DELETED", cakes: [] }));
      setForm((f) => ({ ...f, status: "DELETED" }));
    } catch (err) {
      toast.error(err.message);
    }
  }

  const totalRevenue = (bakery.orders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <DashboardLayout title={`Manage Baker: ${bakery.name}`} navItems={ADMIN_NAV}>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/admin/dashboard/bakers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-500 hover:text-terracotta-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Bakers List
        </Link>

        {/* Top Header Card */}
        <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
          <div className="h-32 w-full bg-gradient-to-r from-terracotta-500 via-brand-terracotta to-cream-400 relative">
            {bakery.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bakery.coverImageUrl}
                alt={bakery.name}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-cocoa-900/30 backdrop-blur-[2px]" />
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 -mt-16 sm:-mt-14 mb-4">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-cream-100 shadow-md overflow-hidden flex items-center justify-center font-heading text-2xl font-bold text-terracotta-700">
                  {bakery.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bakery.logoUrl} alt={bakery.name} className="h-full w-full object-cover" />
                  ) : (
                    bakery.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading text-2xl font-bold text-cocoa-900">{bakery.name}</h2>
                    <Badge tone={STATUS_TONE[bakery.status]}>{bakery.status}</Badge>
                  </div>
                  <p className="text-xs text-cocoa-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={13} className="text-cocoa-400" /> {bakery.city} · Member since{" "}
                    {new Date(bakery.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                <Link
                  href={`/bakery/${bakery.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-xs font-semibold text-cocoa-700 hover:bg-cream-50 transition-colors"
                >
                  <ExternalLink size={14} /> Storefront
                </Link>

                <Link
                  href={`/admin/dashboard/messages?bakeryId=${bakery.id}&bakeryName=${encodeURIComponent(bakery.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-terracotta-300 bg-terracotta-50 px-3.5 py-2 text-xs font-semibold text-terracotta-700 hover:bg-terracotta-100 transition-colors"
                >
                  <MessageCircle size={14} /> Message Baker
                </Link>

                {bakery.status !== "APPROVED" && (
                  <button
                    onClick={() => handleQuickStatusChange("APPROVED")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                )}

                {bakery.status !== "SUSPENDED" && bakery.status !== "DELETED" && (
                  <button
                    onClick={() => handleQuickStatusChange("SUSPENDED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    <AlertTriangle size={14} /> Suspend
                  </button>
                )}

                {bakery.status !== "DELETED" && (
                  <button
                    onClick={handleSoftDelete}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} /> Archive / Delete
                  </button>
                )}
              </div>
            </div>

            {/* Quick Contact Line */}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-cream-100 pt-4 text-xs text-cocoa-600">
              <span className="inline-flex items-center gap-1">
                <Mail size={14} className="text-cocoa-400" /> {bakery.email || bakery.owner?.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone size={14} className="text-cocoa-400" /> {bakery.whatsappNumber}
              </span>
              {bakery.mpesaTillNumber && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold text-cocoa-500">Till:</span> {bakery.mpesaTillNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Cakes in Catalog" value={bakery.cakes?.length || 0} icon={Tags} />
          <StatCard label="Total Orders" value={bakery.orders?.length || 0} icon={ShoppingBag} />
          <StatCard label="Lifetime Volume" value={formatPrice(totalRevenue)} icon={DollarSign} />
          <StatCard label="Portfolio Photos" value={bakery.portfolio?.length || 0} icon={Store} />
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cream-300 gap-2 overflow-x-auto">
          {[
            { id: "details", label: "Bakery Details & Profile", icon: Store },
            { id: "security", label: "Security & Password Reset", icon: Key },
            { id: "cakes", label: `Cakes (${bakery.cakes?.length || 0})`, icon: Tags },
            { id: "orders", label: `Orders (${bakery.orders?.length || 0})`, icon: ShoppingBag },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-terracotta-500 text-terracotta-600"
                  : "border-transparent text-cocoa-500 hover:text-cocoa-800"
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === "details" && (
          <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-cocoa-900 mb-1">Edit Baker Profile</h3>
            <p className="text-xs text-cocoa-500 mb-6">Manage bakery public storefront details and administrative settings.</p>

            <form onSubmit={handleSaveDetails} className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Logo Image</label>
                  <ImageUploader value={form.logoUrl} onChange={(v) => updateForm("logoUrl", v)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Cover Banner</label>
                  <ImageUploader value={form.coverImageUrl} onChange={(v) => updateForm("coverImageUrl", v)} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Bakery Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Login / Account Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">WhatsApp Phone</label>
                  <input
                    type="text"
                    required
                    value={form.whatsappNumber}
                    onChange={(e) => updateForm("whatsappNumber", e.target.value)}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Address / Pickup Location</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateForm("address", e.target.value)}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">M-Pesa Till / Paybill</label>
                  <input
                    type="text"
                    value={form.mpesaTillNumber}
                    onChange={(e) => updateForm("mpesaTillNumber", e.target.value)}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                    placeholder="e.g. 123456"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Account Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                    className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="DELETED">DELETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">Bakery Bio / Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                />
              </div>

              <Button type="submit" size="lg" disabled={saving}>
                {saving ? "Saving Changes…" : "Save Bakery Changes"}
              </Button>
            </form>
          </div>
        )}

        {/* TAB 2: SECURITY & PASSWORD */}
        {activeTab === "security" && (
          <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm max-w-xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <Key size={20} />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-cocoa-900">Reset Baker Password</h3>
                <p className="text-xs text-cocoa-500">
                  Directly override the password for <strong>{bakery.email || bakery.owner?.email}</strong>.
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-700">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter at least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none focus:border-terracotta-500"
                />
              </div>

              <Button type="submit" size="md" disabled={resettingPassword}>
                {resettingPassword ? "Updating Password…" : "Set New Password"}
              </Button>
            </form>
          </div>
        )}

        {/* TAB 3: CAKES */}
        {activeTab === "cakes" && (
          <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/50 text-left text-xs uppercase font-semibold text-cocoa-400">
                  <th className="px-5 py-3.5">Cake</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {(bakery.cakes || []).map((cake) => (
                  <tr key={cake.id} className="hover:bg-cream-50/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-cream-100 overflow-hidden">
                          {cake.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cake.images[0]} alt={cake.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-cocoa-400">Cake</div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-cocoa-900">{cake.name}</p>
                          <p className="text-xs text-cocoa-400">{cake.isFeatured ? "★ Featured" : "Standard"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-cocoa-600">{cake.category?.name || "Uncategorized"}</td>
                    <td className="px-5 py-3.5 font-medium text-cocoa-800">{formatPrice(cake.price)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={cake.isAvailable ? "success" : "danger"}>
                        {cake.isAvailable ? "Available" : "Sold Out"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/bakery/${bakery.slug}/cakes/${cake.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta-600 hover:underline"
                      >
                        Preview <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(bakery.cakes || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-cocoa-400">
                      No cakes listed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === "orders" && (
          <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/50 text-left text-xs uppercase font-semibold text-cocoa-400">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {(bakery.orders || []).map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50/30">
                    <td className="px-5 py-3.5 font-medium text-cocoa-900">{order.customerName}</td>
                    <td className="px-5 py-3.5 text-cocoa-600">{order.customerPhone}</td>
                    <td className="px-5 py-3.5 font-semibold text-terracotta-600">{formatPrice(order.totalAmount)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={STATUS_TONE[order.status] || "brand"}>{order.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-cocoa-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-semibold text-terracotta-600 hover:underline"
                      >
                        View & Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {(bakery.orders || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-cocoa-400">
                      No orders placed with this bakery yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onOrderUpdated={(updated) => {
              if (updated && updated.id) {
                setBakery((b) => ({
                  ...b,
                  orders: (b?.orders || []).map((o) => (o?.id === updated.id ? { ...o, ...updated } : o)),
                }));
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

  const { id } = ctx.params;
  try {
    const bakery = await backendFetch(`/api/admin/bakeries/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    if (!bakery) {
      return { redirect: { destination: "/admin/dashboard/bakers", permanent: false } };
    }
    return { props: { bakery } };
  } catch (err) {
    return { redirect: { destination: "/admin/dashboard/bakers", permanent: false } };
  }
}
