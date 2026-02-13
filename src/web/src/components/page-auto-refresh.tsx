"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type PageAutoRefreshProps = {
  enabled: boolean;
  intervalMs?: number;
};

export function PageAutoRefresh({
  enabled,
  intervalMs = 30_000,
}: PageAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, router]);

  return null;
}
