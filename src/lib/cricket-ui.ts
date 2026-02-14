import type {
  MatchDetailData,
  MatchInnings,
  MatchStatusType,
  MatchesData,
} from "@/lib/types";

export type MatchTabKey = "live" | "upcoming" | "recent";

export const MATCH_TABS: Array<{ key: MatchTabKey; label: string }> = [
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "recent", label: "Finished" },
];

export function getStatusType(status: string): MatchStatusType {
  const text = status.toLowerCase();

  if (/(won|complete|drawn|tied|abandoned|no result)/.test(text)) {
    return "complete";
  }

  if (/(preview|upcoming|yet to begin|scheduled)/.test(text)) {
    return "upcoming";
  }

  return "live";
}

export function pickDefaultTab(data: MatchesData): MatchTabKey {
  if (data.live.length > 0) {
    return "live";
  }

  if (data.upcoming.length > 0) {
    return "upcoming";
  }

  return "recent";
}

export function formatUpdatedTime(timestamp: number): string {
  if (!timestamp) {
    return "--";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export function buildMatchHref(
  pathname: "/match" | "/subscribe",
  matchId: string,
): string {
  return `${pathname}?matchId=${encodeURIComponent(matchId)}`;
}

export function getActiveInnings(detail: MatchDetailData): MatchInnings | null {
  const innings = [...detail.innings].reverse().find((entry) => {
    return entry.batsmen.length > 0 || entry.bowlers.length > 0;
  });

  return innings ?? detail.innings.at(-1) ?? null;
}

function parseOversFromScoreLine(scoreLine: string): string {
  const match = scoreLine.match(/\(([^)]+)\)/);

  if (!match?.[1]) {
    return "-";
  }

  return match[1].replace(/\s*overs?/i, "").trim() || "-";
}

export function getCurrentOver(detail: MatchDetailData): string {
  if (detail.liveState?.currentOverLabel) {
    return detail.liveState.currentOverLabel;
  }

  const activeInnings = getActiveInnings(detail);
  if (!activeInnings) {
    return "-";
  }

  return parseOversFromScoreLine(activeInnings.scoreLine);
}

export function getPartnership(detail: MatchDetailData): string {
  const batters = detail.liveState?.batters ?? [];

  if (batters.length === 0) {
    return "-";
  }

  const runs = batters.reduce((sum, batter) => {
    const parsed = Number.parseInt(batter.runs, 10);
    return Number.isNaN(parsed) ? sum : sum + parsed;
  }, 0);

  const balls = batters.reduce((sum, batter) => {
    const parsed = Number.parseInt(batter.balls, 10);
    return Number.isNaN(parsed) ? sum : sum + parsed;
  }, 0);

  if (runs === 0 && balls === 0) {
    return "-";
  }

  return `${runs} runs (${balls} balls)`;
}
