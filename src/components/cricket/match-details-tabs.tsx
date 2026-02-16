"use client";

import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/classnames";
import { getStatusType } from "@/lib/cricket-ui";
import type {
  LiveOverBall,
  MatchDetailData,
  MatchInnings,
  TeamPlayer,
} from "@/lib/types";
import { EmptyState } from "./empty-state";
import { InningsCard } from "./innings-card";
import { StatusBadge } from "./status-badge";
import { SummaryChip } from "./summary-chip";
import { TeamMark } from "./team-mark";

type DetailTabKey = "live" | "scorecard" | "squads";
type InningsTabKey = "team1" | "team2";

function normalizeTeamKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function teamNamesLikelyMatch(
  inningsTeamName: string,
  teamName: string,
  teamShortName: string,
): boolean {
  const inningsKey = normalizeTeamKey(inningsTeamName);
  const teamKey = normalizeTeamKey(teamName);
  const shortKey = normalizeTeamKey(teamShortName);

  if (!inningsKey) {
    return false;
  }

  return (
    inningsKey === teamKey ||
    inningsKey.includes(teamKey) ||
    teamKey.includes(inningsKey) ||
    (shortKey.length > 1 &&
      (inningsKey === shortKey ||
        inningsKey.includes(shortKey) ||
        shortKey.includes(inningsKey)))
  );
}

function groupInningsByTeam(
  data: MatchDetailData,
): Record<InningsTabKey, MatchInnings[]> {
  const grouped: Record<InningsTabKey, MatchInnings[]> = {
    team1: [],
    team2: [],
  };

  for (const innings of data.innings) {
    const belongsToTeam1 = teamNamesLikelyMatch(
      innings.battingTeam,
      data.team1.name,
      data.team1.shortName,
    );
    const belongsToTeam2 = teamNamesLikelyMatch(
      innings.battingTeam,
      data.team2.name,
      data.team2.shortName,
    );

    if (belongsToTeam1 && !belongsToTeam2) {
      grouped.team1.push(innings);
      continue;
    }

    if (belongsToTeam2 && !belongsToTeam1) {
      grouped.team2.push(innings);
      continue;
    }

    if (grouped.team1.length <= grouped.team2.length) {
      grouped.team1.push(innings);
    } else {
      grouped.team2.push(innings);
    }
  }

  return grouped;
}

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

function pickYetToBatPlayers(innings: MatchInnings[]): string[] {
  for (const entry of [...innings].reverse()) {
    if (entry.yetToBat.length > 0) {
      return entry.yetToBat;
    }
  }

  return [];
}

function sortSquad(players: TeamPlayer[]): TeamPlayer[] {
  return [...players].sort((a, b) => a.name.localeCompare(b.name));
}

function defaultScorecardTab(
  inningsByTeam: Record<InningsTabKey, MatchInnings[]>,
): InningsTabKey {
  if (inningsByTeam.team1.length === 0 && inningsByTeam.team2.length > 0) {
    return "team2";
  }

  return "team1";
}

export function formatMatchTitle(detail: MatchDetailData): string {
  const matchup = `${detail.team1.name} vs ${detail.team2.name}`;

  if (!detail.matchDesc || detail.matchDesc === "-") {
    return matchup;
  }

  return `${matchup}, ${detail.matchDesc}`;
}

function TeamScoreRow({
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-white/8 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-slate-100">
            {name}
          </p>
          <p className="truncate text-[9px] uppercase tracking-wider text-slate-400">
            {shortName}
          </p>
        </div>
      </div>
      <p className="shrink-0 text-[14px] font-semibold tabular-nums text-slate-50">
        {score || "-"}
      </p>
    </div>
  );
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
      className={`inline-flex min-w-7 items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${kindStyle[ball.kind]}`}
      title={ball.label}
    >
      {ball.value}
    </span>
  );
}

function SquadPlayerCell({ player }: { player: TeamPlayer | null }) {
  if (!player) {
    return <p className="text-[10px] text-slate-500">-</p>;
  }

  return (
    <>
      <p className="truncate text-[10px] font-medium text-slate-100">
        {player.name}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1">
        {player.role && player.role !== "-" ? (
          <span className="rounded border border-white/10 bg-black/30 px-1 py-px text-[8px] uppercase tracking-wide text-slate-300">
            {player.role}
          </span>
        ) : null}
        {player.captain ? (
          <span className="rounded border border-amber-400/35 bg-amber-500/10 px-1 py-px text-[8px] uppercase tracking-wide text-amber-200">
            C
          </span>
        ) : null}
        {player.keeper ? (
          <span className="rounded border border-sky-400/35 bg-sky-500/10 px-1 py-px text-[8px] uppercase tracking-wide text-sky-200">
            WK
          </span>
        ) : null}
        {player.substitute ? (
          <span className="rounded border border-violet-400/35 bg-violet-500/10 px-1 py-px text-[8px] uppercase tracking-wide text-violet-200">
            Sub
          </span>
        ) : null}
      </div>
    </>
  );
}

function SquadTableHeader({
  teamName,
  teamShortName,
  flagUrl,
  playerCount,
}: {
  teamName: string;
  teamShortName: string;
  flagUrl: string | null;
  playerCount: number;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <TeamMark
          name={teamName}
          shortName={teamShortName}
          flagUrl={flagUrl}
          compact
        />
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-200">
          {teamShortName || teamName}
        </p>
      </div>
      <p className="shrink-0 text-[9px] uppercase tracking-wide text-slate-400">
        {playerCount}
      </p>
    </div>
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
    <div className="mt-2 rounded-md border border-white/8 bg-black/20 p-2">
      <p className="text-[9px] uppercase tracking-wider text-slate-400">
        Win Prediction
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
        <div className="min-w-0">
          <p className="truncate text-slate-300">{team1Label}</p>
          <p className="font-semibold tabular-nums text-slate-100">
            {team1Percent}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate text-slate-300">{team2Label}</p>
          <p className="font-semibold tabular-nums text-slate-100">
            {team2Percent}
          </p>
        </div>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/8">
        <div className="flex h-full w-full">
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

export function MatchDetailsTabs({
  detail,
  showSubscribeButton = false,
  onSubscribe,
}: {
  detail: MatchDetailData;
  showSubscribeButton?: boolean;
  onSubscribe?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTabKey>("live");
  const [scorecardTab, setScorecardTab] = useState<InningsTabKey>(() =>
    defaultScorecardTab(groupInningsByTeam(detail)),
  );

  const statusType = getStatusType(detail.status);
  const isLive = statusType === "live";
  const displayTitle = formatMatchTitle(detail);

  const inningsByTeam = useMemo(() => groupInningsByTeam(detail), [detail]);
  const currentRunRate = detail.liveState?.currentRunRate || "-";
  const requiredRunRate = detail.liveState?.requiredRunRate || "-";
  const showRequiredRate = shouldShowRequiredRate(requiredRunRate);
  const currentBatters = detail.liveState?.batters ?? [];
  const yetToBatBatters = pickYetToBatPlayers(detail.innings);
  const team1Squad = useMemo(() => sortSquad(detail.team1Players), [detail]);
  const team2Squad = useMemo(() => sortSquad(detail.team2Players), [detail]);
  const hasSquadData = team1Squad.length > 0 || team2Squad.length > 0;
  const squadRows = useMemo(() => {
    const rowCount = Math.max(team1Squad.length, team2Squad.length);

    return Array.from({ length: rowCount }, (_, index) => ({
      team1Player: team1Squad[index] ?? null,
      team2Player: team2Squad[index] ?? null,
    }));
  }, [team1Squad, team2Squad]);

  const bowlerRows = (() => {
    if (!detail.liveState) {
      return [];
    }

    const rows: Array<{
      role: string;
      overs: string;
      maidens: string;
      runs: string;
      wickets: string;
      economy: string;
      name: string;
      id: string;
    }> = [];

    if (detail.liveState.bowler) {
      rows.push({
        ...detail.liveState.bowler,
        role: "Current",
      });
    }

    for (const bowler of detail.liveState.previousBowlers) {
      rows.push({
        ...bowler,
        role: "Previous",
      });
    }

    return rows;
  })();

  const hasRecentBreakdown = Boolean(detail.liveState?.recentBalls?.length);
  const breakdownBalls = hasRecentBreakdown
    ? (detail.liveState?.recentBalls ?? [])
    : (detail.liveState?.currentOverBalls ?? []);
  const breakdownLabel = hasRecentBreakdown
    ? (detail.liveState?.recentBallsLabel ?? "Recent balls")
    : "Current over";

  const activeInnings = inningsByTeam[scorecardTab];

  return (
    <div className="space-y-2.5">
      <nav className="grid grid-cols-3 gap-0.5 rounded-lg border border-white/8 bg-white/3 p-0.5">
        {(
          [
            { key: "live", label: "Live" },
            { key: "scorecard", label: "Scorecard" },
            { key: "squads", label: "Squads" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-md px-2 py-1 text-[9px] font-medium transition",
              activeTab === tab.key
                ? "bg-white/12 text-slate-100"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Live */}
      {activeTab === "live" ? (
        <section className="rounded-xl border border-white/8 bg-white/4 p-3">
          {/* Match Title */}
          <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
            {/* <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-slate-100">
                {displayTitle}
              </p>
              <p className="mt-px truncate text-[10px] text-slate-400">
                {detail.series || "Series"}
              </p>
            </div> */}
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={detail.status} statusType={statusType} />
            </div>
          </div>

          {/* Team Scores */}
          <div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2">
            <TeamScoreRow
              name={detail.team1.name}
              shortName={detail.team1.shortName}
              score={detail.team1.score}
              flagUrl={detail.team1.flagUrl}
            />
            <TeamScoreRow
              name={detail.team2.name}
              shortName={detail.team2.shortName}
              score={detail.team2.score}
              flagUrl={detail.team2.flagUrl}
            />
          </div>

          {/* Status */}
          <p className="mt-2.5 ml-1 pb-2 text-[10.5px] font-medium text-red-400/90">
            {detail.status || detail.state || "-"}
          </p>

          {/* Win Prediction */}
          {isLive && detail.winPrediction ? (
            <WinPredictionBar
              team1Label={detail.team1.shortName || detail.team1.name}
              team1Percent={detail.winPrediction.team1Percent}
              team2Label={detail.team2.shortName || detail.team2.name}
              team2Percent={detail.winPrediction.team2Percent}
            />
          ) : null}

          {/* RR & RRR */}
          <div
            className={`mt-2 grid gap-1.5 ${showRequiredRate ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div className="rounded-md border border-white/8 bg-black/20 px-2 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">
                RR
              </p>
              <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-100">
                {currentRunRate}
              </p>
            </div>
            {showRequiredRate ? (
              <div className="rounded-md border border-white/8 bg-black/20 px-2 py-1.5">
                <p className="text-[9px] uppercase tracking-wider text-slate-400">
                  RRR
                </p>
                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-100">
                  {requiredRunRate}
                </p>
              </div>
            ) : null}
          </div>

          {/* Current Batters */}
          <div className="mt-2.5 overflow-x-auto rounded-lg border border-white/8 bg-black/20 px-2 py-1.5">
            <table className="w-full min-w-[320px] border-collapse text-left text-[10px]">
              <thead>
                <tr className="border-b border-white/8 text-slate-400">
                  <th className="py-1.5 pr-2 font-medium">Current Batter</th>
                  <th className="px-1 py-1.5 text-right font-medium">R</th>
                  <th className="px-1 py-1.5 text-right font-medium">B</th>
                  <th className="px-1 py-1.5 text-right font-medium">4s</th>
                  <th className="px-1 py-1.5 text-right font-medium">6s</th>
                  <th className="py-1.5 pl-1 text-right font-medium">SR</th>
                </tr>
              </thead>
              <tbody>
                {currentBatters.map((batter) => (
                  <tr
                    key={batter.id}
                    className="border-b border-white/6 last:border-0"
                  >
                    <td className="py-1.5 pr-2 text-slate-200">
                      {batter.name}
                      {batter.onStrike ? " *" : ""}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-100">
                      {batter.runs}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-300">
                      {batter.balls}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-300">
                      {batter.fours}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-300">
                      {batter.sixes}
                    </td>
                    <td className="py-1.5 pl-1 text-right tabular-nums text-slate-300">
                      {batter.strikeRate}
                    </td>
                  </tr>
                ))}
                {currentBatters.length === 0 ? (
                  <tr>
                    <td className="py-1.5 text-slate-400" colSpan={6}>
                      Live batting data unavailable.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Yet To Bat */}
          <div className="mt-2.5 rounded-lg border border-white/8 bg-black/20 p-2">
            {/* Yet To Bat Players */}
            <p className="text-[9px] font-medium tracking-wider text-slate-400 pl-1 ">
              Yet To Bat
            </p>
            {yetToBatBatters.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {yetToBatBatters.map((player) => (
                  <span
                    key={player}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-200"
                  >
                    {player}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-[10px] text-slate-400">
                Yet-to-bat list unavailable.
              </p>
            )}
          </div>

          {/* Current Bowler */}
          <div className="mt-2.5 overflow-x-auto rounded-lg border border-white/8 bg-black/20 px-2 py-1.5">
            <table className="w-full min-w-[330px] border-collapse text-left text-[10px]">
              <thead>
                <tr className="border-b border-white/8 text-slate-400">
                  <th className="py-1.5 pr-2 font-medium">Current Bowler</th>
                  <th className="px-1 py-1.5 text-right font-medium">O</th>
                  <th className="px-1 py-1.5 text-right font-medium">M</th>
                  <th className="px-1 py-1.5 text-right font-medium">R</th>
                  <th className="px-1 py-1.5 text-right font-medium">W</th>
                  <th className="py-1.5 pl-1 text-right font-medium">ECO</th>
                </tr>
              </thead>
              <tbody>
                {bowlerRows.map((bowler) => (
                  <tr
                    key={`${bowler.id}-${bowler.role}`}
                    className="border-b border-white/6 last:border-0"
                  >
                    <td className="py-1.5 pr-2 text-slate-200">
                      <p>{bowler.name}</p>
                      <p className="text-[9px] uppercase tracking-wide text-slate-500">
                        {bowler.role}
                      </p>
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-300">
                      {bowler.overs}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-300">
                      {bowler.maidens}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-300">
                      {bowler.runs}
                    </td>
                    <td className="px-1 py-1.5 text-right tabular-nums text-slate-100">
                      {bowler.wickets}
                    </td>
                    <td className="py-1.5 pl-1 text-right tabular-nums text-slate-300">
                      {bowler.economy}
                    </td>
                  </tr>
                ))}
                {bowlerRows.length === 0 ? (
                  <tr>
                    <td className="py-1.5 text-slate-400" colSpan={6}>
                      Bowling data unavailable.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Ball Breakdown */}
          <div className="mt-2.5 rounded-lg border border-white/8 bg-black/20 px-2 py-1.5">
            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
              {breakdownLabel || "Current over"}
            </p>
            {breakdownBalls.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {breakdownBalls.map((ball, index) => (
                  <BallChip
                    key={`${ball.label}-${ball.value}-${index}`}
                    ball={ball}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-[10px] text-slate-400">
                Ball breakdown unavailable.
              </p>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <SummaryChip label="Toss" value={detail.toss} />
            <SummaryChip label="Venue" value={detail.venue} />
            <SummaryChip label="Start" value={detail.startTime} />
            <SummaryChip label="Format" value={detail.format} />
            <SummaryChip label="Match" value={detail.matchDesc} />
          </div>

          {/* Subscribe Button */}
          {showSubscribeButton && isLive ? (
            <button
              type="button"
              onClick={onSubscribe}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <Bell className="h-3 w-3" />
              Subscribe Floating Widget
            </button>
          ) : null}
        </section>
      ) : null}

      {/* Scorecard */}
      {activeTab === "scorecard" ? (
        <section className="overflow-hidden rounded-xl border border-white/8 bg-white/4">
          <div className="flex items-center gap-4 border-b border-white/8 px-3 pt-2">
            {(
              [
                {
                  key: "team1",
                  label: detail.team1.shortName || detail.team1.name,
                },
                {
                  key: "team2",
                  label: detail.team2.shortName || detail.team2.name,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setScorecardTab(tab.key)}
                className={`border-b-2 pb-1.5 text-[10px] font-medium uppercase tracking-wide transition ${scorecardTab === tab.key ? "border-teal-300 text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 p-2">
            {activeInnings.map((innings, index) => (
              <InningsCard
                key={`${innings.inningsId}-${index}`}
                innings={innings}
              />
            ))}
            {activeInnings.length === 0 ? (
              <EmptyState
                title="Team scorecard unavailable"
                description="No innings breakdown available for this team yet."
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Squads */}
      {activeTab === "squads" ? (
        <section className="overflow-hidden rounded-xl border border-white/8 bg-white/4">
          <div className="border-b border-white/8 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-300">
              Match Squads
            </p>
          </div>

          {hasSquadData ? (
            <div className="overflow-x-auto p-2">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr>
                    <th className="w-1/2 border-b border-white/8 px-2 py-2">
                      <SquadTableHeader
                        teamName={detail.team1.name}
                        teamShortName={detail.team1.shortName}
                        flagUrl={detail.team1.flagUrl}
                        playerCount={team1Squad.length}
                      />
                    </th>
                    <th className="w-1/2 border-b border-white/8 px-2 py-2">
                      <SquadTableHeader
                        teamName={detail.team2.name}
                        teamShortName={detail.team2.shortName}
                        flagUrl={detail.team2.flagUrl}
                        playerCount={team2Squad.length}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {squadRows.map((row, index) => (
                    <tr key={`squad-row-${index + 1}`} className="align-top">
                      <td className="border-t border-white/8 px-2 py-1.5">
                        <SquadPlayerCell player={row.team1Player} />
                      </td>
                      <td className="border-t border-white/8 px-2 py-1.5">
                        <SquadPlayerCell player={row.team2Player} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-3 py-2">
              <p className="text-[10px] text-slate-400">
                Squad data unavailable for this match.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
