"use client";

import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useCallback, useEffect } from "react";

export type WindowSize = {
  width: number;
  height: number;
};

export type WindowMode = "app" | "widget";

const WINDOW_MODE_FLAGS: Record<
  WindowMode,
  {
    alwaysOnTop: boolean;
    visibleOnAllWorkspaces: boolean;
    skipTaskbar: boolean;
  }
> = {
  app: {
    alwaysOnTop: false,
    visibleOnAllWorkspaces: false,
    skipTaskbar: false,
  },
  widget: {
    alwaysOnTop: true,
    visibleOnAllWorkspaces: true,
    skipTaskbar: true,
  },
};

function isTauriWindowRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function shouldIgnoreDrag(target: HTMLElement | null): boolean {
  if (!target) {
    return false;
  }

  return Boolean(
    target.closest(
      "a,button,input,textarea,select,option,label,[role='button'],[data-no-drag]",
    ),
  );
}

export function useWindowDragStart() {
  return useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (shouldIgnoreDrag(target) || !isTauriWindowRuntime()) {
      return;
    }

    void getCurrentWindow()
      .startDragging()
      .catch(() => {
        // Ignore drag errors in browser runtime.
      });
  }, []);
}

export function useSyncWindowSize(size: WindowSize): void {
  useEffect(() => {
    if (!isTauriWindowRuntime()) {
      return;
    }

    const { width, height } = size;

    void getCurrentWindow()
      .setSize(new LogicalSize(width, height))
      .catch(() => {
        // Ignore runtime size restrictions.
      });
  }, [size]);
}

export function useSyncWindowMode(mode: WindowMode): void {
  useEffect(() => {
    if (!isTauriWindowRuntime()) {
      return;
    }

    const appWindow = getCurrentWindow();
    const modeFlags = WINDOW_MODE_FLAGS[mode];

    void Promise.allSettled([
      appWindow.setAlwaysOnTop(modeFlags.alwaysOnTop),
      appWindow.setVisibleOnAllWorkspaces(modeFlags.visibleOnAllWorkspaces),
      appWindow.setSkipTaskbar(modeFlags.skipTaskbar),
    ]);
  }, [mode]);
}

export function useWindowClose() {
  return useCallback(() => {
    if (!isTauriWindowRuntime()) {
      return;
    }

    void getCurrentWindow()
      .close()
      .catch(() => {
        // Ignore close errors in browser runtime.
      });
  }, []);
}
