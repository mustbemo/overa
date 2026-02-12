"use client";

import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useCallback, useEffect, useMemo, useState } from "react";

const EXPANDED_SIZE = { width: 340, height: 80 };
const COLLAPSED_SIZE = { width: 190, height: 60 };

export default function Home() {
  const [now, setNow] = useState(() => new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now),
    [now],
  );

  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(now),
    [now],
  );

  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  const handleDrag = useCallback(() => {
    if (!isTauri) {
      return;
    }

    void (async () => {
      try {
        await getCurrentWindow().startDragging();
      } catch {
        // No-op if dragging is not available.
      }
    })();
  }, [isTauri]);

  const handleToggleSize = useCallback(() => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);

    if (!isTauri) {
      return;
    }

    const size = nextCollapsed ? COLLAPSED_SIZE : EXPANDED_SIZE;
    void (async () => {
      try {
        await getCurrentWindow().setSize(
          new LogicalSize(size.width, size.height),
        );
      } catch {
        // Ignore if size change is blocked by runtime.
      }
    })();
  }, [isCollapsed, isTauri]);

  const handleQuit = useCallback(() => {
    if (!isTauri) {
      return;
    }
    void getCurrentWindow().close();
  }, [isTauri]);

  return (
    <main
      data-tauri-drag-region
      className="flex h-screen w-screen items-center justify-center bg-transparent"
      onMouseDown={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("button")) {
          return;
        }
        if (event.button === 0) {
          handleDrag();
        }
      }}
    >
      <section
        data-tauri-drag-region
        className="relative flex h-full w-full cursor-grab select-none items-center justify-between overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(140deg,rgba(255,255,255,0.58),rgba(255,255,255,0.3))] px-4 text-slate-900 backdrop-blur-2xl active:cursor-grabbing"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(255,255,255,0.14)_45%,rgba(255,255,255,0.02)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] rounded-full border border-white/65"
        />

        {isCollapsed ? (
          <>
            <p
              data-tauri-drag-region
              className="relative z-10 w-full text-center text-lg font-semibold tracking-wide text-slate-900"
            >
              {time}
            </p>
            <div className="relative z-10 ml-2 flex items-center gap-1">
              <button
                type="button"
                aria-label="Maximize clock"
                onClick={handleToggleSize}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500/35 bg-white/60 text-xs text-slate-800 transition hover:bg-white/85"
              >
                □
              </button>
              <button
                type="button"
                aria-label="Quit app"
                onClick={handleQuit}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/50 bg-white/60 text-base leading-none text-rose-700 transition hover:bg-white/85"
              >
                ×
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              data-tauri-drag-region
              className="relative z-10 flex items-center gap-3"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div data-tauri-drag-region className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-700">
                  Clock
                </p>
                <p className="text-xl font-semibold leading-none tracking-wide text-slate-900">
                  {time}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <p
                data-tauri-drag-region
                className="text-xs font-medium tracking-wide text-slate-700"
              >
                {date}
              </p>
              <button
                type="button"
                aria-label="Minimize clock"
                onClick={handleToggleSize}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500/35 bg-white/60 text-sm text-slate-800 transition hover:bg-white/85"
              >
                -
              </button>
              <button
                type="button"
                aria-label="Quit app"
                onClick={handleQuit}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/50 bg-white/60 text-base leading-none text-rose-700 transition hover:bg-white/85"
              >
                ×
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
