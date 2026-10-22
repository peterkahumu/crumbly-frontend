import { useState, useEffect } from "react";
import Link from "next/link";
import PublicLayout from "@/components/layout/PublicLayout";
import CategoryFilterBar from "@/components/cakes/CategoryFilterBar";
import CakeCard from "@/components/cakes/CakeCard";
import BakeryCard from "@/components/bakery/BakeryCard";
import Button from "@/components/ui/Button";

import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  HeartHandshake,
  RotateCw,
  AlertCircle,
} from "lucide-react";

export default function Home({
  categories: initialCategories = [],
  featuredCakes: initialFeaturedCakes = [],
  bakeries: initialBakeries = [],
  categoriesFailed = false,
  cakesFailed = false,
  bakeriesFailed = false,
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [featuredCakes, setFeaturedCakes] = useState(initialFeaturedCakes);
  const [bakeries, setBakeries] = useState(initialBakeries);

  const [categoriesError, setCategoriesError] = useState(categoriesFailed);
  const [cakesError, setCakesError] = useState(cakesFailed);
  const [bakeriesError, setBakeriesError] = useState(bakeriesFailed);

  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [cakesLoading, setCakesLoading] = useState(false);
  const [bakeriesLoading, setBakeriesLoading] = useState(false);

  // Independent fetch handlers for each section
  async function reloadCategories() {
    setCategoriesLoading(true);
    setCategoriesError(false);
    try {
      const res = await fetch("/api/public/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data.categories || data || []);
    } catch (err) {
      console.warn("Client fetch categories failed:", err);
      setCategoriesError(true);
    } finally {
      setCategoriesLoading(false);
    }
  }

  async function reloadFeaturedCakes() {
    setCakesLoading(true);
    setCakesError(false);
    try {
      const res = await fetch("/api/public/featured-cakes");
      if (!res.ok) throw new Error("Failed to load featured cakes");
      const data = await res.json();
      setFeaturedCakes(data.featuredCakes || data || []);
    } catch (err) {
      console.warn("Client fetch featured cakes failed:", err);
      setCakesError(true);
    } finally {
      setCakesLoading(false);
    }
  }

  async function reloadBakeries() {
    setBakeriesLoading(true);
    setBakeriesError(false);
    try {
      const res = await fetch("/api/public/featured-bakeries");
      if (!res.ok) throw new Error("Failed to load bakeries");
      const data = await res.json();
      setBakeries(data.bakeries || data || []);
    } catch (err) {
      console.warn("Client fetch bakeries failed:", err);
      setBakeriesError(true);
    } finally {
      setBakeriesLoading(false);
    }
  }

  // Automatic client recovery if any section failed during SSR
  useEffect(() => {
    if (categoriesFailed && categories.length === 0) {
      reloadCategories();
    }
    if (cakesFailed && featuredCakes.length === 0) {
      reloadFeaturedCakes();
    }
    if (bakeriesFailed && bakeries.length === 0) {
      reloadBakeries();
    }
  }, []);

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
            {featuredCakes.length > 0 && (
              <div className="lg:col-span-5 xl:col-span-4 hidden sm:grid grid-cols-2 gap-3.5">
                {featuredCakes.slice(0, 4).map((cake, i) => (
                  <Link
                    key={cake.id}
                    href={cake.bakery?.slug ? `/bakery/${cake.bakery.slug}/cakes/${cake.slug}` : `/cakes/${cake.slug}`}
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
            )}
          </div>
        </div>
      </section>

      {/* Categories Bar Section */}
      <section className="mx-auto max-w-[1600px] w-full px-4 py-10 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-cocoa-900 sm:text-2xl">Shop by Category</h2>
          <Button href="/cakes" variant="ghost" size="sm">
            All Categories <ArrowRight size={14} />
          </Button>
        </div>

        {categoriesLoading ? (
          <div className="flex gap-2.5 overflow-x-auto py-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-cream-200/70" />
            ))}
          </div>
        ) : categoriesError && categories.length === 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 p-4 text-xs text-cocoa-600">
            <span className="flex items-center gap-2">
              <AlertCircle size={15} className="text-terracotta-500" />
              Categories temporarily unavailable
            </span>
            <button
              onClick={reloadCategories}
              className="inline-flex items-center gap-1.5 font-semibold text-terracotta-600 hover:text-terracotta-700"
            >
              <RotateCw size={13} /> Try again
            </button>
          </div>
        ) : (
          <CategoryFilterBar categories={categories} />
        )}
      </section>

      {/* Featured Cakes Section */}
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

        {cakesLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-cream-200/70" />
            ))}
          </div>
        ) : cakesError && featuredCakes.length === 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 p-6 text-sm text-cocoa-600">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} className="text-terracotta-500" />
              Featured cakes couldn&apos;t be loaded right now.
            </span>
            <button
              onClick={reloadFeaturedCakes}
              className="inline-flex items-center gap-1.5 font-semibold text-terracotta-600 hover:text-terracotta-700"
            >
              <RotateCw size={14} /> Retry
            </button>
          </div>
        ) : featuredCakes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
            {featuredCakes.map((cake) => (
              <CakeCard key={cake.id} cake={cake} bakerySlug={cake.bakery?.slug || ""} bakeryName={cake.bakery?.name || ""} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Popular Bakeries Section */}
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

        {bakeriesLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-cream-200/70" />
            ))}
          </div>
        ) : bakeriesError && bakeries.length === 0 ? (
          <div className="flex items-center justify-between rounded-2xl border border-cream-200 bg-cream-50 p-6 text-sm text-cocoa-600">
            <span className="flex items-center gap-2">
              <AlertCircle size={16} className="text-terracotta-500" />
              Bakeries couldn&apos;t be loaded right now.
            </span>
            <button
              onClick={reloadBakeries}
              className="inline-flex items-center gap-1.5 font-semibold text-terracotta-600 hover:text-terracotta-700"
            >
              <RotateCw size={14} /> Retry
            </button>
          </div>
        ) : bakeries.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
            {bakeries.map((bakery) => (
              <BakeryCard key={bakery.id} bakery={bakery} />
            ))}
          </div>
        ) : null}
      </section>
    </PublicLayout>
  );
}

export async function getServerSideProps() {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

  // Execute independent parallel requests for each section
  const [categoriesRes, cakesRes, bakeriesRes] = await Promise.allSettled([
    fetch(`${backendUrl}/api/public/categories`, { signal: AbortSignal.timeout(8000) }).then(async (res) => {
      if (!res.ok) throw new Error(`Categories endpoint failed: ${res.status}`);
      const data = await res.json();
      return data.categories || data || [];
    }),
    fetch(`${backendUrl}/api/public/featured-cakes`, { signal: AbortSignal.timeout(8000) }).then(async (res) => {
      if (!res.ok) throw new Error(`Featured cakes endpoint failed: ${res.status}`);
      const data = await res.json();
      return data.featuredCakes || data || [];
    }),
    fetch(`${backendUrl}/api/public/featured-bakeries`, { signal: AbortSignal.timeout(8000) }).then(async (res) => {
      if (!res.ok) throw new Error(`Bakeries endpoint failed: ${res.status}`);
      const data = await res.json();
      return data.bakeries || data || [];
    }),
  ]);

  const categories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
  const featuredCakes = cakesRes.status === "fulfilled" ? cakesRes.value : [];
  const bakeries = bakeriesRes.status === "fulfilled" ? bakeriesRes.value : [];

  return {
    props: {
      categories,
      featuredCakes,
      bakeries,
      categoriesFailed: categoriesRes.status === "rejected",
      cakesFailed: cakesRes.status === "rejected",
      bakeriesFailed: bakeriesRes.status === "rejected",
    },
  };
}
