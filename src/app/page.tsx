"use client";

import { Power } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { EmptyState } from "@/components/cricket/empty-state";
import { ErrorState } from "@/components/cricket/error-state";
import { LoadingState } from "@/components/cricket/loading-state";
import { MatchCard } from "@/components/cricket/match-card";
import {
  useSyncWindowMode,
  useSyncWindowSize,
  useWindowClose,
  useWindowDragStart,
} from "@/hooks/use-tauri-window";
import { MATCH_TABS, type MatchTabKey } from "@/lib/cricket-ui";
import { useMatchesQuery } from "@/lib/cricket-query";
import { cn } from "@/lib/classnames";
import { HOME_WINDOW_SIZE } from "@/lib/window-presets";

const HOME_TAB_STORAGE_KEY = "overa.home.selected-tab";
const HOME_TAB_STORAGE_EVENT = "overa.home.selected-tab-change";

function getStoredTab(): MatchTabKey {
  if (typeof window === "undefined") {
    return "live";
  }

  const persisted = window.localStorage.getItem(HOME_TAB_STORAGE_KEY);
  const isValidTab = MATCH_TABS.some((tab) => tab.key === persisted);

  return isValidTab ? (persisted as MatchTabKey) : "live";
}

function subscribeToStoredTab(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(HOME_TAB_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(HOME_TAB_STORAGE_EVENT, onStoreChange);
  };
}

function setStoredTab(tab: MatchTabKey) {
  window.localStorage.setItem(HOME_TAB_STORAGE_KEY, tab);
  window.dispatchEvent(new Event(HOME_TAB_STORAGE_EVENT));
}

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
  useSyncWindowMode("app");
  useSyncWindowSize(HOME_WINDOW_SIZE);

  const startDrag = useWindowDragStart();
  const closeWindow = useWindowClose();
  const { data, error, isError, isLoading, refetch } = useMatchesQuery();

  const counts = useMemo(() => {
    return {
      live: data?.live.length ?? 0,
      upcoming: data?.upcoming.length ?? 0,
      recent: data?.recent.length ?? 0,
    };
  }, [data]);

  const activeTab = useSyncExternalStore<MatchTabKey>(
    subscribeToStoredTab,
    getStoredTab,
    () => "live",
  );

  const matches = data?.[activeTab] ?? [];

  return (
    <main
      className="flex h-screen w-screen items-center justify-center bg-transparent"
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <section className="glass-frame flex h-full w-full flex-col overflow-hidden rounded-[18px] border border-white/12 bg-slate-950/70 backdrop-blur-2xl px-1 pb-1">
        <header
          className="flex cursor-grab items-center justify-between gap-2 border-b border-white/8 px-3 py-2 active:cursor-grabbing"
          data-tauri-drag-region
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/80">
            Overa
          </p>

          <div className="flex items-center gap-1" data-no-drag>
            <button
              type="button"
              onClick={closeWindow}
              className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-white/8 bg-white/4 text-slate-300 transition hover:border-white/16 hover:bg-white/8 hover:text-slate-100"
              aria-label="Close app"
              data-no-drag
            >
              <Power className="h-3 w-3" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-1.5" data-no-drag>
          <nav className="mb-2.5 grid grid-cols-3 gap-0.5 rounded-lg border border-white/8 bg-white/3 p-0.5">
            {MATCH_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStoredTab(tab.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-[9px] font-medium transition",
                  activeTab === tab.key
                    ? "bg-white/12 text-slate-100"
                    : "text-slate-400 hover:bg-white/8 hover:text-slate-200",
                )}
                data-no-drag
              >
                <span>{tab.label}</span>
                <span className="ml-1 text-[9px] opacity-60">
                  {counts[tab.key]}
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
            <div className="space-y-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : null}
        </div>

        <footer
          className="flex items-center justify-between border-t border-white/6 px-3 py-1.5 text-[9px] tracking-[0.16em] text-slate-400/60"
          data-tauri-drag-region
        >
          <div>
            Built by{" "}
            <a
              href="https://mohammeddanish.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200"
            >
              Danish
            </a>
          </div>
          <span>v0.1.0</span>
        </footer>
      </section>
    </main>
  );
}
