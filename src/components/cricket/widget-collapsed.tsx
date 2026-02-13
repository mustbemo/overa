import { getCurrentOver, getStatusType } from "@/lib/cricket-ui";
import type { MatchDetailData } from "@/lib/types";
import { StatusBadge } from "./status-badge";

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-300/75">{label}</span>
      <span className="truncate text-right text-slate-100">{value || "-"}</span>
    </div>
  );
}

export function WidgetCollapsed({ detail }: { detail: MatchDetailData }) {
  const statusType = getStatusType(detail.status);
  const overLabel = getCurrentOver(detail);
  const batters = detail.liveState?.batters ?? [];
  const bowler = detail.liveState?.bowler;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-teal-200/90">
            {detail.series || "Series"}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-200">
            {detail.team1.shortName || detail.team1.name} {detail.team1.score || "-"} vs{" "}
            {detail.team2.shortName || detail.team2.name} {detail.team2.score || "-"}
          </p>
        </div>
        <StatusBadge status={detail.status} statusType={statusType} compact />
      </div>

      <div className="space-y-1.5">
        <Line label="Over" value={overLabel} />
        <Line
          label="Batters"
          value={
            batters.length > 0
              ? batters
                  .map((batter) => `${batter.name.split(" ").at(-1)} ${batter.runs}(${batter.balls})`)
                  .join(" | ")
              : "Not available"
          }
        />
        <Line
          label="Bowler"
          value={
            bowler
              ? `${bowler.name.split(" ").at(-1)} ${bowler.overs}-${bowler.runs}-${bowler.wickets}`
              : "Not available"
          }
        />
        <Line label="Run Rate" value={detail.liveState?.currentRunRate || "-"} />
        <Line label="Status" value={detail.status || detail.state || "-"} />
      </div>
    </section>
  );
}
