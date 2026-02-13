"use client";

import { ArrowLeft, Bell, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/cricket/empty-state";
import { ErrorState } from "@/components/cricket/error-state";
import { InningsCard } from "@/components/cricket/innings-card";
import { LiveCenter } from "@/components/cricket/live-center";
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
import { MATCH_WINDOW_SIZE } from "@/lib/window-presets";

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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} />
        <span className="truncate text-sm font-semibold text-slate-100">{name}</span>
      </div>
      <span className="shrink-0 text-sm text-slate-200">{score || "-"}</span>
    </div>
  );
}

export function MatchPageClient() {
  useSyncWindowSize(MATCH_WINDOW_SIZE);

  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";

  const startDrag = useWindowDragStart();

  const { data, error, isError, isLoading, isFetching, refetch } =
    useMatchDetailQuery(matchId);

  if (!matchId) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-transparent p-2">
        <section className="glass-frame w-full rounded-[26px] border border-white/20 bg-slate-950/70 p-4">
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

  return (
    <main
      className="flex h-screen w-screen items-center justify-center bg-transparent p-2"
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <section className="glass-frame flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-white/20 bg-slate-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <header
          className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5"
          data-tauri-drag-region
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            aria-label="Back to home"
            data-no-drag
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-teal-200/90">
              Match Details
            </p>
            <p className="truncate text-[11px] text-slate-300/80">
              {data?.title || "Loading..."}
            </p>
          </div>

          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-200" />
          ) : (
            <span className="h-4 w-4" />
          )}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3" data-no-drag>
          {isLoading ? <LoadingState message="Loading match details..." /> : null}

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
              <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {data.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-300/80">
                      {data.series || "Series"}
                    </p>
                  </div>
                  <StatusBadge status={data.status} statusType={statusType} />
                </div>

                <div className="space-y-2">
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

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <SummaryChip
                    label="Run Rate"
                    value={data.liveState?.currentRunRate || "-"}
                  />
                  <SummaryChip
                    label="Required Rate"
                    value={data.liveState?.requiredRunRate || "-"}
                  />
                  <SummaryChip label="Toss" value={data.toss} />
                  <SummaryChip label="Venue" value={data.venue} />
                  <SummaryChip label="Match" value={data.matchDesc} />
                  <SummaryChip label="Status" value={data.status || data.state} />
                </div>

                {isLive ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(buildMatchHref("/subscribe", data.id))
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                    data-no-drag
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Subscribe Floating Widget
                  </button>
                ) : null}
              </section>

              {data.liveState ? <LiveCenter liveState={data.liveState} /> : null}

              {data.innings.length > 0 ? (
                <section className="space-y-2">
                  {data.innings.map((innings, index) => (
                    <InningsCard
                      key={`${innings.inningsId}-${index}`}
                      innings={innings}
                    />
                  ))}
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
