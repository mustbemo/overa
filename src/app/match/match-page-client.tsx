"use client";

import { ArrowLeft, Bell } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState } from "@/components/cricket/error-state";
import { LoadingState } from "@/components/cricket/loading-state";
import {
  MatchDetailsTabs,
  formatMatchTitle,
} from "@/components/cricket/match-details-tabs";
import {
  useSyncWindowSize,
  useWindowDragStart,
} from "@/hooks/use-tauri-window";
import { buildMatchHref, getStatusType } from "@/lib/cricket-ui";
import { useMatchDetailQuery } from "@/lib/cricket-query";
import { MATCH_WINDOW_SIZE } from "@/lib/window-presets";

export function MatchPageClient() {
  useSyncWindowSize(MATCH_WINDOW_SIZE);

  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";

  const startDrag = useWindowDragStart();

  const { data, error, isError, isLoading, refetch } =
    useMatchDetailQuery(matchId);
  const isLive = data ? getStatusType(data.status) === "live" : false;

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

  return (
    <main
      className="flex h-screen w-screen items-center justify-center bg-transparent p-2"
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <section className="glass-frame flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/16 bg-slate-950/70 backdrop-blur-2xl">
        <header
          className="flex cursor-grab items-center justify-between gap-1 border-b border-white/8 px-3 py-2 active:cursor-grabbing"
          data-tauri-drag-region
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-300 transition hover:border-white/16 hover:bg-white/8"
            aria-label="Back to home"
            data-no-drag
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-[11px] font-medium">
              {data ? formatMatchTitle(data) : "Loading..."}
            </p>
            <p className="truncate text-[9px] text-slate-400">
              {data?.series || "Series"}
            </p>
          </div>

          {isLive && data ? (
            <button
              type="button"
              onClick={() => router.push(buildMatchHref("/subscribe", data.id))}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              title="Subscribe floating widget"
              data-no-drag
            >
              <Bell className="h-2.5 w-2.5" />
              Widget
            </button>
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </header>

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
            <MatchDetailsTabs key={data.id} detail={data} />
          ) : null}
        </div>
      </section>
    </main>
  );
}
