import { useRouter } from "next/router";
import Link from "next/link";
import { Search as SearchIcon, X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import CategoryFilterBar from "@/components/cakes/CategoryFilterBar";
import CakeCard from "@/components/cakes/CakeCard";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";

const PAGE_SIZES = [24, 48, 96];
const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

export default function CakesCatalog({ categories, cakes, cities, totalCount, page, totalPages, pageSize, priceRange, filters }) {
  const router = useRouter();

  function updateFilter(key, value) {
    const query = { ...router.query, [key]: value || undefined };
    delete query.page; // Reset to page 1 on filter changes
    router.push({ pathname: "/cakes", query });
  }

  function clearAllFilters() {
    router.push({ pathname: "/cakes" });
  }

  function goToPage(newPage) {
    const query = { ...router.query, page: newPage > 1 ? newPage : undefined };
    router.push({ pathname: "/cakes", query });
  }

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const hasActiveFilters = Boolean(
    filters.category ||
      filters.city ||
      filters.q ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.sort !== "newest"
  );

  const startItem = totalCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <PublicLayout
      title={activeCategory ? `${activeCategory.name} | Shop Cakes` : "Shop Cakes"}
      description="Browse cakes from independent bakers, filterable by category, city and price."
    >
      <div className="mx-auto max-w-[1600px] w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header Title & Counter */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-cream-200/80 pb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-cocoa-900 sm:text-3xl lg:text-4xl">
              {activeCategory ? activeCategory.name : "Shop All Cakes"}
            </h1>
            <p className="mt-1 text-sm text-cocoa-500">
              {activeCategory
                ? `Explore handcrafted ${activeCategory.name.toLowerCase()} baked fresh by verified artisan bakeries.`
                : "Discover fresh handmade cakes baked by local artisan bakeries near you."}
            </p>
          </div>
          <span className="text-sm font-medium text-cocoa-500">
            {totalCount === 0
              ? "0 cakes found"
              : totalPages > 1
              ? `Showing ${startItem}–${endItem} of ${totalCount} cakes`
              : `${totalCount} ${totalCount === 1 ? "cake" : "cakes"} available`}
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* City Dropdown */}
            <select
              value={filters.city ?? ""}
              onChange={(e) => updateFilter("city", e.target.value)}
              className="rounded-full border border-cream-300 bg-white px-3.5 py-2 text-sm font-medium text-cocoa-700 shadow-sm outline-none transition-colors hover:border-terracotta-300 focus:border-terracotta-500"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={filters.sort ?? "newest"}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="rounded-full border border-cream-300 bg-white px-3.5 py-2 text-sm font-medium text-cocoa-700 shadow-sm outline-none transition-colors hover:border-terracotta-300 focus:border-terracotta-500"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {/* Price range, bounded by what is actually listed */}
            <span className="flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-3 py-1.5 shadow-sm">
              <label htmlFor="min-price" className="sr-only">
                Minimum price
              </label>
              <input
                id="min-price"
                type="number"
                inputMode="numeric"
                min={priceRange.min}
                max={priceRange.max}
                step="500"
                placeholder={String(priceRange.min)}
                defaultValue={filters.minPrice ?? ""}
                onBlur={(e) => updateFilter("minPrice", e.target.value)}
                className="w-20 bg-transparent text-sm font-medium text-cocoa-700 outline-none"
              />
              <span className="text-xs text-cocoa-400">–</span>
              <label htmlFor="max-price" className="sr-only">
                Maximum price
              </label>
              <input
                id="max-price"
                type="number"
                inputMode="numeric"
                min={priceRange.min}
                max={priceRange.max}
                step="500"
                placeholder={String(priceRange.max)}
                defaultValue={filters.maxPrice ?? ""}
                onBlur={(e) => updateFilter("maxPrice", e.target.value)}
                className="w-20 bg-transparent text-sm font-medium text-cocoa-700 outline-none"
              />
              <span className="text-xs font-medium text-cocoa-400">KSh</span>
            </span>

            <label className="sr-only" htmlFor="per-page">
              Cakes per page
            </label>
            <select
              id="per-page"
              value={pageSize}
              onChange={(e) => updateFilter("perPage", e.target.value)}
              className="rounded-full border border-cream-300 bg-white px-3.5 py-2 text-sm font-medium text-cocoa-700 shadow-sm outline-none transition-colors hover:border-terracotta-300 focus:border-terracotta-500"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>

            {/* Clear All Button */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-terracotta-600 hover:bg-terracotta-50 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-cocoa-400">Active:</span>

            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-50 border border-terracotta-200 px-3 py-1 text-xs font-medium text-terracotta-700">
                Category: <strong>{activeCategory.name}</strong>
                <button
                  onClick={() => updateFilter("category", "")}
                  className="rounded-full p-0.5 hover:bg-terracotta-200/60 text-terracotta-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.city && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 border border-cream-300 px-3 py-1 text-xs font-medium text-cocoa-700">
                City: <strong>{filters.city}</strong>
                <button
                  onClick={() => updateFilter("city", "")}
                  className="rounded-full p-0.5 hover:bg-cream-200 text-cocoa-500"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.q && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 border border-cream-300 px-3 py-1 text-xs font-medium text-cocoa-700">
                Search: <strong>“{filters.q}”</strong>
                <button
                  onClick={() => updateFilter("q", "")}
                  className="rounded-full p-0.5 hover:bg-cream-200 text-cocoa-500"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {(filters.minPrice != null || filters.maxPrice != null) && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-100 px-3 py-1 text-xs font-medium text-cocoa-700">
                Price:{" "}
                <strong>
                  {filters.minPrice != null ? `KSh ${filters.minPrice.toLocaleString("en-KE")}` : "Any"} –{" "}
                  {filters.maxPrice != null ? `KSh ${filters.maxPrice.toLocaleString("en-KE")}` : "Any"}
                </strong>
                <button
                  onClick={() => {
                    const query = { ...router.query };
                    delete query.minPrice;
                    delete query.maxPrice;
                    delete query.page;
                    router.push({ pathname: "/cakes", query });
                  }}
                  className="rounded-full p-0.5 text-cocoa-500 hover:bg-cream-200"
                  aria-label="Clear price filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            {filters.sort !== "newest" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 border border-cream-300 px-3 py-1 text-xs font-medium text-cocoa-700">
                Sort: <strong>{filters.sort === "price_asc" ? "Price: Low to High" : "Price: High to Low"}</strong>
                <button
                  onClick={() => updateFilter("sort", "newest")}
                  className="rounded-full p-0.5 hover:bg-cream-200 text-cocoa-500"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Category Chip Bar */}
        <div className="mt-5">
          <CategoryFilterBar categories={categories} activeSlug={filters.category} />
        </div>

        {/* Cake Grid or Empty State */}
        <div className="mt-8">
          {cakes.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No cakes found"
              description="Try selecting a different category, city, or clearing your search filters."
              action={
                hasActiveFilters
                  ? {
                      label: "Clear all filters",
                      onClick: clearAllFilters,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6">
              {cakes.map((cake) => (
                <CakeCard key={cake.id} cake={cake} bakerySlug={cake.bakery?.slug || ""} bakeryName={cake.bakery?.name || ""} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 border-t border-cream-200/80 pt-8">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-full border border-cream-300 bg-white px-3.5 py-2 text-xs font-semibold text-cocoa-700 transition-colors hover:border-terracotta-300 hover:text-terracotta-600 disabled:opacity-40 disabled:hover:border-cream-300 disabled:hover:text-cocoa-700"
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                    page === pageNum
                      ? "bg-terracotta-500 text-white shadow-sm"
                      : "bg-cream-50 text-cocoa-600 hover:bg-cream-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-full border border-cream-300 bg-white px-3.5 py-2 text-xs font-semibold text-cocoa-700 transition-colors hover:border-terracotta-300 hover:text-terracotta-600 disabled:opacity-40 disabled:hover:border-cream-300 disabled:hover:text-cocoa-700"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

export async function getServerSideProps({ query }) {
  const { category, q, city, sort, page, perPage, minPrice, maxPrice } = query;
  const params = new URLSearchParams();
  if (category) params.set("category", String(category));
  if (q) params.set("search", String(q));
  if (city) params.set("city", String(city));
  if (sort) params.set("sort", String(sort));
  if (page) params.set("page", String(page));
  if (perPage) params.set("page_size", String(perPage));
  if (minPrice) params.set("min_price", String(minPrice));
  if (maxPrice) params.set("max_price", String(maxPrice));

  try {
    const data = await backendFetch(`/api/public/cakes?${params.toString()}`);
    return { props: data };
  } catch (err) {
    return {
      props: {
        categories: [],
        cakes: [],
        cities: [],
        totalCount: 0,
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        priceRange: { min: 0, max: 0 },
        filters: {
          category: category ?? null,
          q: q ?? null,
          city: city ?? null,
          sort: sort ?? "newest",
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null,
        },
      },
    };
  }
}
