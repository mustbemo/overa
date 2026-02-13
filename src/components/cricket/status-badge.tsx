import { cn } from "@/lib/classnames";
import type { MatchStatusType } from "@/lib/types";

const STATUS_STYLE: Record<MatchStatusType, string> = {
  live: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  upcoming: "border-sky-400/30 bg-sky-500/15 text-sky-300",
  complete: "border-slate-400/25 bg-slate-400/10 text-slate-200",
};

const STATUS_LABEL: Record<MatchStatusType, string> = {
  live: "LIVE",
  upcoming: "UPCOMING",
  complete: "FINISHED",
};

export function StatusBadge({
  status,
  statusType,
  compact = false,
}: {
  status: string;
  statusType: MatchStatusType;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide",
        compact ? "text-[10px]" : "text-[11px]",
        STATUS_STYLE[statusType],
      )}
      title={status}
    >
      {statusType === "live" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
      ) : null}
      {STATUS_LABEL[statusType]}
    </span>
  );
}
