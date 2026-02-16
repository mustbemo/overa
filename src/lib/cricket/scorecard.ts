import { getTeamFlagUrl } from "@/lib/team-flags";
import type {
  MatchBatter,
  MatchBowler,
  MatchDetailData,
  MatchInnings,
  TeamSnapshot,
} from "@/lib/types";
import type {
  MatchSummary,
  RawBatsman,
  RawBowler,
  RawMatchHeader,
  RawMatchInfo,
  RawScorecardInnings,
  RawWicket,
} from "./internal-types";
import {
  pickAllEscapedArraysByKey,
  pickAllEscapedObjectsByKey,
} from "./json-extract";
import { getShortName, parseTitleMeta } from "./match-links";
import {
  formatOversLabel,
  formatRunRate,
  formatStartDate,
  normalizeOversValue,
} from "./overs";
import {
  fallbackPlayersFromRawInnings,
  mergeTeamPlayers,
  toTeamPlayers,
} from "./players";
import { pickBestStatus } from "./status";
import { safeText } from "./text";

function byNumericSuffix(a: string, b: string): number {
  const numA = Number.parseInt(a.replace(/^\D+/, ""), 10);
  const numB = Number.parseInt(b.replace(/^\D+/, ""), 10);

  if (Number.isNaN(numA) || Number.isNaN(numB)) {
    return a.localeCompare(b);
  }

  return numA - numB;
}

function shouldIncludeBatter(player: RawBatsman): boolean {
  const dismissal = (player.outDesc ?? "").trim().toLowerCase();

  if (/(did not bat|dnb|yet to bat|to bat)/.test(dismissal)) {
    return false;
  }

  const runs = Number(player.runs ?? 0);
  const balls = Number(player.balls ?? 0);
  const fours = Number(player.fours ?? 0);
  const sixes = Number(player.sixes ?? 0);

  if (runs > 0 || balls > 0 || fours > 0 || sixes > 0) {
    return true;
  }

  return dismissal.length > 0;
}

function normalizeTeamKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function teamNamesLikelyMatch(
  inningsTeamName: string,
  teamName: string,
  teamShortName: string,
): boolean {
  const inningsKey = normalizeTeamKey(inningsTeamName);
  const teamKey = normalizeTeamKey(teamName);
  const shortKey = normalizeTeamKey(teamShortName);

  if (!inningsKey) {
    return false;
  }

  return (
    inningsKey === teamKey ||
    inningsKey === shortKey ||
    (teamKey.length > 3 &&
      (inningsKey.includes(teamKey) || teamKey.includes(inningsKey))) ||
    (shortKey.length > 1 &&
      (inningsKey.includes(shortKey) || shortKey.includes(inningsKey)))
  );
}

function addScoreForTeam(
  runsByTeam: Map<string, string[]>,
  teamName: string,
  score: string,
): void {
  const key = normalizeTeamKey(teamName);

  if (!key) {
    return;
  }

  const existing = runsByTeam.get(key) ?? [];
  existing.push(score);
  runsByTeam.set(key, existing);
}

function formatTeamScoresFromScorecard(
  scoreCard: RawScorecardInnings[],
): Map<string, string> {
  const runsByTeam = new Map<string, string[]>();

  for (const innings of scoreCard) {
    const teamName = safeText(innings.batTeamDetails?.batTeamName);
    const teamShortName = safeText(innings.batTeamDetails?.batTeamShortName);

    const runs = innings.scoreDetails?.runs ?? "-";
    const wickets = innings.scoreDetails?.wickets ?? "-";
    const overs = formatOversLabel(innings.scoreDetails?.overs);
    const score = `${runs}/${wickets} (${overs})`;

    if (teamName) {
      addScoreForTeam(runsByTeam, teamName, score);
    }

    if (teamShortName && teamShortName !== teamName) {
      addScoreForTeam(runsByTeam, teamShortName, score);
    }
  }

  const result = new Map<string, string>();

  for (const [teamKey, scores] of runsByTeam.entries()) {
    result.set(teamKey, scores.join(" & "));
  }

  return result;
}

function getScoreForTeam(
  teamScoreMap: Map<string, string>,
  teamName: string,
  teamShortName: string,
): string {
  const directKeys = [
    normalizeTeamKey(teamName),
    normalizeTeamKey(teamShortName),
  ].filter(Boolean);

  for (const key of directKeys) {
    const direct = teamScoreMap.get(key);

    if (direct) {
      return direct;
    }
  }

  for (const key of directKeys) {
    if (key.length < 3) {
      continue;
    }

    const fallbackEntry = Array.from(teamScoreMap.entries()).find(
      ([candidate]) =>
        candidate.includes(key) || (key.length > 4 && key.includes(candidate)),
    );

    if (fallbackEntry?.[1]) {
      return fallbackEntry[1];
    }
  }

  return "";
}

function inferYetToBatScore(
  scoreCard: RawScorecardInnings[],
  teamName: string,
  teamShortName: string,
): string {
  if (scoreCard.length !== 1) {
    return "";
  }

  const onlyInnings = scoreCard[0];
  const battingTeamName =
    safeText(onlyInnings?.batTeamDetails?.batTeamName) ||
    safeText(onlyInnings?.batTeamDetails?.batTeamShortName);

  if (!battingTeamName) {
    return "";
  }

  return teamNamesLikelyMatch(battingTeamName, teamName, teamShortName)
    ? ""
    : "Yet to bat";
}

function scorecardTeamMatchScore(
  scoreCard: RawScorecardInnings[],
  teamNames: string[],
): number {
  const targets = teamNames
    .map((team) => normalizeTeamKey(team))
    .filter((team) => team.length > 1);

  if (targets.length === 0) {
    return scoreCard.length;
  }

  let score = scoreCard.length;

  for (const innings of scoreCard) {
    const keys = [
      normalizeTeamKey(safeText(innings.batTeamDetails?.batTeamName)),
      normalizeTeamKey(safeText(innings.batTeamDetails?.batTeamShortName)),
      normalizeTeamKey(safeText(innings.bowlTeamDetails?.bowlTeamName)),
      normalizeTeamKey(safeText(innings.bowlTeamDetails?.bowlTeamShortName)),
    ].filter(Boolean);

    for (const candidate of keys) {
      for (const target of targets) {
        if (
          candidate === target ||
          (target.length > 3 && candidate.includes(target)) ||
          (candidate.length > 3 && target.includes(candidate))
        ) {
          score += 2;
          break;
        }
      }
    }
  }

  return score;
}

function pickBestScoreCard(
  scoreCardCandidates: RawScorecardInnings[][],
  teamNames: string[],
): RawScorecardInnings[] {
  if (scoreCardCandidates.length === 0) {
    return [];
  }

  let best: RawScorecardInnings[] = [];
  let bestScore = -1;

  for (const candidate of scoreCardCandidates) {
    if (candidate.length === 0) {
      continue;
    }

    const score = scorecardTeamMatchScore(candidate, teamNames);

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return bestScore >= 0 ? best : [];
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
    flagUrl: getTeamFlagUrl(name, shortName, 48),
  };
}

function toDisplayBatsmen(
  batsmenData: Record<string, RawBatsman>,
): MatchBatter[] {
  return Object.entries(batsmenData)
    .sort((a, b) => byNumericSuffix(a[0], b[0]))
    .filter(([, player]) => shouldIncludeBatter(player))
    .map(([, player]) => {
      const tags = [
        player.isCaptain ? "c" : "",
        player.isKeeper ? "wk" : "",
      ].filter(Boolean);

      const displayName = `${player.batName ?? "Unknown"}${
        tags.length ? ` (${tags.join(", ")})` : ""
      }`;

      return {
        name: displayName,
        runs: String(player.runs ?? "-"),
        balls: String(player.balls ?? "-"),
        fours: String(player.fours ?? "-"),
        sixes: String(player.sixes ?? "-"),
        strikeRate: String(player.strikeRate ?? "-"),
        dismissal: player.outDesc ?? "-",
      };
    });
}

function toDisplayBowlers(
  bowlersData: Record<string, RawBowler>,
): MatchBowler[] {
  return Object.entries(bowlersData)
    .sort((a, b) => byNumericSuffix(a[0], b[0]))
    .map(([, player]) => ({
      name: player.bowlName ?? "Unknown",
      overs: normalizeOversValue(player.overs) ?? "-",
      maidens: String(player.maidens ?? "-"),
      runs: String(player.runs ?? "-"),
      wickets: String(player.wickets ?? "-"),
      economy: String(player.economy ?? "-"),
      wides: String(player.wides ?? "-"),
      noBalls: String(player.no_balls ?? "-"),
    }));
}

function toFallOfWickets(wicketsData: Record<string, RawWicket>): string[] {
  return Object.entries(wicketsData)
    .sort((a, b) => byNumericSuffix(a[0], b[0]))
    .map(([, wicket]) => {
      const wicketNumber = wicket.wktNbr ?? "";
      const batter = wicket.batName ?? "Unknown batter";
      const score = wicket.wktRuns ?? "-";
      const over = normalizeOversValue(wicket.wktOver) ?? "-";
      return `${wicketNumber}. ${batter} - ${score} (${over})`;
    });
}

function toDisplayInnings(scoreCard: RawScorecardInnings[]): MatchInnings[] {
  return scoreCard.map((entry) => {
    const batsmenData = entry.batTeamDetails?.batsmenData ?? {};
    const bowlersData = entry.bowlTeamDetails?.bowlersData ?? {};
    const wicketsData = entry.wicketsData ?? {};

    const runs = entry.scoreDetails?.runs ?? "-";
    const wickets = entry.scoreDetails?.wickets ?? "-";
    const overs = formatOversLabel(entry.scoreDetails?.overs);
    const runRate = formatRunRate(
      entry.scoreDetails?.runs,
      entry.scoreDetails?.overs,
    );
    const scoreLine = `${runs}/${wickets} (${overs})`;

    const extras = entry.extrasData;
    const extrasLine = extras
      ? `Total ${extras.total ?? 0} (b ${extras.byes ?? 0}, lb ${
          extras.legByes ?? 0
        }, w ${extras.wides ?? 0}, nb ${extras.noBalls ?? 0}, p ${
          extras.penalty ?? 0
        })`
      : "-";

    return {
      inningsId: String(entry.inningsId ?? "-"),
      battingTeam:
        entry.batTeamDetails?.batTeamName ??
        entry.batTeamDetails?.batTeamShortName ??
        "Batting Team",
      bowlingTeam:
        entry.bowlTeamDetails?.bowlTeamName ??
        entry.bowlTeamDetails?.bowlTeamShortName ??
        "Bowling Team",
      scoreLine,
      runRate,
      extrasLine,
      batsmen: toDisplayBatsmen(batsmenData),
      bowlers: toDisplayBowlers(bowlersData),
      fallOfWickets: toFallOfWickets(wicketsData),
      yetToBat: [],
    };
  });
}

export function parseScorecardDetails(
  id: string,
  scorecardHtml: string,
  fallbackSummary: MatchSummary | null,
  fallbackTitle: string | null,
): MatchDetailData {
  const matchHeaderCandidates = pickAllEscapedObjectsByKey<RawMatchHeader>(
    scorecardHtml,
    "matchHeader",
  );
  const parsedMatchId = Number(id);
  const matchHeader =
    matchHeaderCandidates.find((entry) => {
      const matchId = Number(entry.matchId ?? "");
      return Number.isFinite(matchId) && matchId === parsedMatchId;
    }) ??
    matchHeaderCandidates.at(0) ??
    null;
  const matchInfo =
    pickAllEscapedObjectsByKey<RawMatchInfo>(
      scorecardHtml,
      "matchInfo",
    ).at(0) ?? null;
  const scoreCardCandidates = pickAllEscapedArraysByKey<RawScorecardInnings>(
    scorecardHtml,
    "scoreCard",
  );
  const expectedTeamNames = [
    safeText(matchHeader?.team1?.name),
    safeText(matchHeader?.team2?.name),
    safeText(fallbackSummary?.team1),
    safeText(fallbackSummary?.team2),
  ].filter(Boolean);
  const scoreCard = pickBestScoreCard(scoreCardCandidates, expectedTeamNames);

  const team1Name =
    safeText(matchHeader?.team1?.name) ||
    safeText(fallbackSummary?.team1) ||
    "Team 1";
  const team2Name =
    safeText(matchHeader?.team2?.name) ||
    safeText(fallbackSummary?.team2) ||
    "Team 2";

  const team1Short =
    safeText(matchHeader?.team1?.shortName) ||
    safeText(fallbackSummary?.team1ShortName) ||
    getShortName(team1Name);
  const team2Short =
    safeText(matchHeader?.team2?.shortName) ||
    safeText(fallbackSummary?.team2ShortName) ||
    getShortName(team2Name);

  const venue =
    [
      matchHeader?.venue?.name,
      matchHeader?.venue?.city,
      matchHeader?.venue?.country,
    ]
      .filter(Boolean)
      .join(", ") || safeText(fallbackSummary?.venue);

  const startDate = Number(
    matchHeader?.matchStartTimestamp ?? fallbackSummary?.startDate,
  );

  const toss =
    matchHeader?.tossResults?.tossWinnerName &&
    matchHeader?.tossResults?.decision
      ? `${matchHeader.tossResults.tossWinnerName} opted to ${matchHeader.tossResults.decision}`
      : "-";

  const teamScoreMap = formatTeamScoresFromScorecard(scoreCard);
  const scoreFromScorecardTeam1 = getScoreForTeam(
    teamScoreMap,
    team1Name,
    team1Short,
  );
  const scoreFromScorecardTeam2 = getScoreForTeam(
    teamScoreMap,
    team2Name,
    team2Short,
  );
  const fallbackTeam1Score = safeText(fallbackSummary?.team1Score);
  const fallbackTeam2Score = safeText(fallbackSummary?.team2Score);

  let team1Score =
    scoreFromScorecardTeam1 ||
    fallbackTeam1Score ||
    inferYetToBatScore(scoreCard, team1Name, team1Short);
  let team2Score =
    scoreFromScorecardTeam2 ||
    fallbackTeam2Score ||
    inferYetToBatScore(scoreCard, team2Name, team2Short);

  if (
    scoreCard.length === 1 &&
    team1Score &&
    team2Score &&
    team1Score === team2Score
  ) {
    const battingTeamName =
      safeText(scoreCard[0]?.batTeamDetails?.batTeamName) ||
      safeText(scoreCard[0]?.batTeamDetails?.batTeamShortName);

    if (teamNamesLikelyMatch(battingTeamName, team1Name, team1Short)) {
      team2Score = inferYetToBatScore(scoreCard, team2Name, team2Short);
    } else if (teamNamesLikelyMatch(battingTeamName, team2Name, team2Short)) {
      team1Score = inferYetToBatScore(scoreCard, team1Name, team1Short);
    }
  }

  team1Score = team1Score || "-";
  team2Score = team2Score || "-";

  const innings = toDisplayInnings(scoreCard);

  const titleMeta = parseTitleMeta(fallbackTitle ?? "");
  const title =
    fallbackTitle ??
    `${team1Name} vs ${team2Name}${
      matchHeader?.matchDescription ? `, ${matchHeader.matchDescription}` : ""
    }`;

  const parsedTeam1Players = toTeamPlayers(matchHeader?.team1?.playerDetails);
  const parsedTeam2Players = toTeamPlayers(matchHeader?.team2?.playerDetails);
  const matchInfoTeam1Players = toTeamPlayers(matchInfo?.team1?.playerDetails);
  const matchInfoTeam2Players = toTeamPlayers(matchInfo?.team2?.playerDetails);
  const fallbackTeam1Players = fallbackPlayersFromRawInnings(
    scoreCard,
    team1Name,
  );
  const fallbackTeam2Players = fallbackPlayersFromRawInnings(
    scoreCard,
    team2Name,
  );

  return {
    id,
    title,
    series:
      safeText(matchHeader?.seriesDesc) ||
      safeText(fallbackSummary?.seriesName) ||
      "-",
    matchDesc:
      safeText(matchHeader?.matchDescription) ||
      safeText(fallbackSummary?.matchDesc) ||
      safeText(titleMeta.matchDesc) ||
      "-",
    format:
      safeText(matchHeader?.matchFormat) ||
      safeText(fallbackSummary?.matchFormat) ||
      "-",
    venue: venue || "-",
    startTime: formatStartDate(Number.isFinite(startDate) ? startDate : null),
    status: pickBestStatus(
      matchHeader?.status,
      fallbackSummary?.status,
      titleMeta.status,
      matchHeader?.state,
      fallbackSummary?.state,
    ),
    state:
      safeText(matchHeader?.state) || safeText(fallbackSummary?.state) || "-",
    toss,
    team1: toTeamSnapshot(team1Name, team1Short, team1Score),
    team2: toTeamSnapshot(team2Name, team2Short, team2Score),
    innings,
    team1Players: mergeTeamPlayers(
      mergeTeamPlayers(parsedTeam1Players, matchInfoTeam1Players),
      fallbackTeam1Players,
    ),
    team2Players: mergeTeamPlayers(
      mergeTeamPlayers(parsedTeam2Players, matchInfoTeam2Players),
      fallbackTeam2Players,
    ),
    liveState: null,
  };
}
