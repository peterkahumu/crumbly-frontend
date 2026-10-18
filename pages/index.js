import Link from "next/link";
import PublicLayout from "@/components/layout/PublicLayout";
import CategoryFilterBar from "@/components/cakes/CategoryFilterBar";
import CakeCard from "@/components/cakes/CakeCard";
import BakeryCard from "@/components/bakery/BakeryCard";
import Button from "@/components/ui/Button";

import { ArrowRight, Sparkles, ShieldCheck, MessageSquare, HeartHandshake } from "lucide-react";

export default function Home({ categories, featuredCakes, bakeries }) {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-terracotta-100/90 via-cream-100 to-cream-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-terracotta-500/10 px-3.5 py-1.5 text-xs font-bold text-terracotta-700 border border-terracotta-200/60 mb-4">
                <Sparkles size={14} className="text-terracotta-600" /> Handmade with Love, Near You
              </div>
              <h1 className="font-heading text-4xl font-extrabold tracking-tight text-cocoa-950 sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
                Beautiful cakes, baked by real artisan bakers in your city.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-cocoa-700 sm:text-lg lg:text-xl">
                Browse wedding cakes, birthday cakes, cupcakes, and bespoke delicacies from independent local bakeries — then connect and order directly via WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button href="/cakes" size="lg" className="shadow-md text-base px-7 py-3.5">
                  Shop All Cakes <ArrowRight size={18} />
                </Button>
                <Button href="/auth/register" variant="outline" size="lg" className="text-base px-7 py-3.5">
                  List Your Bakery
                </Button>
              </div>

              {/* Trust Badges Row */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-cream-300/80 pt-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-500/10 text-terracotta-600">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cocoa-900">Verified Bakers</p>
                    <p className="text-[11px] text-cocoa-500">Curated artisanal kitchens</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-500/10 text-terracotta-600">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cocoa-900">Direct WhatsApp</p>
                    <p className="text-[11px] text-cocoa-500">Custom orders & chat</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-500/10 text-terracotta-600">
                    <HeartHandshake size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cocoa-900">Support Local</p>
                    <p className="text-[11px] text-cocoa-500">100% independent bakers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Showcase */}
            <div className="lg:col-span-5 xl:col-span-4 hidden sm:grid grid-cols-2 gap-3.5">
              {featuredCakes.slice(0, 4).map((cake, i) => (
                <Link
                  key={cake.id}
                  href={`/bakery/${cake.bakery.slug}/cakes/${cake.slug}`}
                  className={`group relative overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-md hover:shadow-xl transition-all duration-300 ${
                    i === 0 ? "sm:translate-y-4" : i === 3 ? "sm:-translate-y-4" : ""
                  }`}
                >
                  <div className="aspect-square w-full overflow-hidden bg-cream-100">
                    {cake.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cake.images[0]}
                        alt={cake.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-cocoa-400">Cake</div>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    <p className="font-heading text-xs font-bold text-cocoa-900 truncate">{cake.name}</p>
                    <p className="text-[11px] text-cocoa-500 truncate">{cake.bakery?.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="mx-auto max-w-[1600px] w-full px-4 py-10 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-cocoa-900 sm:text-2xl">Shop by Category</h2>
          <Button href="/cakes" variant="ghost" size="sm">
            All Categories <ArrowRight size={14} />
          </Button>
        </div>
        <CategoryFilterBar categories={categories} />
      </section>

      {/* Featured Cakes Section */}
      {featuredCakes.length > 0 && (
        <section className="mx-auto max-w-[1600px] w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-cocoa-900 sm:text-2xl">Featured Cakes</h2>
              <p className="text-xs text-cocoa-500 mt-0.5">Handcrafted masterpieces from verified bakeries</p>
            </div>
            <Button href="/cakes" variant="ghost" size="sm">
              View All <ArrowRight size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
            {featuredCakes.map((cake) => (
              <CakeCard key={cake.id} cake={cake} bakerySlug={cake.bakery.slug} bakeryName={cake.bakery.name} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Bakeries Section */}
      {bakeries.length > 0 && (
        <section className="mx-auto max-w-[1600px] w-full px-4 py-12 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-cocoa-900 sm:text-2xl">Popular Bakehouses</h2>
              <p className="text-xs text-cocoa-500 mt-0.5">Discover top-rated local bakeries and pâtisseries</p>
            </div>
            <Button href="/bakeries" variant="ghost" size="sm">
              All Bakers <ArrowRight size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
            {bakeries.map((bakery) => (
              <BakeryCard key={bakery.id} bakery={bakery} />
            ))}
          </div>
        </section>
      )}
    </PublicLayout>
  );
}

export async function getServerSideProps() {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/public/home`);
    if (!res.ok) throw new Error("Failed to fetch home data");
    const data = await res.json();
    
    return {
      props: {
        categories: data.categories || [],
        featuredCakes: data.featuredCakes || [],
        bakeries: data.bakeries || [],
      },
    };
  } catch (error) {
    console.error("Error fetching home data:", error);
    return {
      props: { categories: [], featuredCakes: [], bakeries: [] },
    };
  }
}
