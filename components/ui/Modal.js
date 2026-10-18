import { useEffect, useRef } from "react";
import { X, AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import Button from "@/components/ui/Button";

const ICONS = {
  danger: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  brand: Info,
  neutral: Info,
};

const TONE_STYLES = {
  danger: {
    accent: "bg-red-500",
    iconBg: "bg-red-50 text-red-600 border border-red-200/70",
    buttonVariant: "danger",
  },
  warning: {
    accent: "bg-amber-500",
    iconBg: "bg-amber-50 text-amber-600 border border-amber-200/70",
    buttonVariant: "primary",
  },
  success: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/70",
    buttonVariant: "primary",
  },
  brand: {
    accent: "bg-terracotta-500",
    iconBg: "bg-terracotta-50 text-terracotta-600 border border-terracotta-200/70",
    buttonVariant: "primary",
  },
  neutral: {
    accent: "bg-cocoa-400",
    iconBg: "bg-cream-100 text-cocoa-700 border border-cream-300",
    buttonVariant: "outline",
  },
};

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/**
 * Reusable modal dialog with support for top-sliding announcements,
 * alerts, confirmations, and general dialog workflows.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  tone = "danger",
  position = "top",
  primaryAction,
  secondaryAction,
  showCloseButton = true,
  maxWidth = "md",
}) {
  const modalRef = useRef(null);
  const toneConfig = TONE_STYLES[tone] || TONE_STYLES.brand;
  const IconComponent = ICONS[tone] || ICONS.brand;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClass =
    position === "top"
      ? "items-start pt-10 sm:pt-16 pb-6"
      : "items-center py-6";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className={`fixed inset-0 z-50 flex justify-center px-4 overflow-y-auto bg-cocoa-950/60 backdrop-blur-sm animate-fade-in ${positionClass}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`relative w-full ${MAX_WIDTHS[maxWidth] || MAX_WIDTHS.md} overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-2xl transform transition-all duration-300 ease-out animate-slide-down`}
      >
        {/* Top accent line */}
        <div className={`h-1.5 w-full ${toneConfig.accent}`} />

        {/* Close Button */}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 rounded-full p-2 text-cocoa-400 hover:bg-cream-100 hover:text-cocoa-700 transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta-400"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneConfig.iconBg} shadow-sm`}>
              <IconComponent size={24} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              {title && (
                <h3 id="modal-title" className="font-heading text-lg font-bold text-cocoa-900 leading-snug">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-2 text-sm leading-relaxed text-cocoa-600">
                  {description}
                </p>
              )}
            </div>
          </div>

          {children && <div className="mt-5">{children}</div>}

          {(primaryAction || secondaryAction) && (
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-cream-100 pt-4">
              {secondaryAction && (
                <Button
                  type="button"
                  variant={secondaryAction.variant || "outline"}
                  size="md"
                  onClick={secondaryAction.onClick || onClose}
                  className="w-full sm:w-auto"
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  type="button"
                  variant={primaryAction.variant || toneConfig.buttonVariant}
                  size="md"
                  disabled={primaryAction.loading}
                  onClick={primaryAction.onClick || onClose}
                  className="w-full sm:w-auto shadow-sm"
                >
                  {primaryAction.loading ? "Please wait…" : primaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
