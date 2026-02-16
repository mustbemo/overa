import type { MatchWinPrediction, TeamSnapshot } from "@/lib/types";
import { cleanText } from "./text";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePercent(value: string): string | null {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  const rounded = Number.isInteger(parsed)
    ? String(parsed)
    : parsed.toFixed(1).replace(/\.0$/, "");

  return `${rounded}%`;
}

function readPercentNearLabel(text: string, label: string): string | null {
  if (!label) {
    return null;
  }

  const escapedLabel = escapeRegex(label);
  const patterns = [
    new RegExp(`${escapedLabel}[^\\d%]{0,24}(\\d{1,3}(?:\\.\\d+)?)\\s*%`, "i"),
    new RegExp(`(\\d{1,3}(?:\\.\\d+)?)\\s*%[^a-z0-9]{0,24}${escapedLabel}`, "i"),
  ];

  for (const pattern of patterns) {
    const matched = text.match(pattern)?.[1];

    if (!matched) {
      continue;
    }

    const percent = normalizePercent(matched);

    if (percent) {
      return percent;
    }
  }

  return null;
}

function readPercentByTeam(
  text: string,
  team: TeamSnapshot,
): string | null {
  const candidates = [team.shortName, team.name]
    .map((value) => cleanText(value))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    const found = readPercentNearLabel(text, candidate);

    if (found) {
      return found;
    }
  }

  return null;
}

function extractTwoPercentsFromSnippet(snippet: string): string[] {
  const values = [...snippet.matchAll(/(\d{1,3}(?:\.\d+)?)\s*%/g)]
    .map((entry) => normalizePercent(entry[1] ?? ""))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(values)).slice(0, 2);
}

function isLikelyPair(team1: string, team2: string): boolean {
  const first = Number.parseFloat(team1.replace("%", ""));
  const second = Number.parseFloat(team2.replace("%", ""));
  const sum = first + second;

  return sum >= 90 && sum <= 110;
}

export function parseWinPredictionFromHtml(
  html: string,
  team1: TeamSnapshot,
  team2: TeamSnapshot,
): MatchWinPrediction | null {
  const plainText = cleanText(html.replace(/<[^>]+>/g, " "));

  if (!plainText) {
    return null;
  }

  const team1Percent = readPercentByTeam(plainText, team1);
  const team2Percent = readPercentByTeam(plainText, team2);

  if (team1Percent && team2Percent && isLikelyPair(team1Percent, team2Percent)) {
    return {
      team1Percent,
      team2Percent,
    };
  }

  const contextMatches = plainText.match(
    /(win[^.]{0,160}prediction[^.]{0,160}|win[^.]{0,160}probability[^.]{0,160}|prediction[^.]{0,120}win[^.]{0,120})/gi,
  );

  if (!contextMatches) {
    return null;
  }

  for (const snippet of contextMatches) {
    const [first, second] = extractTwoPercentsFromSnippet(snippet);

    if (first && second && isLikelyPair(first, second)) {
      return {
        team1Percent: first,
        team2Percent: second,
      };
    }
  }

  return null;
}
