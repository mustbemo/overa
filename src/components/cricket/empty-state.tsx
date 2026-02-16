export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 px-3 py-6 text-center text-[11px] text-slate-400">
      <p className="font-medium text-slate-200">{title}</p>
      <p className="mt-1.5 text-slate-400/80">{description}</p>
    </div>
  );
}
