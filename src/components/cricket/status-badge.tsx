import { cn } from "@/lib/classnames";
import type { MatchStatusType } from "@/lib/types";

const STATUS_STYLE: Record<MatchStatusType, string> = {
  live: "border-white/25 bg-white/12 text-white",
  upcoming: "border-zinc-500/35 bg-zinc-700/25 text-zinc-200",
  complete: "border-zinc-600/35 bg-zinc-700/20 text-zinc-300",
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
        <span className="live-track" aria-hidden="true">
          <span className="live-track__runner" />
        </span>
      ) : null}
      {STATUS_LABEL[statusType]}
    </span>
  );
}
