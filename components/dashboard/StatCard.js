export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-4">
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-500">
          <Icon size={20} />
        </span>
      )}
      <div>
        <p className="font-heading text-xl font-bold text-cocoa-900">{value}</p>
        <p className="text-xs text-cocoa-500">{label}</p>
      </div>
    </div>
  );
}
