import { useRouter } from "next/router";
import PublicLayout from "@/components/layout/PublicLayout";
import BakeryCard from "@/components/bakery/BakeryCard";
import EmptyState from "@/components/ui/EmptyState";
import { backendFetch } from "@/lib/backend";
import { Store } from "lucide-react";

export default function BakeriesDirectory({ bakeries, cities, filters }) {
  const router = useRouter();

  function updateCity(value) {
    router.push({ pathname: "/bakeries", query: { ...router.query, city: value || undefined } });
  }

  return (
    <PublicLayout title="Browse Bakers" description="Discover independent bakeries and pâtissiers near you.">
      <div className="mx-auto max-w-[1600px] w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-cocoa-900 sm:text-3xl lg:text-4xl">Browse Bakers</h1>
            <p className="mt-1 text-sm text-cocoa-500">{bakeries.length} independent artisan bakeries ready to take your order</p>
          </div>
          <select
            value={filters?.city ?? ""}
            onChange={(e) => updateCity(e.target.value)}
            className="rounded-full border border-cream-300 bg-white px-4 py-2 text-sm text-cocoa-700 shadow-sm outline-none focus:border-terracotta-400"
          >
            <option value="">All cities</option>
            {(cities || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="mt-8">
          {bakeries.length === 0 ? (
            <EmptyState icon={Store} title="No bakers found" description="Try a different city." />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {bakeries.map((bakery) => (
                <BakeryCard key={bakery.id} bakery={bakery} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

export async function getServerSideProps({ query }) {
  const { city } = query;
  const param = city ? `?city=${encodeURIComponent(city)}` : "";

  try {
    const data = await backendFetch(`/api/public/bakeries${param}`);
    return {
      props: {
        bakeries: data.bakeries || [],
        cities: data.cities || [],
        filters: data.filters || { city: city ?? null },
      },
    };
  } catch (err) {
    return {
      props: {
        bakeries: [],
        cities: [],
        filters: { city: city ?? null },
      },
    };
  }
}
