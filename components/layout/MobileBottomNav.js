import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  Home,
  Cake,
  Store,
  ShoppingBag,
  User,
  LayoutDashboard,
  MessageCircle,
  Tags,
  Settings,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { useCart } from "@/context/CartContext";

export default function MobileBottomNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const { totalItems } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);

  const role = session?.user?.role;
  const isAdminRoute = router.pathname.startsWith("/admin");
  const isBakerRoute = router.pathname.startsWith("/baker");

  // Fetch unread messages count on navigation for authenticated bakers and admins (no polling)
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
            setUnreadCount(count);
          }
        }
      } catch {
        // Quiet failure
      }
    };

    fetchUnread();
    return () => {
      isMounted = false;
    };
  }, [role, router.pathname]);

  // Determine tabs depending on user role and whether they are inside their dashboard or on the storefront
  let tabs = [];

  if (isAdminRoute) {
    // Admin Dashboard View
    tabs = [
      { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/dashboard/bakers", label: "Bakers", icon: Store },
      { href: "/admin/dashboard/messages", label: "Messages", icon: MessageCircle, badge: unreadCount },
      { href: "/admin/dashboard/categories", label: "Categories", icon: Tags },
    ];
  } else if (isBakerRoute) {
    // Baker Dashboard View
    tabs = [
      { href: "/baker/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/baker/dashboard/orders", label: "Orders", icon: ShoppingBag },
      { href: "/baker/dashboard/cakes", label: "Cakes", icon: Cake },
      { href: "/baker/dashboard/messages", label: "Messages", icon: MessageCircle, badge: unreadCount },
      { href: "/baker/dashboard/settings", label: "Settings", icon: Settings },
    ];
  } else {
    // Public Storefront View
    if (role === "SUPER_ADMIN") {
      tabs = [
        { href: "/", label: "Home", icon: Home },
        { href: "/cakes", label: "Cakes", icon: Cake },
        { href: "/bakeries", label: "Bakers", icon: Store },
        { href: "/cart", label: "Cart", icon: ShoppingBag, badge: totalItems },
        { href: "/admin/dashboard", label: "Admin Hub", icon: ShieldCheck },
      ];
    } else if (role === "BAKER") {
      tabs = [
        { href: "/", label: "Home", icon: Home },
        { href: "/cakes", label: "Cakes", icon: Cake },
        { href: "/cart", label: "Cart", icon: ShoppingBag, badge: totalItems },
        { href: "/baker/dashboard/messages", label: "Messages", icon: MessageCircle, badge: unreadCount },
        { href: "/baker/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ];
    } else {
      // Unsigned-in customer / Guest
      tabs = [
        { href: "/", label: "Home", icon: Home },
        { href: "/cakes", label: "Cakes", icon: Cake },
        { href: "/bakeries", label: "Bakers", icon: Store },
        { href: "/cart", label: "Cart", icon: ShoppingBag, badge: totalItems },
        { href: "/auth/login", label: "Sign In", icon: User },
      ];
    }
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-cream-300/80 bg-cream-50/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(46,27,25,0.06)] md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
    >
      {tabs.map(({ href, label, icon: Icon, badge }) => {
        const isRoot =
          href === "/" ||
          href === "/admin/dashboard" ||
          href === "/baker/dashboard";
        const active = isRoot
          ? router.pathname === href
          : router.pathname === href || router.pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 text-[11px] transition-all duration-150 active:scale-95 select-none",
              active ? "text-terracotta-600 font-semibold" : "text-cocoa-400 hover:text-cocoa-700 font-medium"
            )}
          >
            {/* Top active indicator line */}
            {active && (
              <span className="absolute top-0 h-[3px] w-7 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 animate-fade-in" />
            )}

            <span className="relative flex items-center justify-center">
              <Icon
                size={21}
                className={clsx(
                  "transition-transform duration-150",
                  active ? "scale-105 stroke-[2.25]" : "stroke-[1.75]"
                )}
              />

              {/* Dynamic Notification / Counter Badge */}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[9px] font-bold text-white shadow-xs animate-scale-in">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>

            <span className="truncate max-w-[64px] tracking-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
