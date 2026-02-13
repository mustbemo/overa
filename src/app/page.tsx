"use client";

import { Loader2, Power, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/cricket/empty-state";
import { ErrorState } from "@/components/cricket/error-state";
import { LoadingState } from "@/components/cricket/loading-state";
import { MatchCard } from "@/components/cricket/match-card";
import { useSyncWindowSize, useWindowClose, useWindowDragStart } from "@/hooks/use-tauri-window";
import {
  formatUpdatedTime,
  MATCH_TABS,
  pickDefaultTab,
  type MatchTabKey,
} from "@/lib/cricket-ui";
import { useMatchesQuery } from "@/lib/cricket-query";
import { cn } from "@/lib/classnames";
import { HOME_WINDOW_SIZE } from "@/lib/window-presets";

const EMPTY_TAB_MESSAGE: Record<
  MatchTabKey,
  { title: string; description: string }
> = {
  live: {
    title: "No live matches",
    description: "Live games will appear here automatically.",
  },
  upcoming: {
    title: "No upcoming matches",
    description: "Upcoming fixtures are currently unavailable.",
  },
  recent: {
    title: "No recently finished matches",
    description: "Finished match summaries are currently unavailable.",
  },
};

export default function HomePage() {
  useSyncWindowSize(HOME_WINDOW_SIZE);

  const startDrag = useWindowDragStart();
  const closeWindow = useWindowClose();
  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useMatchesQuery();

  const [selectedTab, setSelectedTab] = useState<MatchTabKey>("live");

  const counts = useMemo(() => {
    return {
      live: data?.live.length ?? 0,
      upcoming: data?.upcoming.length ?? 0,
      recent: data?.recent.length ?? 0,
    };
  }, [data]);

  const activeTab = useMemo(() => {
    if (!data) {
      return selectedTab;
    }

    if (data[selectedTab].length > 0) {
      return selectedTab;
    }

    return pickDefaultTab(data);
  }, [data, selectedTab]);

  const matches = data?.[activeTab] ?? [];

  return (
    <main
      className="flex h-screen w-screen items-center justify-center bg-transparent p-2"
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <section className="glass-frame flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-white/20 bg-slate-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <header
          className="flex items-start justify-between gap-2 border-b border-white/10 px-3 py-2.5"
          data-tauri-drag-region
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200/90">
              CricLive Widget
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300/80">
              Floating desktop scoreboard
            </p>
          </div>

          <div className="flex items-center gap-1" data-no-drag>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              aria-label="Refresh now"
              data-no-drag
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={closeWindow}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              aria-label="Close app"
              data-no-drag
            >
              <Power className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-3" data-no-drag>
          <nav className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {MATCH_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedTab(tab.key)}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
                  activeTab === tab.key
                    ? "bg-white/15 text-slate-100"
                    : "text-slate-300/80 hover:bg-white/10 hover:text-slate-100",
                )}
                data-no-drag
              >
                <span>{tab.label}</span>
                <span className="ml-1 text-[10px] text-slate-300/70">
                  ({counts[tab.key]})
                </span>
              </button>
            ))}
          </nav>

          {isLoading ? <LoadingState message="Loading matches..." /> : null}

          {isError ? (
            <ErrorState
              title="Unable to load matches"
              message={error?.message ?? "Unknown error"}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && matches.length === 0 ? (
            <EmptyState
              title={EMPTY_TAB_MESSAGE[activeTab].title}
              description={EMPTY_TAB_MESSAGE[activeTab].description}
            />
          ) : null}

          {!isLoading && !isError && matches.length > 0 ? (
            <div className="space-y-2.5">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : null}
        </div>

        <footer
          className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-300/70"
          data-tauri-drag-region
        >
          <span>Auto Refresh 30s</span>
          <span>Updated {formatUpdatedTime(dataUpdatedAt)}</span>
        </footer>
      </section>
    </main>
  );
}
