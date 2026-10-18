import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import {
  X,
  Search,
  Home,
  Cake,
  Store,
  ShoppingBag,
  LayoutDashboard,
  MessageCircle,
  Tags,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  UserPlus,
  LogIn,
} from "lucide-react";
import clsx from "clsx";
import { useCart } from "@/context/CartContext";
import { getInitials, colorFromString } from "@/lib/initials";

export default function MobileDrawer({ isOpen, onClose }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);

  const role = session?.user?.role;
  const user = session?.user;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fetch unread messages count for authenticated users
  useEffect(() => {
    if (!role || (role !== "BAKER" && role !== "SUPER_ADMIN")) return;

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messaging/conversations");
        if (res.ok) {
          const convs = await res.json();
          if (Array.isArray(convs) && isMounted) {
            const count = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setUnreadMessages(count);
          }
        }
      } catch {
        // Quiet failure
      }
    };

    if (isOpen) {
      fetchUnread();
    }
  }, [isOpen, role]);

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [router.asPath]);

  function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/cakes?q=${encodeURIComponent(searchQuery.trim())}`);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-cocoa-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        aria-label="Mobile Navigation Menu"
        className="fixed inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-cream-50 shadow-2xl border-r border-cream-300 animate-slide-right overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 bg-white">
          <Link href="/" onClick={onClose} className="font-heading text-2xl font-bold tracking-tight text-terracotta-600">
            Crumbly
          </Link>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-100 text-cocoa-600 hover:bg-cream-200 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-4 bg-gradient-to-br from-cream-100 to-cream-200/50 border-b border-cream-200">
          {session ? (
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-xs"
                style={{ backgroundColor: colorFromString(user.name || user.email) }}
              >
                {getInitials(user.name || user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-cocoa-900 leading-snug">
                    {user.name || user.email?.split("@")[0]}
                  </p>
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-terracotta-100 text-terracotta-800 border border-terracotta-200"
                    )}
                  >
                    {role === "SUPER_ADMIN" ? "Admin" : "Baker"}
                  </span>
                </div>
                <p className="truncate text-xs text-cocoa-500 mt-0.5">{user.email}</p>
                {user.bakerySlug && (
                  <p className="truncate text-[11px] font-medium text-terracotta-700 mt-0.5">
                    🍰 {user.bakerySlug.replace(/-/g, " ")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta-100 text-terracotta-600">
                  <Cake size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-cocoa-900">Welcome to Crumbly</p>
                  <p className="text-xs text-cocoa-500">Discover Kenya&apos;s finest cakes</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-terracotta-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-terracotta-700 transition-colors"
                >
                  <LogIn size={13} /> Sign In
                </Link>
                <Link
                  href="/auth/register-baker"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white border border-cream-300 px-3 py-2 text-xs font-semibold text-cocoa-800 shadow-xs hover:bg-cream-100 transition-colors"
                >
                  <UserPlus size={13} /> Join Baker
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="p-4 border-b border-cream-200 bg-white">
          <div className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3.5 py-2 focus-within:border-terracotta-500 focus-within:bg-white transition-colors">
            <Search size={16} className="text-cocoa-400 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cakes, bakers, flavors…"
              className="w-full bg-transparent text-sm text-cocoa-900 outline-none placeholder:text-cocoa-400"
            />
          </div>
        </form>

        {/* Nav Links Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Admin Specific Links */}
          {role === "SUPER_ADMIN" && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-purple-800 mb-2 flex items-center gap-1.5">
                <ShieldCheck size={13} /> Admin Control
              </p>
              <div className="space-y-1">
                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname === "/admin/dashboard"
                      ? "bg-purple-100 text-purple-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <LayoutDashboard size={18} className="text-purple-600" /> Platform Overview
                </Link>
                <Link
                  href="/admin/dashboard/orders"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/admin/dashboard/orders")
                      ? "bg-purple-100 text-purple-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <ShoppingBag size={18} className="text-purple-600" /> Platform Orders
                </Link>
                <Link
                  href="/admin/dashboard/bakers"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/admin/dashboard/bakers")
                      ? "bg-purple-100 text-purple-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <Store size={18} className="text-purple-600" /> Manage Bakeries
                </Link>
                <Link
                  href="/admin/dashboard/messages"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/admin/dashboard/messages")
                      ? "bg-purple-100 text-purple-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle size={18} className="text-purple-600" /> Support Messages
                  </span>
                  {unreadMessages > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/dashboard/categories"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/admin/dashboard/categories")
                      ? "bg-purple-100 text-purple-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <Tags size={18} className="text-purple-600" /> Cake Categories
                </Link>
              </div>
            </div>
          )}

          {/* Baker Specific Links */}
          {role === "BAKER" && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-terracotta-800 mb-2 flex items-center gap-1.5">
                <Store size={13} /> Baker Dashboard
              </p>
              <div className="space-y-1">
                <Link
                  href="/baker/dashboard"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname === "/baker/dashboard"
                      ? "bg-terracotta-100 text-terracotta-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <LayoutDashboard size={18} className="text-terracotta-600" /> Overview &amp; Analytics
                </Link>
                <Link
                  href="/baker/dashboard/orders"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/baker/dashboard/orders")
                      ? "bg-terracotta-100 text-terracotta-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <ShoppingBag size={18} className="text-terracotta-600" /> Incoming Orders
                </Link>
                <Link
                  href="/baker/dashboard/cakes"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/baker/dashboard/cakes")
                      ? "bg-terracotta-100 text-terracotta-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <Cake size={18} className="text-terracotta-600" /> Manage Cake Catalog
                </Link>
                <Link
                  href="/baker/dashboard/messages"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/baker/dashboard/messages")
                      ? "bg-terracotta-100 text-terracotta-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle size={18} className="text-terracotta-600" /> Customer Chats
                  </span>
                  {unreadMessages > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link
                  href="/baker/dashboard/settings"
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    router.pathname.startsWith("/baker/dashboard/settings")
                      ? "bg-terracotta-100 text-terracotta-900"
                      : "text-cocoa-700 hover:bg-cream-200"
                  )}
                >
                  <Settings size={18} className="text-terracotta-600" /> Bakery Profile &amp; Settings
                </Link>
                {user.bakerySlug && (
                  <Link
                    href={`/bakery/${user.bakerySlug}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-cocoa-600 hover:bg-cream-200 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink size={14} className="text-terracotta-500" /> View My Storefront
                    </span>
                    <span className="text-[10px] text-cocoa-400">Public</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Public Storefront Navigation for ALL users */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-cocoa-500 mb-2">
              Storefront &amp; Discovery
            </p>
            <div className="space-y-1">
              <Link
                href="/"
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  router.pathname === "/" ? "bg-cream-200/80 text-terracotta-600" : "text-cocoa-700 hover:bg-cream-200"
                )}
              >
                <Home size={18} className="text-cocoa-500" /> Home
              </Link>
              <Link
                href="/cakes"
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  router.pathname === "/cakes"
                    ? "bg-cream-200/80 text-terracotta-600"
                    : "text-cocoa-700 hover:bg-cream-200"
                )}
              >
                <Cake size={18} className="text-cocoa-500" /> Browse All Cakes
              </Link>
              <Link
                href="/bakeries"
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  router.pathname === "/bakeries"
                    ? "bg-cream-200/80 text-terracotta-600"
                    : "text-cocoa-700 hover:bg-cream-200"
                )}
              >
                <Store size={18} className="text-cocoa-500" /> Artisan Bakeries
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  router.pathname === "/cart"
                    ? "bg-cream-200/80 text-terracotta-600"
                    : "text-cocoa-700 hover:bg-cream-200"
                )}
              >
                <span className="flex items-center gap-3">
                  <ShoppingBag size={18} className="text-cocoa-500" /> Shopping Cart
                </span>
                {totalItems > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer with Sign Out / Action */}
        <div className="p-4 border-t border-cream-200 bg-white">
          {session ? (
            <button
              onClick={() => {
                onClose();
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cream-100 py-2.5 text-sm font-semibold text-cocoa-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            >
              <LogOut size={16} /> Sign out of account
            </button>
          ) : (
            <Link
              href="/auth/login"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta-600 py-2.5 text-sm font-semibold text-white hover:bg-terracotta-700 shadow-xs transition-colors"
            >
              <LogIn size={16} /> Sign In
            </Link>
          )}
          <p className="mt-2 text-center text-[10px] text-cocoa-400">
            Crumbly &copy; {new Date().getFullYear()} &middot; Mobile First Platform
          </p>
        </div>
      </aside>
    </div>
  );
}
