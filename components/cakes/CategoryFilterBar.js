import Link from "next/link";
import { useRouter } from "next/router";
import clsx from "clsx";

/**
 * Horizontally-scrollable category chip row (wedding cakes, birthday cakes,
 * etc). Preserves active URL query parameters (e.g. city, sort, q) when switching
 * categories or clearing back to All Cakes
 */
export default function CategoryFilterBar({ categories, activeSlug, basePath }) {
  const router = useRouter();
  const currentPath = basePath || (router?.pathname === "/bakery/[slug]" ? `/bakery/${router.query.slug}` : "/cakes");

  function getCategoryHref(slug) {
    if (!router?.isReady || !router?.query) {
      return slug ? `${currentPath}?category=${slug}` : currentPath;
    }

    const newQuery = { ...router.query };
    if (slug) {
      newQuery.category = slug;
    } else {
      delete newQuery.category;
    }

    // Reset pagination when switching categories
    delete newQuery.page;
    // Don't leak Next.js dynamic path params as query params
    delete newQuery.slug;

    const searchParams = new URLSearchParams();
    Object.entries(newQuery).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.set(k, String(v));
      }
    });

    const qs = searchParams.toString();
    return qs ? `${currentPath}?${qs}` : currentPath;
  }

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <Link
        href={getCategoryHref(null)}
        className={clsx(
          "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          !activeSlug ? "border-terracotta-500 bg-terracotta-500 text-white" : "border-cream-300 bg-white text-cocoa-600 hover:border-terracotta-300"
        )}
      >
        All Cakes
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={getCategoryHref(cat.slug)}
          className={clsx(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            activeSlug === cat.slug ? "border-terracotta-500 bg-terracotta-500 text-white" : "border-cream-300 bg-white text-cocoa-600 hover:border-terracotta-300"
          )}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
