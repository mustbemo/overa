import { getCurrentOver, getStatusType } from "@/lib/cricket-ui";
import type { MatchDetailData } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { TeamMark } from "./team-mark";

function TeamRow({
  name,
  shortName,
  score,
  flagUrl,
}: {
  name: string;
  shortName: string;
  score: string;
  flagUrl: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} compact />
        <span className="truncate text-[11px] font-medium text-zinc-200">
          {shortName || name}
        </span>
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-zinc-50">
        {score || "-"}
      </span>
    </div>
  );
}

export function SubscribeCompactView({ detail }: { detail: MatchDetailData }) {
  const statusType = getStatusType(detail.status);
  const overLabel = getCurrentOver(detail);
  const batters = detail.liveState?.batters ?? [];
  const bowler = detail.liveState?.bowler;

  return (
    <div className="space-y-1.5">
      {/* Match Title */}
      <div className="flex items-start justify-end gap-2">
        {/* <div className="min-w-0">
          <p className="truncate text-[8px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {detail.series || "Series"}
          </p>
          <p className="mt-px truncate text-[10px] text-emerald-300/80">
            {detail.status || detail.state || "Live"}
          </p>
        </div> */}
        <StatusBadge status={detail.status} statusType={statusType} compact />
      </div>

      {/* Team Scores */}
      <div className="space-y-2 rounded-md border border-white/6 bg-zinc-900/60 p-2">
        <TeamRow
          name={detail.team1.name}
          shortName={detail.team1.shortName}
          score={detail.team1.score}
          flagUrl={detail.team1.flagUrl}
        />
        <TeamRow
          name={detail.team2.name}
          shortName={detail.team2.shortName}
          score={detail.team2.score}
          flagUrl={detail.team2.flagUrl}
        />
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <p className="text-red-400/90 pl-1">
            {detail.status || detail.state || "-"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">RR</span>
            <span className="tabular-nums text-zinc-50">
              {detail.liveState?.currentRunRate || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="rounded-md border border-white/6 bg-zinc-900/60 px-2 py-1 text-[9px]">
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
          <span className="text-zinc-500">Batters</span>
          <span className="truncate text-right text-zinc-300">
            {batters.length > 0
              ? batters
                  .map(
                    (batter) =>
                      `${batter.name.split(" ").at(-1)} ${batter.runs}(${batter.balls})`,
                  )
                  .join(" · ")
              : "-"}
          </span>

          <span className="text-zinc-500">Bowler</span>
          <span className="truncate text-right text-zinc-300">
            {bowler
              ? `${bowler.name.split(" ").at(-1)} ${bowler.overs}-${bowler.runs}-${bowler.wickets}`
              : "-"}
          </span>
        </div>
      </div>
    </div>
  );
}
