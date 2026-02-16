import { getTeamFlagUrl } from "@/lib/team-flags";
import type {
  MatchDetailData,
  MatchesData,
  MatchInnings,
  MatchListItem,
  MatchLiveState,
  TeamPlayer,
  TeamSnapshot,
} from "@/lib/types";
import { CRICBUZZ_BASE_URL, LIVE_URL, UPCOMING_URL } from "./constants";
import { fetchHtml, fetchJson } from "./http";
import type { MatchLink, MatchSummary } from "./internal-types";
import {
  parseLiveStateFromCommentaryPayload,
  parseLiveStateFromHtml,
  pickPreferredLiveState,
} from "./live-state";
import {
  buildLiveUrl,
  extractMatchIdFromUrl,
  getShortName,
  normalizeTitle,
  parseMatchLinks,
  parseTitleMeta,
  toScorecardUrl,
} from "./match-links";
import {
  extractTeamPlayersFromCommentaryPayload,
  mergeTeamPlayers,
} from "./players";
import { parseScorecardDetails } from "./scorecard";
import { deriveStatusType, hasUsableStatus, pickBestStatus } from "./status";
import { parseEmbeddedSummaries } from "./summaries";
import { safeText } from "./text";

function normalizePlayerKey(value: string): string {
  return value
    .replace(/\s*\((?:c|wk|c,\s*wk|wk,\s*c)\)\s*$/gi, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeTeamKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function teamNamesLikelyMatch(a: string, b: string): boolean {
  const keyA = normalizeTeamKey(a);
  const keyB = normalizeTeamKey(b);

  if (!keyA || !keyB) {
    return false;
  }

  return keyA === keyB || keyA.includes(keyB) || keyB.includes(keyA);
}

function battingSquadForInnings(
  innings: MatchInnings,
  team1Name: string,
  team2Name: string,
  team1Players: TeamPlayer[],
  team2Players: TeamPlayer[],
): TeamPlayer[] {
  if (teamNamesLikelyMatch(innings.battingTeam, team1Name)) {
    return team1Players;
  }

  if (teamNamesLikelyMatch(innings.battingTeam, team2Name)) {
    return team2Players;
  }

  return [];
}

function addYetToBat(
  innings: MatchInnings[],
  team1Name: string,
  team2Name: string,
  team1Players: TeamPlayer[],
  team2Players: TeamPlayer[],
): MatchInnings[] {
  return innings.map((entry) => {
    const squad = battingSquadForInnings(
      entry,
      team1Name,
      team2Name,
      team1Players,
      team2Players,
    );

    if (squad.length === 0) {
      return entry;
    }

    const batted = new Set(
      entry.batsmen.map((batter) => normalizePlayerKey(batter.name)),
    );
    const seenYetToBat = new Set<string>();
    const yetToBat: string[] = [];

    for (const player of squad) {
      if (player.substitute) {
        continue;
      }

      const key = normalizePlayerKey(player.name);

      if (!key || batted.has(key) || seenYetToBat.has(key)) {
        continue;
      }

      seenYetToBat.add(key);
      yetToBat.push(player.name);
    }

    return {
      ...entry,
      yetToBat,
    };
  });
}

function parseOversFromScoreLine(scoreLine: string): string {
  const match = scoreLine.match(/\(([^)]+)\)/);

  if (!match?.[1]) {
    return "-";
  }

  return match[1].replace(/\s*overs?/i, "").trim() || "-";
}

function deriveLiveStateFromInnings(
  innings: MatchInnings[],
): MatchLiveState | null {
  const activeInnings = [...innings]
    .reverse()
    .find((entry) => entry.batsmen.length > 0 || entry.bowlers.length > 0);

  if (!activeInnings) {
    return null;
  }

  const likelyActiveBatters = activeInnings.batsmen.filter((batter) =>
    /(not out|batting|retired hurt)/i.test(batter.dismissal),
  );
  const battersSource =
    likelyActiveBatters.length > 0
      ? likelyActiveBatters.slice(0, 2)
      : activeInnings.batsmen.slice(0, 2);

  const batters = battersSource.map((batter, index) => ({
    id: `${normalizePlayerKey(batter.name)}-${index + 1}`,
    name: batter.name,
    runs: batter.runs,
    balls: batter.balls,
    fours: batter.fours,
    sixes: batter.sixes,
    strikeRate: batter.strikeRate,
    onStrike: index === 0,
  }));

  const bowlingState = activeInnings.bowlers.map((bowlerSource, index) => ({
    id: `${normalizePlayerKey(bowlerSource.name)}-${index + 1}`,
    name: bowlerSource.name,
    overs: bowlerSource.overs,
    maidens: bowlerSource.maidens,
    runs: bowlerSource.runs,
    wickets: bowlerSource.wickets,
    economy: bowlerSource.economy,
  }));
  const bowler = bowlingState[0] ?? null;
  const previousBowlers = bowlingState.slice(1);

  if (batters.length === 0 && !bowler) {
    return null;
  }

  const currentOverBalls: MatchLiveState["currentOverBalls"] = [];

  return {
    batters,
    bowler,
    previousBowlers,
    currentOverBalls,
    recentBalls: currentOverBalls,
    recentBallsLabel: "Current over",
    currentOverLabel: parseOversFromScoreLine(activeInnings.scoreLine),
    currentRunRate: activeInnings.runRate || "-",
    requiredRunRate: "-",
  };
}

function toTeamSnapshot(
  name: string,
  shortName: string,
  score: string,
): TeamSnapshot {
  return {
    name,
    shortName,
    score,
    flagUrl: getTeamFlagUrl(name, shortName, 40),
  };
}

function buildMatchItem(
  link: MatchLink,
  summary: MatchSummary | null,
): MatchListItem | null {
  const id = extractMatchIdFromUrl(link.url);

  if (!id) {
    return null;
  }

  const titleMeta = parseTitleMeta(link.title);

  const team1 = safeText(summary?.team1) || safeText(titleMeta.team1);
  const team2 = safeText(summary?.team2) || safeText(titleMeta.team2);
  const team1Short = safeText(summary?.team1ShortName) || getShortName(team1);
  const team2Short = safeText(summary?.team2ShortName) || getShortName(team2);

  const team1Score = safeText(summary?.team1Score);
  const team2Score = safeText(summary?.team2Score);

  const status = pickBestStatus(
    summary?.status,
    titleMeta.status,
    summary?.state,
  );
  const state = safeText(summary?.state);
  const matchDesc =
    safeText(summary?.matchDesc) || safeText(titleMeta.matchDesc);
  const series = safeText(summary?.seriesName);
  const venue = safeText(summary?.venue);

  const statusType = deriveStatusType({
    status,
    state,
    title: link.title,
    hasScore: Boolean(team1Score || team2Score),
  });

  return {
    id: String(id),
    title: normalizeTitle(link.title, matchDesc),
    matchDesc,
    series,
    venue,
    team1: toTeamSnapshot(team1 || "Team 1", team1Short, team1Score),
    team2: toTeamSnapshot(team2 || "Team 2", team2Short, team2Score),
    status,
    state,
    statusType,
    matchUrl: link.url,
  };
}

function buildMatchItemFromSummary(summary: MatchSummary): MatchListItem {
  const team1 = safeText(summary.team1) || "Team 1";
  const team2 = safeText(summary.team2) || "Team 2";
  const team1Short = safeText(summary.team1ShortName) || getShortName(team1);
  const team2Short = safeText(summary.team2ShortName) || getShortName(team2);
  const matchDesc = safeText(summary.matchDesc);
  const status = pickBestStatus(summary.status, summary.state);
  const title = `${team1} vs ${team2}${matchDesc ? `, ${matchDesc}` : ""}`;
  const team1Score = safeText(summary.team1Score);
  const team2Score = safeText(summary.team2Score);

  return {
    id: String(summary.matchId),
    title,
    matchDesc,
    series: safeText(summary.seriesName),
    venue: safeText(summary.venue),
    team1: toTeamSnapshot(team1, team1Short, team1Score),
    team2: toTeamSnapshot(team2, team2Short, team2Score),
    status,
    state: safeText(summary.state),
    statusType: deriveStatusType({
      status,
      state: safeText(summary.state),
      title,
      hasScore: Boolean(team1Score || team2Score),
    }),
    matchUrl: buildLiveUrl(summary.matchId, team1, team2, matchDesc),
  };
}

function countFilledFields(item: MatchListItem): number {
  const fields = [
    item.matchDesc,
    item.series,
    item.venue,
    item.team1.name,
    item.team2.name,
    item.team1.score,
    item.team2.score,
    item.status,
    item.state,
  ];

  return fields.filter((value) => value.trim().length > 0).length;
}

function isLiveLike(item: MatchListItem): boolean {
  return (
    item.statusType === "live" || Boolean(item.team1.score || item.team2.score)
  );
}

function pickBetterMatch(
  current: MatchListItem,
  incoming: MatchListItem,
): MatchListItem {
  if (isLiveLike(incoming) && !isLiveLike(current)) {
    return incoming;
  }

  if (!isLiveLike(incoming) && isLiveLike(current)) {
    return current;
  }

  return countFilledFields(incoming) > countFilledFields(current)
    ? incoming
    : current;
}

function upsertMatch(
  map: Map<string, MatchListItem>,
  item: MatchListItem,
): void {
  const existing = map.get(item.id);

  if (!existing) {
    map.set(item.id, item);
    return;
  }

  map.set(item.id, pickBetterMatch(existing, item));
}

function sortByMatchIdDesc(a: MatchListItem, b: MatchListItem): number {
  return Number(b.id) - Number(a.id);
}

export async function getMatchesData(): Promise<MatchesData> {
  const [liveResult, upcomingResult] = await Promise.allSettled([
    fetchHtml(LIVE_URL),
    fetchHtml(UPCOMING_URL),
  ]);

  if (
    liveResult.status === "rejected" &&
    upcomingResult.status === "rejected"
  ) {
    const liveReason =
      liveResult.reason instanceof Error
        ? liveResult.reason.message
        : String(liveResult.reason);
    const upcomingReason =
      upcomingResult.reason instanceof Error
        ? upcomingResult.reason.message
        : String(upcomingResult.reason);

    throw new Error(
      `Unable to fetch Cricbuzz match data right now. Live error: ${liveReason}. Upcoming error: ${upcomingReason}.`,
    );
  }

  const liveHtml = liveResult.status === "fulfilled" ? liveResult.value : "";
  const upcomingHtml =
    upcomingResult.status === "fulfilled" ? upcomingResult.value : "";

  const allLinks = [
    ...(liveHtml ? parseMatchLinks(liveHtml) : []),
    ...(upcomingHtml ? parseMatchLinks(upcomingHtml) : []),
  ];

  const liveSummaryMap = liveHtml
    ? parseEmbeddedSummaries(liveHtml)
    : new Map();
  const upcomingSummaryMap = upcomingHtml
    ? parseEmbeddedSummaries(upcomingHtml)
    : new Map();

  const allMatches = new Map<string, MatchListItem>();

  for (const link of allLinks) {
    const id = extractMatchIdFromUrl(link.url);

    if (!id) {
      continue;
    }

    const summary =
      liveSummaryMap.get(id) ?? upcomingSummaryMap.get(id) ?? null;
    const item = buildMatchItem(link, summary);

    if (!item) {
      continue;
    }

    upsertMatch(allMatches, item);
  }

  for (const summary of liveSummaryMap.values()) {
    upsertMatch(allMatches, buildMatchItemFromSummary(summary));
  }

  for (const summary of upcomingSummaryMap.values()) {
    upsertMatch(allMatches, buildMatchItemFromSummary(summary));
  }

  const all = Array.from(allMatches.values())
    .filter((item) => hasUsableStatus(item.status))
    .sort(sortByMatchIdDesc);

  return {
    live: all.filter((item) => item.statusType === "live"),
    upcoming: all.filter((item) => item.statusType === "upcoming"),
    recent: all.filter((item) => item.statusType === "complete"),
  };
}

export async function getMatchDetail(
  matchId: string,
): Promise<MatchDetailData> {
  const id = Number(matchId);

  if (!Number.isFinite(id)) {
    throw new Error("Invalid match id.");
  }

  const [liveResult, upcomingResult] = await Promise.allSettled([
    fetchHtml(LIVE_URL),
    fetchHtml(UPCOMING_URL),
  ]);

  const liveHtml = liveResult.status === "fulfilled" ? liveResult.value : "";
  const upcomingHtml =
    upcomingResult.status === "fulfilled" ? upcomingResult.value : "";

  const liveLinks = liveHtml ? parseMatchLinks(liveHtml) : [];
  const upcomingLinks = upcomingHtml ? parseMatchLinks(upcomingHtml) : [];
  const matchLink = [...liveLinks, ...upcomingLinks].find(
    (link) => extractMatchIdFromUrl(link.url) === id,
  );

  const liveSummaryMap = liveHtml
    ? parseEmbeddedSummaries(liveHtml)
    : new Map();
  const upcomingSummaryMap = upcomingHtml
    ? parseEmbeddedSummaries(upcomingHtml)
    : new Map();
  const fallbackSummary =
    liveSummaryMap.get(id) ?? upcomingSummaryMap.get(id) ?? null;

  const syntheticMatchLink: MatchLink | null = fallbackSummary
    ? {
        title: buildMatchItemFromSummary(fallbackSummary).title,
        url: buildLiveUrl(
          fallbackSummary.matchId,
          fallbackSummary.team1 ?? "team-1",
          fallbackSummary.team2 ?? "team-2",
          fallbackSummary.matchDesc ?? "",
        ),
      }
    : null;

  const scorecardCandidates = [
    ...(matchLink ? [toScorecardUrl(matchLink.url)] : []),
    ...(syntheticMatchLink ? [toScorecardUrl(syntheticMatchLink.url)] : []),
    `${CRICBUZZ_BASE_URL}/live-cricket-scorecard/${id}`,
  ];

  let scorecardHtml: string | null = null;
  let lastError: Error | null = null;

  for (const url of scorecardCandidates) {
    try {
      scorecardHtml = await fetchHtml(url);
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Fetch failed");
    }
  }

  if (!scorecardHtml) {
    throw lastError ?? new Error("Could not fetch scorecard details.");
  }

  const detail = parseScorecardDetails(
    String(id),
    scorecardHtml,
    fallbackSummary,
    matchLink?.title ?? syntheticMatchLink?.title ?? null,
  );

  let liveState = parseLiveStateFromHtml(scorecardHtml);
  let team1Players = detail.team1Players;
  let team2Players = detail.team2Players;

  const livePageCandidates = [
    ...(matchLink ? [matchLink.url] : []),
    ...(syntheticMatchLink ? [syntheticMatchLink.url] : []),
    `${CRICBUZZ_BASE_URL}/live-cricket-scores/${id}`,
  ];

  for (const url of livePageCandidates) {
    try {
      const livePageHtml = await fetchHtml(url);
      liveState = pickPreferredLiveState(
        liveState,
        parseLiveStateFromHtml(livePageHtml),
      );
      break;
    } catch {
      // Try the next candidate URL.
    }
  }

  const isLiveMatch =
    deriveStatusType({
      status: detail.status,
      state: detail.state,
      title: detail.title,
      hasScore: Boolean(detail.team1.score || detail.team2.score),
    }) === "live";

  const commentaryResponses = await Promise.allSettled([
    fetchJson<unknown>(`${CRICBUZZ_BASE_URL}/match-api/${id}/commentary.json`),
    fetchJson<unknown>(
      `${CRICBUZZ_BASE_URL}/match-api/${id}/commentary-full.json`,
    ),
  ]);

  for (const response of commentaryResponses) {
    if (response.status !== "fulfilled") {
      continue;
    }

    if (isLiveMatch) {
      liveState = pickPreferredLiveState(
        liveState,
        parseLiveStateFromCommentaryPayload(response.value),
      );
    }

    const extracted = extractTeamPlayersFromCommentaryPayload(response.value);
    team1Players = mergeTeamPlayers(team1Players, extracted.team1Players);
    team2Players = mergeTeamPlayers(team2Players, extracted.team2Players);
  }

  if (isLiveMatch) {
    liveState = pickPreferredLiveState(
      liveState,
      deriveLiveStateFromInnings(detail.innings),
    );
  }

  const innings = addYetToBat(
    detail.innings,
    detail.team1.name,
    detail.team2.name,
    team1Players,
    team2Players,
  );

  return {
    ...detail,
    innings,
    team1Players,
    team2Players,
    liveState,
  };
}
