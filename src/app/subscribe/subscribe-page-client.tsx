"use client";

import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorState } from "@/components/cricket/error-state";
import { LoadingState } from "@/components/cricket/loading-state";
import { WidgetCollapsed } from "@/components/cricket/widget-collapsed";
import { WidgetExpanded } from "@/components/cricket/widget-expanded";
import {
  useSyncWindowSize,
  useWindowDragStart,
} from "@/hooks/use-tauri-window";
import {
  buildMatchHref,
  getPartnership,
  getStatusType,
} from "@/lib/cricket-ui";
import { useMatchDetailQuery } from "@/lib/cricket-query";
import { cn } from "@/lib/classnames";
import {
  SUBSCRIBE_COLLAPSED_WINDOW_SIZE,
  SUBSCRIBE_EXPANDED_WINDOW_SIZE,
} from "@/lib/window-presets";

export function SubscribePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";

  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  useSyncWindowSize(
    expanded
      ? SUBSCRIBE_EXPANDED_WINDOW_SIZE
      : SUBSCRIBE_COLLAPSED_WINDOW_SIZE,
  );

  const startDrag = useWindowDragStart();

  const { data, error, isError, isLoading, isFetching, refetch } =
    useMatchDetailQuery(matchId);

  const statusType = data ? getStatusType(data.status) : "upcoming";

  const partnership = useMemo(() => {
    if (!data) {
      return "-";
    }
    return getPartnership(data);
  }, [data]);

  if (!matchId) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-transparent p-2">
        <section className="glass-frame w-full rounded-[26px] border border-white/20 bg-slate-950/70 p-4">
          <ErrorState
            title="Missing match id"
            message="Open this page from match details to continue."
            onRetry={() => router.push("/")}
          />
        </section>
      </main>
    );
  }

  if (data && statusType !== "live") {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-transparent p-2">
        <section className="glass-frame w-full rounded-[26px] border border-white/20 bg-slate-950/70 p-4">
          <ErrorState
            title="Widget available for live matches"
            message="This match is not live right now."
            onRetry={() => router.push(buildMatchHref("/match", matchId))}
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
      <section
        className={cn(
          "glass-frame flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-white/20 bg-slate-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-[height,width] duration-300",
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <header
          className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2"
          data-tauri-drag-region
        >
          <button
            type="button"
            onClick={() => router.push(buildMatchHref("/match", matchId))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            aria-label="Back to details"
            data-no-drag
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 px-1 text-center">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">
              Live Widget
            </p>
            <p className="truncate text-[11px] text-slate-300/75">
              {data?.title || "Loading..."}
            </p>
          </div>

          <div className="flex h-7 w-7 items-center justify-center">
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-200" />
            ) : null}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-2" data-no-drag>
          {isLoading ? <LoadingState message="Loading live widget..." /> : null}

          {isError ? (
            <ErrorState
              title="Unable to load widget"
              message={error?.message ?? "Unknown error"}
              onRetry={() => {
                void refetch();
              }}
            />
          ) : null}

          {!isLoading && !isError && data ? (
            <div className="space-y-2">
              <WidgetCollapsed detail={data} />

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-out",
                  expanded ? "max-h-[380px] opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <WidgetExpanded detail={data} partnership={partnership} />
              </div>
            </div>
          ) : null}
        </div>

        <footer
          className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-slate-300/70"
          data-tauri-drag-region
        >
          <span>Auto Refresh 30s</span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition",
              hovered || expanded
                ? "border-white/20 bg-white/10 text-slate-100"
                : "border-transparent bg-transparent text-slate-300/60",
            )}
            data-no-drag
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
            {expanded ? "Collapse" : "Expand"}
          </button>
        </footer>
      </section>
    </main>
  );
}
