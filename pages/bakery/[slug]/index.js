import { useState } from "react";
import Image from "next/image";
import { MapPin, Images, MessageCircle } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import CategoryFilterBar from "@/components/cakes/CategoryFilterBar";
import CakeCard from "@/components/cakes/CakeCard";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import ChatWidget from "@/components/messaging/ChatWidget";

export default function BakeryStorefront({ bakery, categories, cakes, filters }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const whatsappLink = buildWhatsAppLink(
    bakery.whatsappNumber,
    `Hi ${bakery.name}! I found your bakery on Crumbly and I'd like to ask about your cakes.`
  );

  return (
    <PublicLayout title={bakery.name} description={bakery.description}>
      {/* Bakery Hero Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-r from-cream-300 via-terracotta-100 to-cream-200 sm:h-64 lg:h-72">
        {bakery.coverImageUrl ? (
          <>
            <Image
              src={bakery.coverImageUrl}
              alt={bakery.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa-900/60 via-cocoa-900/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="font-heading text-6xl font-bold tracking-widest text-cocoa-400">CRUMBLY</span>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Bakery Profile Header */}
        <div className="-mt-14 relative z-10 rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:-mt-16 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={bakery.name}
                src={bakery.logoUrl}
                size={88}
                className="border-4 border-white shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold text-cocoa-900 sm:text-3xl lg:text-4xl">{bakery.name}</h1>
                  <span className="hidden rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 sm:inline-flex">
                    Verified Baker
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-cocoa-500">
                  <MapPin size={15} className="text-terracotta-500" /> {bakery.city}
                  {bakery.address && <span>· {bakery.address}</span>}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Button href={`/bakery/${bakery.slug}/portfolio`} variant="outline" size="md" className="flex-1 sm:flex-none">
                <Images size={16} /> View Portfolio
              </Button>
              <Button
                onClick={() => setIsChatOpen((prev) => !prev)}
                variant="outline"
                size="md"
                className="flex-1 sm:flex-none border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50"
              >
                <MessageCircle size={16} /> Message Baker
              </Button>
              <Button as="a" href={whatsappLink} target="_blank" rel="noopener noreferrer" variant="primary" size="md" className="flex-1 sm:flex-none shadow-sm">
                Chat on WhatsApp
              </Button>
            </div>
          </div>

          {bakery.description && (
            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-cocoa-600 border-t border-cream-100 pt-4">
              {bakery.description}
            </p>
          )}
        </div>

        {/* Menu & Catalog */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-cocoa-900 sm:text-2xl">Available Menu</h2>
              <p className="text-xs text-cocoa-400">Fresh handmade cakes baked to order</p>
            </div>
            <span className="text-xs font-medium text-cocoa-400">
              {cakes.length} {cakes.length === 1 ? "cake" : "cakes"}
            </span>
          </div>

          <div className="mt-4">
            <CategoryFilterBar categories={categories} activeSlug={filters.category} basePath={`/bakery/${bakery.slug}`} />
          </div>
        </div>

        <div className="mb-20 mt-6">
          {cakes.length === 0 ? (
            <EmptyState title="No cakes in this category yet" description="Check back soon or browse another category." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
              {cakes.map((cake) => (
                <CakeCard key={cake.id} cake={cake} bakerySlug={bakery.slug} />
              ))}
            </div>
          )}
        </div>
      </div>
      <ChatWidget
        bakeryId={bakery.id}
        bakeryName={bakery.name}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
      />
    </PublicLayout>
  );
}

export async function getServerSideProps({ params, query }) {
  const { category } = query;
  try {
    const url = `/api/public/bakery/${encodeURIComponent(params.slug)}${category ? `?category=${encodeURIComponent(category)}` : ""}`;
    const data = await backendFetch(url);
    return {
      props: {
        bakery: data.bakery,
        categories: data.categories,
        cakes: data.cakes,
        filters: { category: category ?? null },
      },
    };
  } catch (err) {
    return { notFound: true };
  }
}
