"use client";

import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/cricket/empty-state";
import { ErrorState } from "@/components/cricket/error-state";
import { InningsCard } from "@/components/cricket/innings-card";
import { LoadingState } from "@/components/cricket/loading-state";
import { StatusBadge } from "@/components/cricket/status-badge";
import { SummaryChip } from "@/components/cricket/summary-chip";
import { TeamMark } from "@/components/cricket/team-mark";
import {
  useSyncWindowSize,
  useWindowDragStart,
} from "@/hooks/use-tauri-window";
import { buildMatchHref, getStatusType } from "@/lib/cricket-ui";
import { useMatchDetailQuery } from "@/lib/cricket-query";
import type { LiveOverBall, MatchDetailData, MatchInnings } from "@/lib/types";
import { MATCH_WINDOW_SIZE } from "@/lib/window-presets";

type InningsTabKey = "team1" | "team2";

function normalizeTeamKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
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

function groupInningsByTeam(data: MatchDetailData): Record<InningsTabKey, MatchInnings[]> {
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

function stripStatusSuffix(title: string, status: string): string {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return "-";
  }

  const separatorIndex = normalizedTitle.lastIndexOf(" - ");

  if (separatorIndex < 0) {
    return normalizedTitle;
  }

  const withoutSuffix = normalizedTitle.slice(0, separatorIndex).trim();
  const suffix = normalizedTitle.slice(separatorIndex + 3).trim().toLowerCase();
  const normalizedStatus = status.trim().toLowerCase();

  if (!withoutSuffix) {
    return normalizedTitle;
  }

  if (!normalizedStatus) {
    return withoutSuffix;
  }

  if (
    suffix === normalizedStatus ||
    suffix.includes(normalizedStatus) ||
    normalizedStatus.includes(suffix)
  ) {
    return withoutSuffix;
  }

  return normalizedTitle;
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
          <p className="truncate text-[12px] font-medium text-slate-100">{name}</p>
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

export function MatchPageClient() {
  useSyncWindowSize(MATCH_WINDOW_SIZE);

  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";
  const [selectedInningsTab, setSelectedInningsTab] =
    useState<InningsTabKey>("team1");

  const startDrag = useWindowDragStart();

  const { data, error, isError, isLoading, isFetching, refetch } =
    useMatchDetailQuery(matchId);

  if (!matchId) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-transparent p-2">
        <section className="glass-frame w-full rounded-[22px] border border-white/16 bg-slate-950/70 p-3">
          <ErrorState
            title="Missing match id"
            message="Open this page from Home so the selected match id is included."
            onRetry={() => router.push("/")}
          />
        </section>
      </main>
    );
  }

  const statusType = data ? getStatusType(data.status) : "upcoming";
  const isLive = statusType === "live";
  const displayTitle = data ? stripStatusSuffix(data.title, data.status) : "";
  const inningsByTeam = data
    ? groupInningsByTeam(data)
    : {
        team1: [],
        team2: [],
      };
  const activeInningsTab: InningsTabKey =
    inningsByTeam[selectedInningsTab].length > 0
      ? selectedInningsTab
      : inningsByTeam.team1.length > 0
        ? "team1"
        : "team2";
  const activeInnings = inningsByTeam[activeInningsTab];
  const currentRunRate = data?.liveState?.currentRunRate || "-";
  const requiredRunRate = data?.liveState?.requiredRunRate || "-";
  const showRequiredRate = shouldShowRequiredRate(requiredRunRate);
  const currentBatters = data?.liveState?.batters ?? [];
  const bowlerRows = (() => {
    if (!data?.liveState) {
      return [];
    }

    const rows: Array<{ role: string; overs: string; maidens: string; runs: string; wickets: string; economy: string; name: string; id: string }> = [];

    if (data.liveState.bowler) {
      rows.push({
        ...data.liveState.bowler,
        role: "Current",
      });
    }

    for (const bowler of data.liveState.previousBowlers) {
      rows.push({
        ...bowler,
        role: "Previous",
      });
    }

    return rows;
  })();
  const hasRecentBreakdown = Boolean(data?.liveState?.recentBalls?.length);
  const breakdownBalls = hasRecentBreakdown
    ? (data?.liveState?.recentBalls ?? [])
    : (data?.liveState?.currentOverBalls ?? []);
  const breakdownLabel = hasRecentBreakdown
    ? (data?.liveState?.recentBallsLabel ?? "Recent balls")
    : "Current over";

  return (
    <main
      className="flex h-screen w-screen items-center justify-center bg-transparent p-2"
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <section className="glass-frame flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/16 bg-slate-950/70 backdrop-blur-2xl">
        {/* Match Header */}
        <header
          className="flex items-center justify-between gap-1 border-b border-white/8 px-3 py-2"
          data-tauri-drag-region
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:border-white/16 hover:bg-white/8"
            aria-label="Back to home"
            data-no-drag
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-[11px] font-medium">
              {displayTitle || "Loading..."}
            </p>
            <p className="truncate text-[9px] text-slate-400">
              {data?.series || "Series"}
            </p>
          </div>

          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-300" />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </header>

        {/* Match Details */}
        <div
          className="flex-1 space-y-2.5 overflow-y-auto px-2.5 py-2.5"
          data-no-drag
        >
          {isLoading ? (
            <LoadingState message="Loading match details..." />
          ) : null}

          {isError ? (
            <ErrorState
              title="Failed to load match details"
              message={error?.message ?? "Unknown error"}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && data ? (
            <>
              <section className="rounded-xl border border-white/8 bg-white/4 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-slate-100">
                      {displayTitle}
                    </p>
                    <p className="mt-px truncate text-[10px] text-slate-400">
                      {data.series || "Series"}
                    </p>
                  </div>
                  <StatusBadge status={data.status} statusType={statusType} />
                </div>

                <div className="rounded-lg border border-white/8 bg-black/20 px-2.5 py-2">
                  <TeamScoreRow
                    name={data.team1.name}
                    shortName={data.team1.shortName}
                    score={data.team1.score}
                    flagUrl={data.team1.flagUrl}
                  />
                  <TeamScoreRow
                    name={data.team2.name}
                    shortName={data.team2.shortName}
                    score={data.team2.score}
                    flagUrl={data.team2.flagUrl}
                  />
                </div>

                <p className="mt-2.5 text-[10px] font-medium text-emerald-200/90">
                  {data.status || data.state || "-"}
                </p>

                <div
                  className={`mt-2 grid gap-1.5 ${showRequiredRate ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">
                      RR
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-100">
                      {currentRunRate}
                    </p>
                  </div>
                  {showRequiredRate ? (
                    <div className="rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5">
                      <p className="text-[9px] uppercase tracking-wider text-slate-400">
                        RRR
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-100">
                        {requiredRunRate}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2.5 overflow-x-auto rounded-lg border border-white/8 bg-black/20 px-2 py-1.5">
                  <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Current Batters
                  </p>
                  <table className="w-full min-w-[320px] border-collapse text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-white/8 text-slate-400">
                        <th className="py-1.5 pr-2 font-medium">Batter</th>
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

                <div className="mt-2.5 overflow-x-auto rounded-lg border border-white/8 bg-black/20 px-2 py-1.5">
                  <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                    Current And Previous Bowlers
                  </p>
                  <table className="w-full min-w-[330px] border-collapse text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-white/8 text-slate-400">
                        <th className="py-1.5 pr-2 font-medium">Bowler</th>
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
                  <SummaryChip label="Toss" value={data.toss} />
                  <SummaryChip label="Venue" value={data.venue} />
                  <SummaryChip label="Start" value={data.startTime} />
                  <SummaryChip label="Format" value={data.format} />
                  <SummaryChip label="Match" value={data.matchDesc} />
                </div>

                {isLive ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(buildMatchHref("/subscribe", data.id))
                    }
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                    data-no-drag
                  >
                    <Bell className="h-3 w-3" />
                    Subscribe Floating Widget
                  </button>
                ) : null}
              </section>

              {data.innings.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-white/8 bg-white/4">
                  <div className="flex items-center gap-4 border-b border-white/8 px-3 pt-2">
                    {(
                      [
                        {
                          key: "team1",
                          label: data.team1.shortName || data.team1.name,
                        },
                        {
                          key: "team2",
                          label: data.team2.shortName || data.team2.name,
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setSelectedInningsTab(tab.key)}
                        className={`border-b-2 pb-1.5 text-[10px] font-medium uppercase tracking-wide transition ${activeInningsTab === tab.key ? "border-teal-300 text-slate-100" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                        data-no-drag
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
                        title="Team breakdown unavailable"
                        description="This team innings data is not available yet."
                      />
                    ) : null}
                  </div>
                </section>
              ) : (
                <EmptyState
                  title="Scorecard unavailable"
                  description="The innings breakdown is not available yet."
                />
              )}
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
