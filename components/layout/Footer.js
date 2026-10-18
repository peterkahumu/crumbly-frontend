import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-cream-300 bg-cream-100 pb-20 pt-10 md:pb-10">
      <div className="mx-auto max-w-[1600px] w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-heading text-xl font-bold text-terracotta-600">Crumbly</p>
            <p className="mt-2 text-sm leading-relaxed text-cocoa-500">
              A marketplace connecting independent artisanal bakers and pâtissiers with customers looking for custom, memorable cakes.
            </p>
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-cocoa-700">Shop Marketplace</p>
            <ul className="mt-2 space-y-1.5 text-sm text-cocoa-500">
              <li><Link href="/cakes" className="hover:text-terracotta-600 transition-colors">All Cakes Catalog</Link></li>
              <li><Link href="/bakeries" className="hover:text-terracotta-600 transition-colors">Browse Bakeries</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-cocoa-700">Partners & Portal</p>
            <ul className="mt-2 space-y-1.5 text-sm text-cocoa-500">
              <li><Link href="/auth/register" className="hover:text-terracotta-600 transition-colors">List Your Bakery</Link></li>
              <li><Link href="/auth/login" className="hover:text-terracotta-600 transition-colors">Sign In to Account</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-cocoa-400">© {new Date().getFullYear()} Crumbly. All rights reserved.</p>
      </div>
    </footer>
  );
}
