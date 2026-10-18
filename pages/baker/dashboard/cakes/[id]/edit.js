import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "@/pages/baker/dashboard/index";
import CakeForm from "@/components/dashboard/CakeForm";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function EditCake({ categories, cake }) {
  return (
    <DashboardLayout title="Edit Cake" navItems={BAKER_NAV}>
      <CakeForm
        categories={categories}
        cakeId={cake.id}
        initial={{
          name: cake.name,
          categoryId: cake.categoryId,
          description: cake.description || "",
          price: cake.price,
          discountPrice: cake.discountPrice || "",
          images: cake.images,
          sizeOptions: cake.sizeOptions?.length ? cake.sizeOptions : [{ label: "Standard", priceModifier: 0 }],
          isAvailable: cake.isAvailable,
          isFeatured: cake.isFeatured,
        }}
      />
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "BAKER");
  if (guard.redirect) return guard;

  try {
    const authHeaders = { Authorization: `Bearer ${guard.session.accessToken}` };
    const [cake, categories] = await Promise.all([
      backendFetch(`/api/cakes/${encodeURIComponent(ctx.params.id)}`, { headers: authHeaders }),
      backendFetch("/api/categories"),
    ]);

    return {
      props: {
        categories,
        cake,
      },
    };
  } catch (err) {
    return { notFound: true };
  }
}
