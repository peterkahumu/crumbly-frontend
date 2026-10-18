import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Ban,
  Trash2,
  RotateCcw,
  ExternalLink,
  Edit2,
  Key,
  X,
  Search,
  Store,
  Eye,
  Plus
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "@/pages/admin/dashboard/index";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

const STATUS_TONE = {
  PENDING: "warning",
  APPROVED: "success",
  SUSPENDED: "danger",
  DELETED: "danger",
};

const STATUS_FILTERS = ["ALL", "APPROVED", "PENDING", "SUSPENDED", "DELETED"];

export default function BakersAdmin({ bakeries: initial }) {
  const [bakeries, setBakeries] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingBaker, setEditingBaker] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    city: "",
    address: "",
    whatsappNumber: "",
    mpesaTillNumber: "",
    status: "APPROVED",
    password: "",
  });

  const filteredBakeries = bakeries.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(query) ||
      (b.email || b.owner?.email || "").toLowerCase().includes(query) ||
      b.city.toLowerCase().includes(query) ||
      b.whatsappNumber.includes(query);
    return matchesStatus && matchesSearch;
  });

  function openEditModal(baker) {
    setEditingBaker(baker);
    setEditForm({
      name: baker.name || "",
      email: baker.email || baker.owner?.email || "",
      city: baker.city || "",
      address: baker.address || "",
      whatsappNumber: baker.whatsappNumber || "",
      mpesaTillNumber: baker.mpesaTillNumber || "",
      status: baker.status || "APPROVED",
      password: "",
    });
  }

  function closeEditModal() {
    setEditingBaker(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editingBaker) return;
    setSaving(true);

    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;

      const res = await fetch(`/api/admin/bakeries/${editingBaker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bakery");

      setBakeries((bs) =>
        bs.map((b) =>
          b.id === editingBaker.id
            ? { ...b, ...data.bakery, owner: { email: data.bakery.email } }
            : b
        )
      );

      toast.success("Bakery details updated");
      closeEditModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id, status) {
    const res = await fetch(`/api/admin/bakeries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBakeries((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success(`Bakery ${status.toLowerCase()}`);
    } else {
      toast.error("Could not update bakery");
    }
  }

  async function handleDelete(id, name) {
    if (
      !confirm(
        `Are you sure you want to archive/delete "${name}"?\n\nThis deletes all cakes from the public catalog while preserving historical orders and baker contact details for fraud and audit compliance.`
      )
    )
      return;

    const res = await fetch(`/api/admin/bakeries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBakeries((bs) =>
        bs.map((b) =>
          b.id === id ? { ...b, status: "DELETED", isDeleted: true, _count: { cakes: 0 } } : b
        )
      );
      toast.success("Bakery archived and cakes removed");
    } else {
      toast.error("Could not archive bakery");
    }
  }

  return (
    <DashboardLayout title="Bakers Directory & Management" navItems={ADMIN_NAV}>
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa-400" />
            <input
              type="text"
              placeholder="Search by bakery name, email, city, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-cream-300 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:border-terracotta-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? "bg-terracotta-500 text-white shadow-sm"
                    : "bg-white border border-cream-300 text-cocoa-600 hover:bg-cream-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filteredBakeries.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No bakeries found"
            description={
              search || statusFilter !== "ALL"
                ? "Try clearing filters or search query."
                : "No registered bakeries yet."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-cream-300 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-cream-200 bg-cream-50/50 text-left text-xs uppercase font-semibold text-cocoa-400">
                  <th className="px-5 py-3.5">Bakery</th>
                  <th className="px-5 py-3.5">City & Phone</th>
                  <th className="px-5 py-3.5">Cakes</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filteredBakeries.map((b) => (
                  <tr key={b.id} className="hover:bg-cream-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/dashboard/bakers/${b.id}`}
                        className="group font-heading font-semibold text-cocoa-900 hover:text-terracotta-600 flex items-center gap-1.5"
                      >
                        {b.name}
                        <span className="text-[11px] font-normal text-terracotta-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          View details →
                        </span>
                      </Link>
                      <p className="text-xs text-cocoa-400">{b.email || b.owner?.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-cocoa-700">{b.city}</p>
                      <p className="text-xs text-cocoa-400">{b.whatsappNumber}</p>
                    </td>
                    <td className="px-5 py-3.5 text-cocoa-600 font-medium">{b._count?.cakes || 0}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={STATUS_TONE[b.status] || "brand"}>{b.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end items-center gap-1">
                        <Link
                          href={`/admin/dashboard/bakers/${b.id}`}
                          className="rounded-lg p-2 text-cocoa-600 hover:bg-cream-100 transition-colors"
                          title="Manage Baker Profile & Catalog"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openEditModal(b)}
                          className="rounded-lg p-2 text-cocoa-600 hover:bg-cream-100 transition-colors"
                          title="Quick Edit & Password Override"
                        >
                          <Edit2 size={16} />
                        </button>
                        <Link
                          href={`/bakery/${b.slug}`}
                          target="_blank"
                          className="rounded-lg p-2 text-cocoa-400 hover:bg-cream-100"
                          title="View Public Storefront"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        {b.status !== "APPROVED" && (
                          <button
                            onClick={() => setStatus(b.id, "APPROVED")}
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                            title="Approve Bakery"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {b.status !== "SUSPENDED" && b.status !== "DELETED" && (
                          <button
                            onClick={() => setStatus(b.id, "SUSPENDED")}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            title="Suspend Bakery"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                        {b.status === "SUSPENDED" && (
                          <button
                            onClick={() => setStatus(b.id, "APPROVED")}
                            className="rounded-lg p-2 text-cocoa-500 hover:bg-cream-100"
                            title="Reinstate Bakery"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                        {b.status !== "DELETED" && (
                          <button
                            onClick={() => handleDelete(b.id, b.name)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="Archive / Delete Baker"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick Edit Baker Modal */}
        {editingBaker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-900/40 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-3xl border border-cream-300 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                <div>
                  <h3 className="font-heading text-lg font-bold text-cocoa-900">Quick Edit Baker</h3>
                  <p className="text-xs text-cocoa-500">Update details or reset password for {editingBaker.name}</p>
                </div>
                <button onClick={closeEditModal} className="rounded-full p-1.5 text-cocoa-400 hover:bg-cream-100">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-600">Bakery Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-600">Login Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-600">City</label>
                    <input
                      type="text"
                      required
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-600">WhatsApp Phone</label>
                    <input
                      type="text"
                      required
                      value={editForm.whatsappNumber}
                      onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                      className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-600">Address / Location</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full rounded-xl border border-cream-300 px-3.5 py-2 text-sm outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-cocoa-600">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-terracotta-500"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="DELETED">DELETED</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-800">
                    <Key size={14} /> Set New Password
                  </div>
                  <p className="mt-0.5 text-xs text-amber-700">Leave blank to keep existing credentials.</p>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 6 chars)"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                  <Button type="button" variant="outline" size="md" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button type="submit" size="md" disabled={saving}>
                    {saving ? "Saving Changes…" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "SUPER_ADMIN");
  if (guard.redirect) return guard;

  try {
    const bakeries = await backendFetch("/api/admin/bakeries", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    return { props: { bakeries } };
  } catch (err) {
    return { props: { bakeries: [] } };
  }
}
