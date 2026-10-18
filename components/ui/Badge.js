import clsx from "clsx";

const TONES = {
  neutral: "bg-cream-200 text-cocoa-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-gold-100 text-gold-600",
  danger: "bg-red-100 text-red-700",
  brand: "bg-terracotta-100 text-terracotta-700",
};

export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
