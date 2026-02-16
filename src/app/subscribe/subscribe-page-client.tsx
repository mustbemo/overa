"use client";

import { ArrowLeft, Expand, Shrink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/cricket/error-state";
import { LoadingState } from "@/components/cricket/loading-state";
import { formatMatchTitle } from "@/components/cricket/match-details-tabs";
import { SubscribeCompactView } from "@/components/cricket/subscribe-compact-view";
import { SubscribeExpandedView } from "@/components/cricket/subscribe-expanded-view";
import {
  useSyncWindowSize,
  useWindowDragStart,
} from "@/hooks/use-tauri-window";
import { cn } from "@/lib/classnames";
import { buildMatchHref, getStatusType } from "@/lib/cricket-ui";
import { useMatchDetailQuery } from "@/lib/cricket-query";
import {
  SUBSCRIBE_COLLAPSED_HOVER_WINDOW_SIZE,
  SUBSCRIBE_COLLAPSED_WINDOW_SIZE,
  SUBSCRIBE_EXPANDED_WINDOW_SIZE,
} from "@/lib/window-presets";

function HeaderActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-slate-300 transition hover:border-white/16 hover:bg-white/8"
      data-no-drag
    >
      {children}
    </button>
  );
}

function SubscribeCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="glass-frame flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-white/16 bg-slate-950/70 backdrop-blur-2xl">
      {children}
    </section>
  );
}

export function SubscribePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";

  const [expanded, setExpanded] = useState(false);
  const [isCompactHovered, setIsCompactHovered] = useState(false);
  const showCompactHeader = !expanded && isCompactHovered;

  useSyncWindowSize(
    expanded
      ? SUBSCRIBE_EXPANDED_WINDOW_SIZE
      : showCompactHeader
        ? SUBSCRIBE_COLLAPSED_HOVER_WINDOW_SIZE
        : SUBSCRIBE_COLLAPSED_WINDOW_SIZE,
  );

  const startDrag = useWindowDragStart();

  const { data, error, isError, isLoading, refetch } =
    useMatchDetailQuery(matchId);

  const statusType = data ? getStatusType(data.status) : "upcoming";

  if (!matchId) {
    return (
      <main className="h-screen w-screen bg-transparent p-0.5">
        <SubscribeCard>
          <div className="p-2.5">
            <ErrorState
              title="Missing match id"
              message="Open this page from match details to continue."
              onRetry={() => router.push("/")}
            />
          </div>
        </SubscribeCard>
      </main>
    );
  }

  if (data && statusType !== "live") {
    return (
      <main className="h-screen w-screen bg-transparent p-0.5">
        <SubscribeCard>
          <div className="p-2.5">
            <ErrorState
              title="Widget available for live matches"
              message="This match is not live right now."
              onRetry={() => router.push(buildMatchHref("/match", matchId))}
            />
          </div>
        </SubscribeCard>
      </main>
    );
  }

  return (
    <main
      className="h-screen w-screen select-none bg-transparent p-0.5"
      onMouseDown={startDrag}
      data-tauri-drag-region
    >
      <SubscribeCard>
        <div
          className="relative flex h-full w-full flex-col"
          onMouseEnter={() => {
            if (!expanded) {
              setIsCompactHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (!expanded) {
              setIsCompactHovered(false);
            }
          }}
        >
          {expanded || showCompactHeader ? (
            <header
              className="flex cursor-grab items-center justify-between gap-1 border-b border-white/8 px-3 py-2 active:cursor-grabbing"
              data-tauri-drag-region
            >
              <HeaderActionButton
                title="Back to match details"
                onClick={() => router.push(buildMatchHref("/match", matchId))}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </HeaderActionButton>

              <div className="min-w-0 flex-1 px-1">
                <p className="truncate text-[11px] font-medium text-slate-100">
                  {data ? formatMatchTitle(data) : "Loading..."}
                </p>
                <p className="truncate text-[9px] text-slate-400">
                  {data?.series || "Series"}
                </p>
              </div>

              <div className="flex items-center gap-1" data-no-drag>
                <HeaderActionButton
                  title={expanded ? "Collapse widget" : "Expand widget"}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded ? (
                    <Shrink className="h-3.5 w-3.5" />
                  ) : (
                    <Expand className="h-3.5 w-3.5" />
                  )}
                </HeaderActionButton>
              </div>
            </header>
          ) : null}

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto",
              expanded || showCompactHeader ? "px-2.5 py-2.5" : "px-1.5 py-1.5",
            )}
            data-no-drag
          >
            {isLoading ? (
              <LoadingState message="Loading live widget..." />
            ) : null}

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
              expanded ? (
                <SubscribeExpandedView detail={data} />
              ) : (
                <SubscribeCompactView detail={data} />
              )
            ) : null}
          </div>
        </div>
      </SubscribeCard>
    </main>
  );
}
