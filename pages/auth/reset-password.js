import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";

export default function ResetPassword() {
  const router = useRouter();
  const token = router.query.token || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout title="Set New Password" description="Create a new password for your Crumbly account">
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600 border border-terracotta-100">
            <Lock size={24} />
          </div>

          <h1 className="font-heading text-2xl font-bold text-cocoa-900">Set New Password</h1>
          <p className="mt-1 text-sm text-cocoa-500">Choose a strong, secure new password for your account.</p>

          {success ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">Password updated!</p>
                  <p className="mt-1 text-emerald-700">
                    Your password has been changed successfully. You can now sign in with your new credentials.
                  </p>
                </div>
              </div>

              <Button href="/auth/login" size="lg" className="w-full shadow-sm">
                Sign In Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-cocoa-700">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-cocoa-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full shadow-sm">
                {loading ? "Updating password…" : "Reset Password"}
              </Button>

              <div className="mt-2 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-xs font-medium text-cocoa-500 hover:text-terracotta-600 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
