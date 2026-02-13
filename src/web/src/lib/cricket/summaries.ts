import type {
  EmbeddedMatchInfo,
  EmbeddedMatchScore,
  MatchSummary,
} from "./internal-types";
import { extractBalancedObject, parseEscapedJsonObject } from "./json-extract";
import { formatOversLabel } from "./overs";

function findNextMatchInfoIndex(source: string, fromIndex: number): number {
  const escapedIndex = source.indexOf('\\"matchInfo\\":{', fromIndex);
  const plainIndex = source.indexOf('"matchInfo":{', fromIndex);
  const candidates = [escapedIndex, plainIndex].filter((value) => value >= 0);
  return candidates.length ? Math.min(...candidates) : -1;
}

function formatTeamScore(
  teamScore?: Record<
    string,
    { runs?: number; wickets?: number; overs?: number | string }
  >,
): string | null {
  if (!teamScore) {
    return null;
  }

  const innings = Object.values(teamScore).filter(
    (entry) => entry && typeof entry === "object",
  );

  if (innings.length === 0) {
    return null;
  }

  return innings
    .map((entry) => {
      const runs = entry.runs ?? "-";
      const wickets = entry.wickets ?? "-";
      const oversLabel = formatOversLabel(entry.overs);
      return `${runs}/${wickets} (${oversLabel})`;
    })
    .join(" & ");
}

/**
 * Cricbuzz embeds multiple match payloads in page HTML. This walks those blocks
 * and builds a summary map indexed by match id.
 */
export function parseEmbeddedSummaries(
  html: string,
): Map<number, MatchSummary> {
  const summaryMap = new Map<number, MatchSummary>();
  const matchInfoTokenPattern = /(?:\\"matchInfo\\"|"matchInfo"):\{/g;
  const matchScoreTokenPattern = /(?:\\"matchScore\\"|"matchScore"):\{/;

  for (const tokenMatch of html.matchAll(matchInfoTokenPattern)) {
    const tokenIndex = tokenMatch.index;

    if (tokenIndex === undefined) {
      continue;
    }

    const infoStart = html.indexOf("{", tokenIndex);

    if (infoStart < 0) {
      continue;
    }

    const infoBalanced = extractBalancedObject(html, infoStart);

    if (!infoBalanced) {
      continue;
    }

    const parsedInfo = parseEscapedJsonObject<EmbeddedMatchInfo>(
      infoBalanced.objectText,
    );

    if (!parsedInfo?.matchId) {
      continue;
    }

    const matchId = Number(parsedInfo.matchId);

    if (!Number.isFinite(matchId)) {
      continue;
    }

    const nextInfoIndex = findNextMatchInfoIndex(html, infoBalanced.endIndex);
    const windowText = html.slice(
      infoBalanced.endIndex,
      nextInfoIndex >= 0 ? nextInfoIndex : infoBalanced.endIndex + 4_000,
    );
    const scoreTokenMatch = matchScoreTokenPattern.exec(windowText);

    let parsedScore: EmbeddedMatchScore | null = null;

    if (scoreTokenMatch) {
      const scoreStart =
        infoBalanced.endIndex +
        scoreTokenMatch.index +
        scoreTokenMatch[0].length -
        1;
      const scoreBalanced = extractBalancedObject(html, scoreStart);

      if (scoreBalanced) {
        parsedScore = parseEscapedJsonObject<EmbeddedMatchScore>(
          scoreBalanced.objectText,
        );
      }
    }

    const startDate = Number(parsedInfo.startDate ?? "");
    const venue = [
      parsedInfo.venueInfo?.ground,
      parsedInfo.venueInfo?.city,
      parsedInfo.venueInfo?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const summary: MatchSummary = {
      matchId,
      team1: parsedInfo.team1?.teamName ?? parsedInfo.team1?.teamSName ?? null,
      team2: parsedInfo.team2?.teamName ?? parsedInfo.team2?.teamSName ?? null,
      team1ShortName: parsedInfo.team1?.teamSName ?? null,
      team2ShortName: parsedInfo.team2?.teamSName ?? null,
      team1Score: formatTeamScore(parsedScore?.team1Score),
      team2Score: formatTeamScore(parsedScore?.team2Score),
      seriesName: parsedInfo.seriesName ?? null,
      matchDesc: parsedInfo.matchDesc ?? null,
      matchFormat: parsedInfo.matchFormat ?? null,
      state: parsedInfo.state ?? null,
      status: parsedInfo.status ?? null,
      venue: venue || null,
      startDate: Number.isFinite(startDate) ? startDate : null,
    };

    const existing = summaryMap.get(matchId);

    if (!existing || (!existing.team1Score && summary.team1Score)) {
      summaryMap.set(matchId, summary);
    }
  }

  return summaryMap;
}
