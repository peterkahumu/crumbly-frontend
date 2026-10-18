import PublicLayout from "@/components/layout/PublicLayout";
import Button from "@/components/ui/Button";
import { Cookie } from "lucide-react";

export default function Custom404() {
  return (
    <PublicLayout title="Page Not Found">
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
        <Cookie size={48} className="text-terracotta-400" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-cocoa-900">Page not found</h1>
        <p className="mt-2 text-sm text-cocoa-500">
          The page you&apos;re looking for got eaten. Let&apos;s get you back to something sweet.
        </p>
        <Button href="/" className="mt-6">Back to Home</Button>
      </div>
    </PublicLayout>
  );
}
