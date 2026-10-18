import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Plus, Pencil, Trash2, Cake as CakeIcon } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "@/pages/baker/dashboard/index";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";
import { formatPrice } from "@/lib/currency";

export default function CakesList({ cakes: initialCakes }) {
  const [cakes, setCakes] = useState(initialCakes);
  const router = useRouter();

  async function handleDelete(id) {
    if (!confirm("Delete this cake? This cannot be undone.")) return;
    const res = await fetch(`/api/cakes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCakes((cs) => cs.filter((c) => c.id !== id));
      toast.success("Cake deleted");
    } else {
      toast.error("Could not delete cake");
    }
  }

  return (
    <DashboardLayout title="Cakes" navItems={BAKER_NAV}>
      <div className="mb-4 flex justify-end">
        <Button href="/baker/dashboard/cakes/new">
          <Plus size={16} /> Add Cake
        </Button>
      </div>

      {cakes.length === 0 ? (
        <EmptyState icon={CakeIcon} title="No cakes yet" description="Add your first cake to start selling." action={<Button href="/baker/dashboard/cakes/new" className="mt-2">Add Cake</Button>} />
      ) : (
        <div className="grid gap-3">
          {cakes.map((cake) => (
            <div key={cake.id} className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                {cake.images?.[0] && <Image src={cake.images[0]} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-semibold text-cocoa-800">{cake.name}</p>
                <p className="text-xs text-cocoa-500">{cake.category.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-terracotta-600">{formatPrice(cake.discountPrice ?? cake.price)}</span>
                  {!cake.isAvailable && <Badge tone="neutral">Sold out</Badge>}
                  {cake.isFeatured && <Badge tone="warning">Featured</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => router.push(`/baker/dashboard/cakes/${cake.id}/edit`)} className="rounded-full p-2 text-cocoa-500 hover:bg-cream-200" aria-label="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(cake.id)} className="rounded-full p-2 text-cocoa-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
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
    const cakes = await backendFetch("/api/cakes", {
      headers: { Authorization: `Bearer ${guard.session.accessToken}` },
    });
    return { props: { cakes } };
  } catch (err) {
    return { props: { cakes: [] } };
  }
}
