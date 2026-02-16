"use client";

import { ArrowLeft, Expand, Loader2, Power, Shrink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorState } from "@/components/cricket/error-state";
import { LoadingState } from "@/components/cricket/loading-state";
import { SubscribeCompactView } from "@/components/cricket/subscribe-compact-view";
import { SubscribeExpandedView } from "@/components/cricket/subscribe-expanded-view";
import {
  useSyncWindowSize,
  useWindowClose,
  useWindowDragStart,
} from "@/hooks/use-tauri-window";
import {
  buildMatchHref,
  getPartnership,
  getStatusType,
} from "@/lib/cricket-ui";
import { useMatchDetailQuery } from "@/lib/cricket-query";
import {
  SUBSCRIBE_COLLAPSED_WINDOW_SIZE,
  SUBSCRIBE_EXPANDED_WINDOW_SIZE,
} from "@/lib/window-presets";

function IconActionButton({
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
      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/60 text-zinc-300 transition hover:border-white/20 hover:bg-zinc-800 hover:text-white"
      data-no-drag
    >
      {children}
    </button>
  );
}

function SubscribeCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="h-full w-full rounded-[16px] border border-white/12 bg-zinc-950/92 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      {children}
    </section>
  );
}

export function SubscribePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") ?? "";

  const [expanded, setExpanded] = useState(false);

  useSyncWindowSize(
    expanded ? SUBSCRIBE_EXPANDED_WINDOW_SIZE : SUBSCRIBE_COLLAPSED_WINDOW_SIZE,
  );

  const startDrag = useWindowDragStart();
  const closeWindow = useWindowClose();

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
        <div className="flex h-full w-full flex-col overflow-hidden">
          <header
            className="flex items-center justify-between px-2 py-1.5"
            data-tauri-drag-region
          >
            <IconActionButton
              title="Back to match details"
              onClick={() => router.push(buildMatchHref("/match", matchId))}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </IconActionButton>

            <div className="flex items-center gap-1" data-no-drag>
              {isFetching ? (
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/60 text-zinc-400"
                  title="Refreshing"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                </span>
              ) : null}
              <IconActionButton
                title={expanded ? "Collapse widget" : "Expand widget"}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? (
                  <Shrink className="h-3.5 w-3.5" />
                ) : (
                  <Expand className="h-3.5 w-3.5" />
                )}
              </IconActionButton>
              <IconActionButton title="Quit application" onClick={closeWindow}>
                <Power className="h-3.5 w-3.5" />
              </IconActionButton>
            </div>
          </header>

          <div
            className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5"
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
                <SubscribeExpandedView
                  detail={data}
                  partnership={partnership}
                />
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
