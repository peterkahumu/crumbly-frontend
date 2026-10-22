import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout title="Reset Password" description="Request a password reset link for your Crumbly account">
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <Link
          href="/auth/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-cocoa-500 hover:text-terracotta-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600 border border-terracotta-100">
            <Mail size={24} />
          </div>

          <h1 className="font-heading text-2xl font-bold text-cocoa-900">Forgot Password</h1>
          <p className="mt-1 text-sm text-cocoa-500">
            Enter the email associated with your account, and we&apos;ll send you instructions to reset your password.
          </p>

          {success ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">Check your inbox</p>
                  <p className="mt-1 text-emerald-700">
                    If an account is associated with <strong>{email}</strong>, a secure password reset link has been sent to your email inbox. Please follow the instructions in the email.
                  </p>
                </div>
              </div>

              <Button href="/auth/login" variant="outline" size="md" className="w-full">
                Return to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-cocoa-700">Account Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-cream-300 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full shadow-sm">
                {loading ? "Sending link…" : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
