import { useState } from "react";
import { Trash2, Tags } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ADMIN_NAV } from "@/pages/admin/dashboard/index";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function CategoriesAdmin({ categories: initial }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || body.detail || "Could not add category");
      const newCat = body.category || body;
      setCategories((cs) => [...cs, newCat].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      toast.success("Category added");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((cs) => cs.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error || "Could not delete category");
    }
  }

  return (
    <DashboardLayout title="Categories" navItems={ADMIN_NAV}>
      <form onSubmit={handleAdd} className="mb-6 flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
        />
        <Button type="submit" disabled={submitting}>Add</Button>
      </form>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Add your first category above." />
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between rounded-xl border border-cream-300 bg-white px-4 py-3">
              <span className="text-sm font-medium text-cocoa-700">{cat.name}</span>
              <button onClick={() => handleDelete(cat.id)} className="rounded-full p-1.5 text-cocoa-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "SUPER_ADMIN");
  if (guard.redirect) return guard;

  try {
    const categories = await backendFetch("/api/categories");
    return { props: { categories } };
  } catch (err) {
    return { props: { categories: [] } };
  }
}
