"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { MatchesData, MatchListItem } from "@/lib/types";
import { MatchCard } from "./match-card";

const TABS = [
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "recent", label: "Recent" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function EmptyState({ tab }: { tab: TabKey }) {
  const messages = {
    live: "No live matches right now",
    upcoming: "No upcoming matches found",
    recent: "No recent matches found",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
      <svg
        className="mb-3 h-12 w-12"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <title>No matches</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm">{messages[tab]}</p>
    </div>
  );
}

function getDefaultTab(data: MatchesData): TabKey {
  if (data.live.length > 0) return "live";
  if (data.upcoming.length > 0) return "upcoming";
  return "recent";
}

export function MatchesView({ data }: { data: MatchesData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>(() => getDefaultTab(data));
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(false);
    setActiveTab((current) => {
      if (data[current].length > 0) {
        return current;
      }
      return getDefaultTab(data);
    });
  }, [data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      router.refresh();
    }, 30_000);

    return () => clearInterval(interval);
  }, [router]);

  const matches: MatchListItem[] = data[activeTab];
  const counts = useMemo(
    () => ({
      live: data.live.length,
      upcoming: data.upcoming.length,
      recent: data.recent.length,
    }),
    [data],
  );

  return (
    <div>
      <nav className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800/50">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {label}
            {counts[key] > 0 ? (
              <span
                className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  activeTab === key
                    ? key === "live"
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {counts[key]}
              </span>
            ) : null}
            {key === "live" && counts.live > 0 && activeTab === key ? (
              <span className="absolute -right-1 top-1/2 -translate-y-1/2">
                <span className="live-track" aria-hidden="true">
                  <span className="live-track__runner" />
                </span>
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {isRefreshing ? (
        <div className="mb-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-green-500" />
          Refreshing...
        </div>
      ) : null}

      {matches.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>Data sourced from Cricbuzz. Auto-refreshes every 30s.</p>
      </footer>
    </div>
  );
}
