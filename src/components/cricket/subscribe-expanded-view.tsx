import { getCurrentOver, getStatusType } from "@/lib/cricket-ui";
import type { MatchDetailData, MatchInnings } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { TeamMark } from "./team-mark";

function TeamPanel({
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
    <div className="rounded-lg border border-white/8 bg-zinc-900/70 px-2 py-2">
      <div className="flex items-center gap-1.5">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} compact />
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-zinc-300">
          {shortName || name}
        </p>
      </div>
      <p className="mt-1.5 text-[17px] font-semibold tabular-nums leading-none text-zinc-50">
        {score || "-"}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-zinc-900/60 px-2 py-1">
      <p className="text-[8px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-px truncate text-[10px] font-medium tabular-nums text-zinc-200">
        {value || "-"}
      </p>
    </div>
  );
}

function getActiveInnings(detail: MatchDetailData): MatchInnings | null {
  return (
    [...detail.innings]
      .reverse()
      .find((entry) => entry.batsmen.length > 0 || entry.bowlers.length > 0) ??
    detail.innings.at(-1) ??
    null
  );
}

export function SubscribeExpandedView({
  detail,
  partnership,
}: {
  detail: MatchDetailData;
  partnership: string;
}) {
  const statusType = getStatusType(detail.status);
  const innings = getActiveInnings(detail);
  const overLabel = getCurrentOver(detail);
  const recentBallValues =
    detail.liveState?.currentOverBalls.map((ball) => ball.value).join("  ") || "-";

  return (
    <div className="space-y-2 pb-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[8px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {detail.series || "Series"}
          </p>
          <p className="mt-px truncate text-[10px] text-zinc-300">
            {detail.matchDesc || "Live Match"}
          </p>
        </div>
        <StatusBadge status={detail.status} statusType={statusType} compact />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <TeamPanel
          name={detail.team1.name}
          shortName={detail.team1.shortName}
          score={detail.team1.score}
          flagUrl={detail.team1.flagUrl}
        />
        <TeamPanel
          name={detail.team2.name}
          shortName={detail.team2.shortName}
          score={detail.team2.score}
          flagUrl={detail.team2.flagUrl}
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="Over" value={overLabel} />
        <Metric label="Run Rate" value={detail.liveState?.currentRunRate || "-"} />
        <Metric label="Required" value={detail.liveState?.requiredRunRate || "-"} />
        <Metric label="Partnership" value={partnership} />
      </div>

      <div className="rounded-lg border border-white/8 bg-zinc-900/60 p-2">
        <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Current Batters
        </p>
        <div className="mt-1 space-y-0.5 text-[10px]">
          {(detail.liveState?.batters ?? []).map((batter) => (
            <div
              key={`${batter.id}-${batter.name}`}
              className="flex items-center justify-between gap-2 rounded-md border border-white/6 bg-black/30 px-2 py-0.5"
            >
              <span className="truncate text-zinc-200">
                {batter.name}
                {batter.onStrike ? " *" : ""}
              </span>
              <span className="shrink-0 tabular-nums text-zinc-100">
                {batter.runs} ({batter.balls})
              </span>
            </div>
          ))}
          {(detail.liveState?.batters ?? []).length === 0 ? (
            <p className="text-zinc-500">-</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-white/8 bg-zinc-900/60 p-2 text-[10px]">
        <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Current Bowler
        </p>
        {detail.liveState?.bowler ? (
          <div className="mt-1 rounded-md border border-white/6 bg-black/30 px-2 py-0.5 text-zinc-200">
            <p className="font-medium">{detail.liveState.bowler.name}</p>
            <p className="mt-px text-zinc-400">
              {detail.liveState.bowler.overs} O · {detail.liveState.bowler.maidens} M ·{" "}
              {detail.liveState.bowler.runs} R · {detail.liveState.bowler.wickets} W · ECO{" "}
              {detail.liveState.bowler.economy}
            </p>
          </div>
        ) : (
          <p className="mt-1 text-zinc-500">-</p>
        )}
      </div>

      <div className="rounded-lg border border-white/8 bg-zinc-900/60 p-2 text-[10px]">
        <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
          Recent Balls
        </p>
        <p className="mt-1 tabular-nums text-zinc-200">{recentBallValues}</p>
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <div className="rounded-lg border border-white/8 bg-zinc-900/60 p-2">
          <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Batting Breakdown
          </p>
          <div className="mt-1 space-y-0.5 text-[10px]">
            {(innings?.batsmen ?? []).slice(0, 6).map((batter, index) => (
              <div
                key={`${batter.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-white/6 bg-black/30 px-2 py-0.5"
              >
                <span className="truncate text-zinc-200">{batter.name}</span>
                <span className="shrink-0 tabular-nums text-zinc-100">
                  {batter.runs} ({batter.balls})
                </span>
              </div>
            ))}
            {(innings?.batsmen ?? []).length === 0 ? (
              <p className="text-zinc-500">-</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-zinc-900/60 p-2">
          <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            Bowling Breakdown
          </p>
          <div className="mt-1 space-y-0.5 text-[10px]">
            {(innings?.bowlers ?? []).slice(0, 6).map((bowler, index) => (
              <div
                key={`${bowler.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-white/6 bg-black/30 px-2 py-0.5"
              >
                <span className="truncate text-zinc-200">{bowler.name}</span>
                <span className="shrink-0 tabular-nums text-zinc-100">
                  {bowler.overs} | {bowler.runs}/{bowler.wickets}
                </span>
              </div>
            ))}
            {(innings?.bowlers ?? []).length === 0 ? (
              <p className="text-zinc-500">-</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
