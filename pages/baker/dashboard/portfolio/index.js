import { useState } from "react";
import Image from "next/image";
import { Trash2, Images as ImagesIcon } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "@/pages/baker/dashboard/index";
import ImageUploader from "@/components/dashboard/ImageUploader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function PortfolioPage({ items: initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [eventType, setEventType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Add a photo first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, caption, eventType }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || body.detail || "Could not add photo");
      const newItem = body.item || body;
      setItems((it) => [newItem, ...it]);
      setImageUrl("");
      setCaption("");
      setEventType("");
      toast.success("Added to portfolio");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this photo from your portfolio?")) return;
    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((it) => it.filter((i) => i.id !== id));
      toast.success("Removed");
    } else {
      toast.error("Could not remove photo");
    }
  }

  return (
    <DashboardLayout title="Portfolio" navItems={BAKER_NAV}>
      <form onSubmit={handleAdd} className="mb-8 max-w-md rounded-2xl border border-cream-300 bg-white p-4">
        <p className="mb-3 font-heading text-sm font-semibold text-cocoa-800">Add a photo</p>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
        <input
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-3 w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-400"
        />
        <input
          placeholder="Event type (e.g. Wedding, Birthday)"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="mt-2 w-full rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-400"
        />
        <Button type="submit" disabled={submitting} className="mt-3 w-full">
          {submitting ? "Adding…" : "Add to Portfolio"}
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={ImagesIcon} title="No portfolio photos yet" description="Show off your best work to attract more customers." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-cream-200">
              <Image src={item.imageUrl} alt={item.caption || ""} fill sizes="200px" className="object-cover" />
              <button
                onClick={() => handleDelete(item.id)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "BAKER");
  if (guard.redirect) return guard;

  try {
    const items = await backendFetch("/api/portfolio", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    return { props: { items } };
  } catch (err) {
    return { props: { items: [] } };
  }
}
