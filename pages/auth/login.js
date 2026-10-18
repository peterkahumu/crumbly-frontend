import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { authOptions } from "@/lib/auth";

const ERROR_MESSAGES = {
  BAKERY_SUSPENDED:
    "Your bakery has been suspended, so this account cannot be used to sign in. Contact support to appeal.",
  ACCOUNT_DISABLED: "This account is no longer active. Contact support if you think this is a mistake.",
  INVALID_CREDENTIALS: "The email or password you entered is incorrect. Please check your credentials and try again.",
};

function messageFor(code) {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INVALID_CREDENTIALS;
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    tone: "danger",
  });

  // Check if session revoked or auth failed via query param
  useEffect(() => {
    if (router.query.error) {
      const code = String(router.query.error);
      setModalState({
        isOpen: true,
        title: "Sign In Required",
        message: messageFor(code),
        tone: "warning",
      });
    }
  }, [router.query.error]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        setLoading(false);
        setModalState({
          isOpen: true,
          title: "Sign In Failed",
          message: messageFor(result.error),
          tone: "danger",
        });
        return;
      }

      if (!result?.ok) {
        setLoading(false);
        setModalState({
          isOpen: true,
          title: "Sign In Failed",
          message: "Unable to sign in with the provided credentials. Please try again.",
          tone: "danger",
        });
        return;
      }

      // Success: determine user destination
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const defaultDest =
        sessionData?.user?.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/baker/dashboard";
      router.push(router.query.callbackUrl || defaultDest);
    } catch (err) {
      setLoading(false);
      setModalState({
        isOpen: true,
        title: "Connection Error",
        message: err.message || "Failed to reach the authentication service. Please try again.",
        tone: "danger",
      });
    }
  }

  return (
    <PublicLayout title="Sign In" description="Sign in to your Crumbly account">
      {/* Reusable top-popping message modal */}
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

      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="font-heading text-2xl font-bold text-cocoa-900">Welcome Back</h1>
          <p className="mt-1 text-sm text-cocoa-500">Sign in to manage your bakery, catalog, or administrative portal.</p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-cocoa-700">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm font-medium text-cocoa-700">Password</label>
                <Link href="/auth/forgot-password" className="text-xs font-medium text-terracotta-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full shadow-sm">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 border-t border-cream-100 pt-6 text-center text-sm text-cocoa-500">
            Own an artisan bakery?{" "}
            <Link href="/auth/register" className="font-semibold text-terracotta-600 hover:underline">
              List your bakery here
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export async function getServerSideProps(ctx) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) {
    return {
      redirect: {
        destination: session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/baker/dashboard",
        permanent: false,
      },
    };
  }
  return { props: {} };
}
