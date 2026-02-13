"use client";

import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { Maximize2, Minimize2, Power } from "lucide-react";
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
        className="group relative isolate flex h-full w-full cursor-grab select-none overflow-hidden rounded-2xl border border-white/20 bg-black/45 text-white backdrop-blur-md active:cursor-grabbing"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] rounded-2xl border border-white/10"
        />
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-2">
          <p
            data-tauri-drag-region
            className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70"
          >
            Clock Widget
          </p>
          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
            <button
              type="button"
              aria-label={isCollapsed ? "Expand clock" : "Collapse clock"}
              onClick={handleToggleSize}
              className="flex h-4 w-4 items-center justify-center rounded-none border-0 bg-transparent p-0 text-white/70 transition hover:text-white"
            >
              {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button
              type="button"
              aria-label="Quit app"
              onClick={handleQuit}
              className="flex h-4 w-4 items-center justify-center rounded-none border-0 bg-transparent p-0 text-white/70 transition hover:text-white"
            >
              <Power size={12} />
            </button>
          </div>
        </div>

        {isCollapsed ? (
          <p
            data-tauri-drag-region
            className="relative z-10 flex h-full w-full items-center justify-center px-4 pt-3 text-lg font-semibold tracking-wide text-white"
          >
            {time}
          </p>
        ) : (
          <div
            data-tauri-drag-region
            className="relative z-10 flex h-full w-full items-end justify-between px-4 pb-3 pt-6"
          >
            <div data-tauri-drag-region>
              <p className="text-[29px] font-semibold leading-none tracking-wide text-white">
                {time}
              </p>
            </div>
            <p
              data-tauri-drag-region
              className="pb-1 text-xs font-medium tracking-wide text-white/75"
            >
              {date}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
