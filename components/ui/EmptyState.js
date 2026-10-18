export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-200 text-terracotta-500">
          <Icon size={22} />
        </span>
      )}
      <h3 className="font-heading text-lg font-semibold text-cocoa-700">{title}</h3>
      {description && <p className="max-w-sm text-sm text-cocoa-500">{description}</p>}
      {action}
    </div>
  );
}
