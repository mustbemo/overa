import { getStatusType } from "@/lib/cricket-ui";
import type { LiveOverBall, MatchDetailData } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { TeamMark } from "./team-mark";

function parseRateValue(value: string): number | null {
  const match = value.match(/\d+(\.\d+)?/);

  if (!match?.[0]) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldShowRequiredRate(value: string): boolean {
  const parsed = parseRateValue(value);
  return parsed !== null && parsed > 0;
}

function parsePredictionPercent(value: string): number | null {
  const match = value.match(/\d+(\.\d+)?/);

  if (!match?.[0]) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(Math.max(parsed, 0), 100);
}

function BallChip({ ball }: { ball: LiveOverBall }) {
  const kindStyle: Record<LiveOverBall["kind"], string> = {
    wicket: "border-rose-400/35 bg-rose-500/15 text-rose-100",
    four: "border-sky-400/30 bg-sky-500/15 text-sky-100",
    six: "border-amber-300/30 bg-amber-500/15 text-amber-100",
    extra: "border-violet-400/30 bg-violet-500/15 text-violet-100",
    dot: "border-slate-400/25 bg-slate-500/15 text-slate-200",
    run: "border-emerald-400/25 bg-emerald-500/15 text-emerald-100",
    other: "border-slate-400/25 bg-slate-500/15 text-slate-200",
  };

  return (
    <span
      className={`inline-flex min-w-6 items-center justify-center rounded border px-1 py-0.5 text-[9px] font-semibold tabular-nums ${kindStyle[ball.kind]}`}
      title={ball.label}
    >
      {ball.value}
    </span>
  );
}

function WinPredictionBar({
  team1Label,
  team1Percent,
  team2Label,
  team2Percent,
}: {
  team1Label: string;
  team1Percent: string;
  team2Label: string;
  team2Percent: string;
}) {
  const parsedTeam1Percent = parsePredictionPercent(team1Percent);
  const parsedTeam2Percent = parsePredictionPercent(team2Percent);

  if (parsedTeam1Percent === null || parsedTeam2Percent === null) {
    return null;
  }

  const total = parsedTeam1Percent + parsedTeam2Percent;
  const team1Width = total > 0 ? (parsedTeam1Percent / total) * 100 : 50;
  const team2Width = 100 - team1Width;

  return (
    <div className="rounded-md border border-white/6 bg-zinc-900/60 px-2 py-1.5">
      <p className="text-[8px] uppercase tracking-wider text-zinc-500">
        Win Prediction
      </p>
      <div className="mt-1 flex items-center justify-between text-[9px]">
        <span className="truncate text-zinc-300">
          {team1Label} {team1Percent}
        </span>
        <span className="truncate text-zinc-300">
          {team2Label} {team2Percent}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="flex h-full">
          <div
            className="h-full bg-emerald-400/85"
            style={{ width: `${team1Width}%` }}
          />
          <div
            className="h-full bg-sky-400/85"
            style={{ width: `${team2Width}%` }}
          />
        </div>
      </div>
    </div>
  );
}

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

export function SubscribeCompactView({
  detail,
  showDetails = true,
}: {
  detail: MatchDetailData;
  showDetails?: boolean;
}) {
  const statusType = getStatusType(detail.status);
  const batters = detail.liveState?.batters ?? [];
  const bowlerRows = [
    ...(detail.liveState?.bowler
      ? [{ ...detail.liveState.bowler, role: "Current" as const }]
      : []),
    ...(detail.liveState?.previousBowlers ?? []).map((bowler) => ({
      ...bowler,
      role: "Previous" as const,
    })),
  ];
  const currentRunRate = detail.liveState?.currentRunRate || "-";
  const requiredRunRate = detail.liveState?.requiredRunRate || "-";
  const showRequiredRate = shouldShowRequiredRate(requiredRunRate);
  const hasRecentBreakdown = Boolean(detail.liveState?.recentBalls?.length);
  const breakdownBalls = hasRecentBreakdown
    ? (detail.liveState?.recentBalls ?? [])
    : (detail.liveState?.currentOverBalls ?? []);
  const breakdownLabel = hasRecentBreakdown
    ? (detail.liveState?.recentBallsLabel ?? "Recent balls")
    : "Current over";

  if (!showDetails) {
    return (
      <div className="p-2">
        <div className="space-y-2">
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
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[9px] text-red-400/90">
              {detail.status || detail.state || "-"}
            </p>
            <StatusBadge
              status={detail.status}
              statusType={statusType}
              compact
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pb-0.5">
      <div className="flex items-start justify-end gap-2">
        <StatusBadge status={detail.status} statusType={statusType} compact />
      </div>

      <div className="space-y-3 rounded-md border border-white/6 bg-zinc-900/60 p-2">
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

        <div className="flex items-center justify-between gap-2 text-[9px]">
          <p className=" text-red-400/90">
            {detail.status || detail.state || "-"}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">RR</span>
              <span className="tabular-nums text-zinc-50">
                {currentRunRate}
              </span>
            </div>
            {showRequiredRate ? (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">RRR</span>
                <span className="tabular-nums text-zinc-50">
                  {requiredRunRate}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {detail.winPrediction ? (
        <WinPredictionBar
          team1Label={detail.team1.shortName || detail.team1.name}
          team1Percent={detail.winPrediction.team1Percent}
          team2Label={detail.team2.shortName || detail.team2.name}
          team2Percent={detail.winPrediction.team2Percent}
        />
      ) : null}

      <div className="overflow-x-auto rounded-md border border-white/6 bg-zinc-900/60 px-2 py-1.5">
        <table className="w-full min-w-[260px] border-collapse text-left text-[9px]">
          <thead>
            <tr className="border-b border-white/8 text-zinc-500">
              <th className="py-1 pr-2 font-medium">Batter</th>
              <th className="px-1 py-1 text-right font-medium">R</th>
              <th className="px-1 py-1 text-right font-medium">B</th>
              <th className="px-1 py-1 text-right font-medium">4s</th>
              <th className="px-1 py-1 text-right font-medium">6s</th>
              <th className="py-1 pl-1 text-right font-medium">SR</th>
            </tr>
          </thead>
          <tbody>
            {batters.map((batter) => (
              <tr
                key={batter.id}
                className="border-b border-white/6 last:border-0"
              >
                <td className="py-1 pr-2 text-zinc-200">
                  {batter.name}
                  {batter.onStrike ? " *" : ""}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-50">
                  {batter.runs}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-300">
                  {batter.balls}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-300">
                  {batter.fours}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-300">
                  {batter.sixes}
                </td>
                <td className="py-1 pl-1 text-right tabular-nums text-zinc-300">
                  {batter.strikeRate}
                </td>
              </tr>
            ))}
            {batters.length === 0 ? (
              <tr>
                <td className="py-1 text-zinc-500" colSpan={6}>
                  Live batting data unavailable.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-md border border-white/6 bg-zinc-900/60 px-2 py-1.5">
        <table className="w-full min-w-[260px] border-collapse text-left text-[9px]">
          <thead>
            <tr className="border-b border-white/8 text-zinc-500">
              <th className="py-1 pr-2 font-medium">Bowler</th>
              <th className="px-1 py-1 text-right font-medium">O</th>
              <th className="px-1 py-1 text-right font-medium">M</th>
              <th className="px-1 py-1 text-right font-medium">R</th>
              <th className="px-1 py-1 text-right font-medium">W</th>
              <th className="py-1 pl-1 text-right font-medium">ECO</th>
            </tr>
          </thead>
          <tbody>
            {bowlerRows.map((bowler) => (
              <tr
                key={`${bowler.id}-${bowler.role}`}
                className="border-b border-white/6 last:border-0"
              >
                <td className="py-1 pr-2 text-zinc-200">
                  <p>{bowler.name}</p>
                  <p className="text-[8px] uppercase tracking-wide text-zinc-500">
                    {bowler.role}
                  </p>
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-300">
                  {bowler.overs}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-300">
                  {bowler.maidens}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-300">
                  {bowler.runs}
                </td>
                <td className="px-1 py-1 text-right tabular-nums text-zinc-50">
                  {bowler.wickets}
                </td>
                <td className="py-1 pl-1 text-right tabular-nums text-zinc-300">
                  {bowler.economy}
                </td>
              </tr>
            ))}
            {bowlerRows.length === 0 ? (
              <tr>
                <td className="py-1 text-zinc-500" colSpan={6}>
                  Bowling data unavailable.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-white/6 bg-zinc-900/60 px-2 py-1.5">
        <p className="text-[8px] font-medium uppercase tracking-wider text-zinc-500">
          {breakdownLabel || "Current over"}
        </p>
        {breakdownBalls.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {breakdownBalls.slice(-10).map((ball, index) => (
              <BallChip
                key={`${ball.label}-${ball.value}-${index}`}
                ball={ball}
              />
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[9px] text-zinc-500">
            Ball breakdown unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
