import { useState } from "react";
import { useRouter } from "next/router";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import ImageUploader from "@/components/dashboard/ImageUploader";

const DEFAULT_SIZES = [
  { label: "Small (serves 8)", priceModifier: 0 },
  { label: "Medium (serves 16)", priceModifier: 1500 },
];

export default function CakeForm({ categories, initial, cakeId }) {
  const router = useRouter();
  const [form, setForm] = useState(
    initial || {
      name: "",
      categoryId: categories[0]?.id ?? "",
      description: "",
      price: "",
      discountPrice: "",
      images: [],
      sizeOptions: DEFAULT_SIZES,
      isAvailable: true,
      isFeatured: false,
    }
  );
  const [submitting, setSubmitting] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateSize(index, key, value) {
    setForm((f) => ({
      ...f,
      sizeOptions: f.sizeOptions.map((s, i) => (i === index ? { ...s, [key]: value } : s)),
    }));
  }

  function addSize() {
    setForm((f) => ({ ...f, sizeOptions: [...f.sizeOptions, { label: "", priceModifier: 0 }] }));
  }

  function removeSize(index) {
    setForm((f) => ({ ...f, sizeOptions: f.sizeOptions.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.images.length) {
      toast.error("Add at least one photo");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        sizeOptions: form.sizeOptions.filter((s) => s.label.trim()),
      };
      const res = await fetch(cakeId ? `/api/cakes/${cakeId}` : "/api/cakes", {
        method: cakeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not save cake");
      toast.success(cakeId ? "Cake updated" : "Cake added");
      router.push("/baker/dashboard/cakes");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-cocoa-700">Photos</label>
        <ImageUploader value={form.images} onChange={(v) => update("images", v)} multiple />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-cocoa-700">Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-cocoa-700">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
          className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
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
          <label className="mb-1 block text-sm font-medium text-cocoa-700">Price (KES)</label>
          <input
            required
            type="number"
            min="1"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-cocoa-700">Sale price (optional)</label>
          <input
            type="number"
            min="1"
            value={form.discountPrice || ""}
            onChange={(e) => update("discountPrice", e.target.value)}
            className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-cocoa-700">Size options</label>
        <div className="flex flex-col gap-2">
          {form.sizeOptions.map((size, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Label (e.g. Large - serves 30)"
                value={size.label}
                onChange={(e) => updateSize(i, "label", e.target.value)}
                className="flex-1 rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-400"
              />
              <input
                type="number"
                placeholder="+KES"
                value={size.priceModifier}
                onChange={(e) => updateSize(i, "priceModifier", Number(e.target.value))}
                className="w-24 rounded-xl border border-cream-300 px-3 py-2 text-sm outline-none focus:border-terracotta-400"
              />
              <button type="button" onClick={() => removeSize(i)} className="rounded-lg px-2 text-cocoa-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addSize} className="flex items-center gap-1 self-start text-sm font-medium text-terracotta-600">
            <Plus size={14} /> Add size
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-cocoa-700">
          <input type="checkbox" checked={form.isAvailable} onChange={(e) => update("isAvailable", e.target.checked)} />
          Available
        </label>
        <label className="flex items-center gap-2 text-sm text-cocoa-700">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
          Featured
        </label>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving…" : cakeId ? "Save Changes" : "Add Cake"}
      </Button>
    </form>
  );
}
