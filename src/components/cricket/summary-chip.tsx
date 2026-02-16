export function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] p-2">
      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-200">{value || "-"}</p>
    </div>
  );
}
