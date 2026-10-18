import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { Search, ShoppingBag, Menu, LayoutDashboard, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import MobileDrawer from "@/components/layout/MobileDrawer";

const NAV_LINKS = [
  { href: "/cakes", label: "Shop Cakes" },
  { href: "/bakeries", label: "Bakers" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const router = useRouter();

  function handleSearch(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    router.push(q ? `/cakes?q=${encodeURIComponent(q)}` : "/cakes");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] w-full items-center gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          {/* Mobile Menu Hamburger Button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-cocoa-700 hover:bg-cream-200 transition-colors md:hidden focus:outline-none focus:ring-2 focus:ring-terracotta-500"
            onClick={() => setOpen(true)}
            aria-label="Open mobile navigation menu"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-terracotta-600">
            Crumbly
          </Link>

          <nav className="ml-6 hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-cocoa-700 hover:text-terracotta-600 transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} className="ml-auto hidden max-w-sm flex-1 items-center gap-2 rounded-full border border-cream-300 bg-white px-3.5 py-1.5 shadow-sm md:flex">
            <Search size={16} className="text-cocoa-400" />
            <input name="q" type="search" placeholder="Search cakes, bakers, flavors…" className="w-full bg-transparent text-sm outline-none placeholder:text-cocoa-300" />
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-4">
            <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full text-cocoa-700 hover:bg-cream-200 transition-colors" aria-label="Cart">
              <ShoppingBag size={21} />
              {totalItems > 0 && (
                <span className="absolute 1 top-1 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold text-white shadow-xs">
                  {totalItems}
                </span>
              )}
            </Link>

            {session ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href={session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/baker/dashboard"}
                  className="flex items-center gap-1.5 rounded-full bg-cream-200/80 px-3.5 py-1.5 text-xs font-semibold text-cocoa-800 hover:bg-cream-300 transition-colors"
                  title="Dashboard"
                >
                  <LayoutDashboard size={15} className="text-terracotta-600" />
                  <span>{session.user.role === "SUPER_ADMIN" ? "Admin Panel" : "Baker Dashboard"}</span>
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-full p-2 text-cocoa-600 hover:bg-cream-200 hover:text-cocoa-900 transition-colors" title="Sign out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link href="/auth/login" className="rounded-full bg-terracotta-500 px-4 py-1.5 text-sm font-medium text-cream-50 shadow-sm hover:bg-terracotta-600 transition-colors">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Universal Mobile Navigation Drawer across All Users */}
      <MobileDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
