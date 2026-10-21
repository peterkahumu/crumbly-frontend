import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, MessageCircle } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { backendFetch } from "@/lib/backend";
import { formatPrice } from "@/lib/currency";
import { buildWhatsAppLink, buildOrderMessage } from "@/lib/whatsapp";
import { useCart } from "@/context/CartContext";
import ChatWidget from "@/components/messaging/ChatWidget";

export default function CakeDetail({ cake, bakery }) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(cake.sizeOptions?.[0]?.label ?? null);

  const sizeModifier = cake.sizeOptions?.find((s) => s.label === size)?.priceModifier ?? 0;
  const unitPrice = (cake.discountPrice ?? cake.price) + sizeModifier;
  const hasDiscount = cake.discountPrice && cake.discountPrice < cake.price;

  function handleAddToCart() {
    addItem(
      { id: bakery.id, slug: bakery.slug, name: bakery.name, whatsappNumber: bakery.whatsappNumber },
      { ...cake, price: unitPrice, discountPrice: null },
      qty,
      size
    );
  }

  function handleOrderOnWhatsApp() {
    const message = buildOrderMessage({
      bakeryName: bakery.name,
      items: [{ name: `${cake.name}${size ? ` (${size})` : ""}`, price: unitPrice, qty }],
      totalAmount: unitPrice * qty,
    });
    window.open(buildWhatsAppLink(bakery.whatsappNumber, message), "_blank");
  }

  return (
    <PublicLayout title={cake.name} description={cake.description}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={`/bakery/${bakery.slug}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-500 hover:text-terracotta-600 transition-colors">
          <ArrowLeft size={16} /> Back to {bakery.name}
        </Link>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream-200">
              {cake.images?.[activeImage] && (
                <Image src={cake.images[activeImage]} alt={cake.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
              )}
              {!cake.isAvailable && (
                <span className="absolute inset-0 flex items-center justify-center bg-cocoa-900/50 text-lg font-semibold text-white">
                  Sold out
                </span>
              )}
            </div>
            {cake.images?.length > 1 && (
              <div className="mt-3 flex gap-2">
                {cake.images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${i === activeImage ? "border-terracotta-500" : "border-transparent"}`}
                  >
                    <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 xl:col-span-5 flex flex-col">
            {cake.isFeatured && <Badge tone="warning" className="mb-2 w-fit">Featured</Badge>}
            <h1 className="font-heading text-2xl font-bold text-cocoa-900">{cake.name}</h1>
            <p className="mt-1 text-sm text-cocoa-500">by {bakery.name} · {bakery.city}</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-heading text-2xl font-bold text-terracotta-600">{formatPrice(unitPrice)}</span>
              {hasDiscount && <span className="text-sm text-cocoa-300 line-through">{formatPrice(cake.price + sizeModifier)}</span>}
            </div>

            {cake.description && <p className="mt-4 text-sm leading-relaxed text-cocoa-600">{cake.description}</p>}

            {cake.sizeOptions?.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-cocoa-700">Size</p>
                <div className="flex flex-wrap gap-2">
                  {cake.sizeOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSize(opt.label)}
                      className={`rounded-full border px-3 py-1.5 text-sm ${size === opt.label ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700" : "border-cream-300 text-cocoa-600"}`}
                    >
                      {opt.label}
                      {opt.priceModifier > 0 && ` (+${formatPrice(opt.priceModifier)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <p className="text-sm font-semibold text-cocoa-700">Quantity</p>
              <div className="flex items-center rounded-full border border-cream-300">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 text-cocoa-600" aria-label="Decrease quantity">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-2 text-cocoa-600" aria-label="Increase quantity">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleAddToCart} disabled={!cake.isAvailable} size="lg" className="flex-1">
                <ShoppingBag size={18} /> Add to Cart
              </Button>
              <Button onClick={handleOrderOnWhatsApp} disabled={!cake.isAvailable} variant="outline" size="lg" className="flex-1">
                <MessageCircle size={18} /> Order on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ChatWidget bakeryId={bakery.id} bakeryName={bakery.name} />
    </PublicLayout>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const data = await backendFetch(`/api/public/bakery/${encodeURIComponent(params.slug)}/cakes/${encodeURIComponent(params.cakeSlug)}`);
    return {
      props: {
        bakery: data.bakery,
        cake: data.cake,
      },
    };
  } catch (err) {
    return { notFound: true };
  }
}
