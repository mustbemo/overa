import type { MatchStatusType } from "@/lib/types";
import type { MatchStatusContext } from "./internal-types";

function normalizeStatus(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function isGenericStatus(status: string): boolean {
  return !status || status === "-" || /status unavailable/i.test(status);
}

function statusPriority(status: string): number {
  const normalized = status.toLowerCase();

  if (!normalized || normalized === "-") {
    return -1;
  }

  let score = normalized.length;

  if (/super over|bowl out|eliminator/.test(normalized)) {
    score += 120;
  }

  if (
    /(won by|won|beats|beat|defeat|defeated|match over|result|by\s+\d+\s+runs|by\s+\d+\s+wickets)/.test(
      normalized,
    )
  ) {
    score += 60;
  }

  if (/(match tied|tied|tie)/.test(normalized)) {
    score += 8;
  }

  if (/(stumps|day\s*\d|innings|need|trail|lead|lunch|tea)/.test(normalized)) {
    score += 20;
  }

  return score;
}

export function pickBestStatus(
  ...candidates: Array<string | null | undefined>
): string {
  const unique = new Map<string, string>();

  for (const value of candidates) {
    const normalized = normalizeStatus(value);
    if (!normalized) {
      continue;
    }

    unique.set(normalized.toLowerCase(), normalized);
  }

  let best = "";
  let bestScore = -1;

  for (const status of unique.values()) {
    const score = statusPriority(status);
    if (score > bestScore) {
      best = status;
      bestScore = score;
    }
  }

  return best || "-";
}

export function hasUsableStatus(status: string): boolean {
  return !isGenericStatus(normalizeStatus(status));
}

export function deriveStatusType(context: MatchStatusContext): MatchStatusType {
  const text =
    `${context.status} ${context.state} ${context.title}`.toLowerCase();

  if (
    /(won|drawn|tied|abandoned|abandon|no result|match over|complete|completed)/.test(
      text,
    )
  ) {
    return "complete";
  }

  if (
    /(preview|upcoming|yet to begin|scheduled|schedule|starts at|start at)/.test(
      text,
    )
  ) {
    return "upcoming";
  }

  if (context.hasScore) {
    return "live";
  }

  if (/(stumps|day\s*\d|innings|need|trail|lead|lunch|tea|live)/.test(text)) {
    return "live";
  }

  return "upcoming";
}
