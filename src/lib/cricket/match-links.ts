import { CRICBUZZ_BASE_URL } from "./constants";
import type { MatchLink, TitleMeta } from "./internal-types";
import { cleanText, slugify } from "./text";

export function extractMatchIdFromUrl(url: string): number | null {
  const match = url.match(/\/live-cricket-scores\/(\d+)\//);
  const parsed = Number(match?.[1] ?? "");
  return Number.isFinite(parsed) ? parsed : null;
}

export function toScorecardUrl(liveUrl: string): string {
  return liveUrl.replace("/live-cricket-scores/", "/live-cricket-scorecard/");
}

export function buildLiveUrl(
  matchId: number,
  team1: string,
  team2: string,
  matchDesc: string,
): string {
  const slugSource = [team1, "vs", team2, matchDesc].filter(Boolean).join(" ");
  return `${CRICBUZZ_BASE_URL}/live-cricket-scores/${matchId}/${slugify(slugSource)}`;
}

export function parseMatchLinks(html: string): MatchLink[] {
  const byUrl = new Map<string, MatchLink>();

  const addLink = (path: string, rawTitle: string): void => {
    const normalizedPath = path.trim();

    if (!normalizedPath.includes("/live-cricket-scores/")) {
      return;
    }

    const url = `${CRICBUZZ_BASE_URL}${normalizedPath}`;
    const fallbackTitle = normalizedPath
      .replace(/^\/live-cricket-scores\/\d+\//, "")
      .replace(/\/$/, "")
      .replace(/-/g, " ");
    const title = cleanText(rawTitle || fallbackTitle);

    if (!title || title.toLowerCase() === "live score") {
      return;
    }

    const existing = byUrl.get(url);
    if (!existing || title.length > existing.title.length) {
      byUrl.set(url, { title, url });
    }
  };

  const anchorPatterns = [
    /<a\b[^>]*href="(\/live-cricket-scores\/\d+\/[^"]+)"[^>]*>/g,
    /<a\b[^>]*href='(\/live-cricket-scores\/\d+\/[^']+)'[^>]*>/g,
  ];

  for (const pattern of anchorPatterns) {
    for (const match of html.matchAll(pattern)) {
      const tag = match[0] ?? "";
      const path = match[1] ?? "";
      const title =
        tag.match(/\btitle="([^"]+)"/)?.[1] ??
        tag.match(/\btitle='([^']+)'/)?.[1] ??
        "";
      addLink(path, title);
    }
  }

  const orderedPatterns = [
    /title="([^"]+)"\s+href="(\/live-cricket-scores\/\d+\/[^"]+)"/g,
    /href="(\/live-cricket-scores\/\d+\/[^"]+)"\s+title="([^"]+)"/g,
  ];

  for (const pattern of orderedPatterns) {
    for (const match of html.matchAll(pattern)) {
      if (pattern === orderedPatterns[0]) {
        addLink(match[2] ?? "", match[1] ?? "");
      } else {
        addLink(match[1] ?? "", match[2] ?? "");
      }
    }
  }

  return Array.from(byUrl.values());
}

export function parseTitleMeta(title: string): TitleMeta {
  const [beforeStatus, ...statusParts] = title.split(" - ");
  const status = statusParts.join(" - ").trim() || null;

  const [teamsText, ...descParts] = beforeStatus.split(",");
  const matchDesc = descParts.join(",").trim() || null;

  const vsMatch = teamsText.match(/^(.+?)\s+vs\s+(.+)$/i);

  if (!vsMatch) {
    return {
      team1: null,
      team2: null,
      matchDesc,
      status,
    };
  }

  return {
    team1: cleanText(vsMatch[1] ?? "") || null,
    team2: cleanText(vsMatch[2] ?? "") || null,
    matchDesc,
    status,
  };
}

export function normalizeTitle(title: string, matchDesc: string): string {
  if (!matchDesc) {
    return title;
  }

  const [teamsPart] = title.split(",");
  return `${teamsPart.trim()}, ${matchDesc}`;
}

export function getShortName(name: string): string {
  const cleaned = name.trim();

  if (!cleaned) {
    return "";
  }

  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return words
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function sortByMatchIdDesc(aId: string, bId: string): number {
  return Number(bId) - Number(aId);
}
