import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { LogOut, ExternalLink, Menu } from "lucide-react";
import clsx from "clsx";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileDrawer from "@/components/layout/MobileDrawer";

/**
 * Shared shell for /baker/dashboard/** and /admin/dashboard/** — desktop sidebar,
 * mobile drawer, and mobile bottom navigation bar with role-specific tab routing.
 */
export default function DashboardLayout({ title, navItems, brandLabel, brandHref, children }) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Head>
        <title>{title} | Crumbly</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-cream-100 md:flex">
        <aside className="border-b border-cream-300 bg-cream-50 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-4 py-3 md:flex-col md:items-start md:gap-1 md:py-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-cocoa-700 hover:bg-cream-200 transition-colors md:hidden focus:outline-none"
                aria-label="Open mobile menu"
              >
                <Menu size={20} />
              </button>
              <Link href="/" className="font-heading text-lg font-bold text-terracotta-600">
                Crumbly
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {brandLabel && (
                <div className="flex items-center gap-2">
                  <Link
                    href={brandHref}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-cocoa-500 hover:text-terracotta-600 bg-cream-100 border border-cream-200 px-2 py-1 rounded-md"
                  >
                    {brandLabel} <ExternalLink size={11} />
                  </Link>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + brandHref);
                      alert("Storefront URL copied to clipboard!");
                    }}
                    className="hidden md:inline-block rounded bg-cream-200 px-2 py-1 text-[10px] font-medium text-cocoa-600 hover:bg-cream-300"
                  >
                    Share URL
                  </button>
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-cocoa-500 hover:bg-cream-200 md:hidden"
                title="Sign out"
              >
                <LogOut size={13} /> Exit
              </button>
            </div>
          </div>

          {/* Desktop Sidebar Navigation */}
          <nav className="hidden md:flex md:flex-col md:overflow-visible md:px-3 md:pb-6">
            {navItems.map((item) => {
              const isDashboardRoot = item.href === "/admin/dashboard" || item.href === "/baker/dashboard" || item.href === "/";
              const active = isDashboardRoot
                ? router.pathname === item.href
                : router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-terracotta-500 text-white shadow-sm" : "text-cocoa-600 hover:bg-cream-200"
                  )}
                >
                  <item.icon size={16} /> {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-4 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-cocoa-500 hover:bg-cream-200 transition-colors"
            >
              <LogOut size={16} /> Sign out
            </button>
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 md:py-8 lg:px-8 xl:px-10 max-w-[1600px] w-full pb-24 md:pb-8">
          <h1 className="mb-6 font-heading text-xl font-bold text-cocoa-900 sm:text-2xl">{title}</h1>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav />

        {/* Universal Mobile Drawer for Dashboard View */}
        <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </>
  );
}
