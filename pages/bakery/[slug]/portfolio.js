import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import PortfolioGrid from "@/components/bakery/PortfolioGrid";
import { backendFetch } from "@/lib/backend";
import ChatWidget from "@/components/messaging/ChatWidget";

export default function BakeryPortfolio({ bakery, portfolio }) {
  return (
    <PublicLayout title={`${bakery.name} — Portfolio`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={`/bakery/${bakery.slug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-500 hover:text-terracotta-600 transition-colors">
          <ArrowLeft size={16} /> Back to {bakery.name}
        </Link>
        <h1 className="font-heading text-2xl font-bold text-cocoa-900 sm:text-3xl">{bakery.name}&apos;s Portfolio</h1>
        <p className="mt-1 mb-8 text-sm text-cocoa-500">A look at custom creations, wedding designs, and celebration cakes by this baker.</p>
        <PortfolioGrid items={portfolio} />
      </div>
      <ChatWidget bakeryId={bakery.id} />
    </PublicLayout>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const data = await backendFetch(`/api/public/bakery/${encodeURIComponent(params.slug)}/portfolio`);
    return {
      props: {
        bakery: data.bakery,
        portfolio: data.portfolio,
      },
    };
  } catch (err) {
    return { notFound: true };
  }
}
