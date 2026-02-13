export function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300/75">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-slate-100">{value || "-"}</p>
    </div>
  );
}
