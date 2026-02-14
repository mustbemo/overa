import { getCurrentOver, getStatusType } from "@/lib/cricket-ui";
import type { MatchDetailData } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { TeamMark } from "./team-mark";

function TeamScoreTile({
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
    <div className="rounded-lg border border-white/12 bg-zinc-900/80 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} compact />
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-200">
          {shortName || name}
        </p>
      </div>
      <p className="mt-1.5 text-[15px] font-semibold leading-none text-zinc-50">
        {score || "-"}
      </p>
    </div>
  );
}

export function SubscribeCompactView({ detail }: { detail: MatchDetailData }) {
  const statusType = getStatusType(detail.status);
  const overLabel = getCurrentOver(detail);
  const batters = detail.liveState?.batters ?? [];
  const bowler = detail.liveState?.bowler;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {detail.series || "Series"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-300">
            {detail.status || detail.state || "Live"}
          </p>
        </div>
        <StatusBadge status={detail.status} statusType={statusType} compact />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TeamScoreTile
          name={detail.team1.name}
          shortName={detail.team1.shortName}
          score={detail.team1.score}
          flagUrl={detail.team1.flagUrl}
        />
        <TeamScoreTile
          name={detail.team2.name}
          shortName={detail.team2.shortName}
          score={detail.team2.score}
          flagUrl={detail.team2.flagUrl}
        />
      </div>

      <div className="rounded-lg border border-white/12 bg-zinc-900/80 px-2.5 py-2 text-[11px]">
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
          <span className="text-zinc-500">Over</span>
          <span className="truncate text-right text-zinc-100">{overLabel}</span>

          <span className="text-zinc-500">RR</span>
          <span className="truncate text-right text-zinc-100">
            {detail.liveState?.currentRunRate || "-"}
          </span>

          <span className="text-zinc-500">Batters</span>
          <span className="truncate text-right text-zinc-200">
            {batters.length > 0
              ? batters
                  .map(
                    (batter) =>
                      `${batter.name.split(" ").at(-1)} ${batter.runs}(${batter.balls})`,
                  )
                  .join(" | ")
              : "Not available"}
          </span>

          <span className="text-zinc-500">Bowler</span>
          <span className="truncate text-right text-zinc-200">
            {bowler
              ? `${bowler.name.split(" ").at(-1)} ${bowler.overs}-${bowler.runs}-${bowler.wickets}`
              : "Not available"}
          </span>
        </div>
      </div>
    </div>
  );
}
