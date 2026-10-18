import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/currency";

export default function CartPage() {
  const { bakery, items, updateQty, removeItem, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <PublicLayout title="Your Cart">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse cakes from local bakers and add your favorites here."
            action={<Button href="/cakes" className="mt-2">Shop Cakes</Button>}
          />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="Your Cart">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-cocoa-900">Your Cart</h1>
        {bakery && (
          <p className="mt-1 text-sm text-cocoa-500">
            Ordering from <span className="font-semibold text-cocoa-700">{bakery.name}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {items.map((item) => (
            <div key={`${item.cakeId}-${item.size}`} className="flex gap-3 rounded-2xl border border-cream-300 bg-white p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <p className="font-heading text-sm font-semibold text-cocoa-800">{item.name}</p>
                {item.size && <p className="text-xs text-cocoa-400">{item.size}</p>}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-cream-300">
                    <button onClick={() => updateQty(item.cakeId, item.size, item.qty - 1)} className="p-1.5 text-cocoa-600" aria-label="Decrease">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.cakeId, item.size, item.qty + 1)} className="p-1.5 text-cocoa-600" aria-label="Increase">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-heading text-sm font-bold text-terracotta-600">{formatPrice(item.price * item.qty)}</span>
                </div>
              </div>
              <button onClick={() => removeItem(item.cakeId, item.size)} className="self-start text-cocoa-300 hover:text-red-500" aria-label="Remove item">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-cream-300 pt-4">
          <span className="font-heading text-base font-semibold text-cocoa-800">Total</span>
          <span className="font-heading text-xl font-bold text-terracotta-600">{formatPrice(totalAmount)}</span>
        </div>

        <Button href="/checkout" size="lg" className="mt-6 w-full">
          Proceed to Checkout
        </Button>
        <p className="mt-3 text-center text-xs text-cocoa-400">
          Cakes from <Link href={`/bakery/${bakery?.slug}`} className="underline">{bakery?.name}</Link> only. Add cakes
          from another bakery to switch your order.
        </p>
      </div>
    </PublicLayout>
  );
}
