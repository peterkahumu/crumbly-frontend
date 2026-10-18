import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getServerSession } from "next-auth/next";
import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { authOptions } from "@/lib/auth";

const FIELDS = [
  { name: "bakeryName", label: "Bakery name", placeholder: "Sweet Crumbs Bakery" },
  { name: "name", label: "Your name", placeholder: "Jane Wanjiru" },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password" },
  { name: "phone", label: "Phone (optional)", placeholder: "07xx xxx xxx" },
  { name: "whatsappNumber", label: "WhatsApp Business number", placeholder: "07xx xxx xxx" },
  { name: "city", label: "City", placeholder: "Nairobi" },
];

export default function Register() {
  const [form, setForm] = useState({});
  const [modalState, setModalState] = useState({ isOpen: false, title: "", message: "", tone: "danger" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Unable to submit application");
      }
      setDone(true);
    } catch (err) {
      setModalState({
        isOpen: true,
        title: "Registration Failed",
        message: err.message || "Failed to submit application. Please check your information and try again.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <PublicLayout title="Application Submitted">
        <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
          <CheckCircle2 className="mx-auto text-terracotta-500" size={48} />
          <h1 className="mt-4 font-heading text-xl font-bold text-cocoa-900">Application submitted!</h1>
          <p className="mt-2 text-sm text-cocoa-500">
            Our team will review your bakery and approve it shortly. You can log in once it&apos;s approved.
          </p>
          <Button href="/auth/login" className="mt-6">Go to Login</Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="List Your Bakery">
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        description={modalState.message}
        tone={modalState.tone}
        position="top"
        primaryAction={{
          label: "Got it",
          onClick: () => setModalState((prev) => ({ ...prev, isOpen: false })),
        }}
      />

      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="font-heading text-2xl font-bold text-cocoa-900">List Your Bakery</h1>
        <p className="mt-1 text-sm text-cocoa-500">
          Get your own storefront on Crumbly — manage your cakes, prices and portfolio.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <label className="mb-1 block text-sm font-medium text-cocoa-700">{field.label}</label>
              <input
                type={field.type || "text"}
                placeholder={field.placeholder}
                required={field.name !== "phone"}
                value={form[field.name] || ""}
                onChange={(e) => update(field.name, e.target.value)}
                className="w-full rounded-xl border border-cream-300 px-3 py-2.5 text-sm outline-none focus:border-terracotta-400"
              />
            </div>
          ))}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Submitting…" : "Submit Application"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-cocoa-500">
          Already listed?{" "}
          <Link href="/auth/login" className="font-medium text-terracotta-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) {
    return {
      redirect: { destination: session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/baker/dashboard", permanent: false },
    };
  }
  return { props: {} };
}
