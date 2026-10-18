import { useState } from "react";
import { MessageCircle, Smartphone, CheckCircle2 } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/currency";
import { buildOrderMessage, buildWhatsAppLink } from "@/lib/whatsapp";

export default function CheckoutPage() {
  const { bakery, items, totalAmount, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0 && !placed) {
    return (
      <PublicLayout title="Checkout">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <EmptyState title="Your cart is empty" description="Add some cakes before checking out." action={<Button href="/cakes" className="mt-2">Shop Cakes</Button>} />
        </div>
      </PublicLayout>
    );
  }

  if (placed) {
    return (
      <PublicLayout title="Order Sent">
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
          <CheckCircle2 className="mx-auto text-terracotta-500" size={48} />
          <h1 className="mt-4 font-heading text-xl font-bold text-cocoa-900">Order sent!</h1>
          <p className="mt-2 text-sm text-cocoa-500">
            We opened WhatsApp with your order details — send the message to {bakery?.name} to confirm.
          </p>
          <Button href="/cakes" className="mt-6">Continue Shopping</Button>
        </div>
      </PublicLayout>
    );
  }

  async function handleOrderOnWhatsApp(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakeryId: bakery.id,
          customerName: name,
          customerPhone: phone,
          items: items.map((i) => ({ cakeId: i.cakeId, name: i.name, price: i.price, qty: i.qty })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not place order");
      }

      const message = buildOrderMessage({ bakeryName: bakery.name, items, totalAmount, customerName: name });
      window.open(buildWhatsAppLink(bakery.whatsappNumber, message), "_blank");
      clearCart();
      setPlaced(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout title="Checkout">
      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-cocoa-900">Checkout</h1>
        <p className="mt-1 text-sm text-cocoa-500">Ordering from {bakery?.name}</p>

        <div className="mt-6 rounded-2xl border border-cream-300 bg-white p-4">
          {items.map((item) => (
            <div key={`${item.cakeId}-${item.size}`} className="flex justify-between py-1 text-sm text-cocoa-600">
              <span>{item.qty}× {item.name}{item.size ? ` (${item.size})` : ""}</span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-cream-300 pt-2 font-heading text-base font-bold text-cocoa-900">
            <span>Total</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleOrderOnWhatsApp} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-cocoa-700">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
              placeholder="Jane Wanjiru"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-cocoa-700">Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
              placeholder="07xx xxx xxx"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            <MessageCircle size={18} /> {submitting ? "Placing order…" : "Order via WhatsApp"}
          </Button>

          <button
            type="button"
            disabled
            title="M-Pesa payments are coming soon"
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-cream-300 px-6 py-3 text-base font-medium text-cocoa-300"
          >
            <Smartphone size={18} /> Pay with M-Pesa (coming soon)
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}
