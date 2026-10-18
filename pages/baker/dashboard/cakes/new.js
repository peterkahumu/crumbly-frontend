import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { BAKER_NAV } from "@/pages/baker/dashboard/index";
import CakeForm from "@/components/dashboard/CakeForm";
import { backendFetch } from "@/lib/backend";
import { requireRole } from "@/lib/session";

export default function NewCake({ categories }) {
  return (
    <DashboardLayout title="Add Cake" navItems={BAKER_NAV}>
      <CakeForm categories={categories} />
    </DashboardLayout>
  );
}

export async function getServerSideProps(ctx) {
  const guard = await requireRole(ctx, "BAKER");
  if (guard.redirect) return guard;

  try {
    const categories = await backendFetch("/api/categories");
    return { props: { categories } };
  } catch (err) {
    return { props: { categories: [] } };
  }
}
