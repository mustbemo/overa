export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-slate-300/80">{description}</p>
    </div>
  );
}
