import Link from "next/link";
import clsx from "clsx";

const VARIANTS = {
  primary: "bg-terracotta-500 text-cream-50 hover:bg-terracotta-600 active:bg-terracotta-700",
  secondary: "bg-gold-400 text-cocoa-900 hover:bg-gold-500 active:bg-gold-600",
  outline: "border border-terracotta-500 text-terracotta-600 hover:bg-terracotta-50",
  ghost: "text-cocoa-700 hover:bg-cream-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  as,
  href,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  const Component = as || "button";
  return (
    <Component className={classes} disabled={disabled} {...props}>
      {children}
    </Component>
  );
}
