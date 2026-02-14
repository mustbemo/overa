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
    <div className="rounded-xl border border-white/12 bg-zinc-900/80 px-2.5 py-2.5">
      <div className="flex items-center gap-2">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} compact />
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-200">
          {shortName || name}
        </p>
      </div>
      <p className="mt-2 text-[22px] font-semibold leading-none text-zinc-50">
        {score || "-"}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/70 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-100">
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
    <div className="space-y-2.5 pb-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {detail.series || "Series"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-300">
            {detail.matchDesc || "Live Match"}
          </p>
        </div>
        <StatusBadge status={detail.status} statusType={statusType} compact />
      </div>

      <div className="grid grid-cols-2 gap-2">
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Over" value={overLabel} />
        <Metric label="Run Rate" value={detail.liveState?.currentRunRate || "-"} />
        <Metric label="Required" value={detail.liveState?.requiredRunRate || "-"} />
        <Metric label="Partnership" value={partnership} />
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/75 p-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Current Batters
        </p>
        <div className="mt-1.5 space-y-1 text-[11px]">
          {(detail.liveState?.batters ?? []).map((batter) => (
            <div
              key={`${batter.id}-${batter.name}`}
              className="flex items-center justify-between gap-2 rounded-md border border-white/8 bg-black/35 px-2 py-1"
            >
              <span className="truncate text-zinc-100">
                {batter.name}
                {batter.onStrike ? " *" : ""}
              </span>
              <span className="shrink-0 text-zinc-200">
                {batter.runs} ({batter.balls})
              </span>
            </div>
          ))}
          {(detail.liveState?.batters ?? []).length === 0 ? (
            <p className="text-zinc-500">Not available</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/75 p-2 text-[11px]">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Current Bowler
        </p>
        {detail.liveState?.bowler ? (
          <div className="mt-1.5 rounded-md border border-white/8 bg-black/35 px-2 py-1 text-zinc-100">
            <p className="font-semibold">{detail.liveState.bowler.name}</p>
            <p className="mt-0.5 text-zinc-300">
              {detail.liveState.bowler.overs} O | {detail.liveState.bowler.maidens} M |{" "}
              {detail.liveState.bowler.runs} R | {detail.liveState.bowler.wickets} W | ECO{" "}
              {detail.liveState.bowler.economy}
            </p>
          </div>
        ) : (
          <p className="mt-1.5 text-zinc-500">Not available</p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/75 p-2 text-[11px]">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Recent Balls
        </p>
        <p className="mt-1.5 text-zinc-100">{recentBallValues}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-zinc-900/75 p-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Batting Breakdown
          </p>
          <div className="mt-1.5 space-y-1 text-[11px]">
            {(innings?.batsmen ?? []).slice(0, 6).map((batter, index) => (
              <div
                key={`${batter.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-white/8 bg-black/35 px-2 py-1"
              >
                <span className="truncate text-zinc-100">{batter.name}</span>
                <span className="shrink-0 text-zinc-200">
                  {batter.runs} ({batter.balls})
                </span>
              </div>
            ))}
            {(innings?.batsmen ?? []).length === 0 ? (
              <p className="text-zinc-500">Not available</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-zinc-900/75 p-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Bowling Breakdown
          </p>
          <div className="mt-1.5 space-y-1 text-[11px]">
            {(innings?.bowlers ?? []).slice(0, 6).map((bowler, index) => (
              <div
                key={`${bowler.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-white/8 bg-black/35 px-2 py-1"
              >
                <span className="truncate text-zinc-100">{bowler.name}</span>
                <span className="shrink-0 text-zinc-200">
                  {bowler.overs} | {bowler.runs}/{bowler.wickets}
                </span>
              </div>
            ))}
            {(innings?.bowlers ?? []).length === 0 ? (
              <p className="text-zinc-500">Not available</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
