import { useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "@/pages/baker/dashboard/index";
import ImageUploader from "@/components/dashboard/ImageUploader";
import Button from "@/components/ui/Button";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function SettingsPage({ bakery }) {
  const [form, setForm] = useState({
    name: bakery.name,
    description: bakery.description || "",
    city: bakery.city,
    address: bakery.address || "",
    whatsappNumber: bakery.whatsappNumber,
    mpesaTillNumber: bakery.mpesaTillNumber || "",
    logoUrl: bakery.logoUrl || "",
    coverImageUrl: bakery.coverImageUrl || "",
  });
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/bakeries/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not save settings");
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Bakery Settings" navItems={BAKER_NAV} brandLabel="View storefront" brandHref={`/bakery/${bakery.slug}`}>
      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">Logo</label>
          <ImageUploader value={form.logoUrl} onChange={(v) => update("logoUrl", v)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">Cover photo</label>
          <ImageUploader value={form.coverImageUrl} onChange={(v) => update("coverImageUrl", v)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">Bakery name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-cocoa-700">City</label>
            <input
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-cocoa-700">Address (optional)</label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">WhatsApp Business number</label>
          <input
            required
            value={form.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
            className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
          />
          <p className="mt-1 text-xs text-cocoa-400">Customers are redirected here to place orders.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">M-Pesa Till/Paybill (optional)</label>
          <input
            value={form.mpesaTillNumber}
            onChange={(e) => update("mpesaTillNumber", e.target.value)}
            className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
            placeholder="e.g. 123456"
          />
        </div>

        <div className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4">
          <h3 className="text-sm font-semibold text-cocoa-900">Change Password</h3>
          <p className="mt-0.5 text-xs text-cocoa-500">Leave blank if you don&apos;t want to change your current password.</p>
          <div className="mt-3">
            <input
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={form.newPassword || ""}
              onChange={(e) => update("newPassword", e.target.value)}
              className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "BAKER");
  if (guard.redirect) return guard;

  try {
    const bakery = await backendFetch("/api/bakeries/me", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    if (!bakery) return { redirect: { destination: "/auth/login", permanent: false } };
    return { props: { bakery } };
  } catch (err) {
    return { redirect: { destination: "/auth/login", permanent: false } };
  }
}
