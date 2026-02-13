"use client";

import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useCallback, useEffect } from "react";

export type WindowSize = {
  width: number;
  height: number;
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

    void getCurrentWindow().startDragging().catch(() => {
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

export function useWindowClose() {
  return useCallback(() => {
    if (!isTauriWindowRuntime()) {
      return;
    }

    void getCurrentWindow().close().catch(() => {
      // Ignore close errors in browser runtime.
    });
  }, []);
}
