import { cn } from "@/lib/classnames";
import type { MatchStatusType } from "@/lib/types";

const STATUS_STYLE: Record<MatchStatusType, string> = {
  live: "border-white/20 bg-emerald-500/10 text-emerald-200/80",
  upcoming: "border-white/20 bg-yellow-500/10 text-yellow-500/80",
  complete: "border-white/20 bg-emerald-500/8 text-emerald-200/70",
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
        "flex items-center justify-center gap-1 rounded-md px-1.5 py-px pt-1 font-medium uppercase tracking-wide",
        compact ? "text-[9px]" : "text-[10px]",
        STATUS_STYLE[statusType],
      )}
      title={status}
    >
      {statusType === "live" ? (
        <span className="live-track" aria-hidden="true">
          <span className="live-track__runner" />
        </span>
      ) : null}
      {STATUS_LABEL[statusType]}
    </span>
  );
}
