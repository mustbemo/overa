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
import { pickEscapedArrayByKey, pickEscapedObjectByKey } from "./json-extract";
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

function formatTeamScoresFromScorecard(
  scoreCard: RawScorecardInnings[],
): Map<string, string> {
  const runsByTeam = new Map<string, string[]>();

  for (const innings of scoreCard) {
    const teamName =
      innings.batTeamDetails?.batTeamName ??
      innings.batTeamDetails?.batTeamShortName;

    if (!teamName) {
      continue;
    }

    const runs = innings.scoreDetails?.runs ?? "-";
    const wickets = innings.scoreDetails?.wickets ?? "-";
    const overs = formatOversLabel(innings.scoreDetails?.overs);
    const score = `${runs}/${wickets} (${overs})`;

    const existing = runsByTeam.get(teamName) ?? [];
    existing.push(score);
    runsByTeam.set(teamName, existing);
  }

  const result = new Map<string, string>();

  for (const [teamName, scores] of runsByTeam.entries()) {
    result.set(teamName.toLowerCase(), scores.join(" & "));
  }

  return result;
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
  const matchHeader = pickEscapedObjectByKey<RawMatchHeader>(
    scorecardHtml,
    "matchHeader",
  );
  const matchInfo = pickEscapedObjectByKey<RawMatchInfo>(
    scorecardHtml,
    "matchInfo",
  );
  const scoreCard =
    pickEscapedArrayByKey<RawScorecardInnings>(scorecardHtml, "scoreCard") ??
    [];

  const teamScoreMap = formatTeamScoresFromScorecard(scoreCard);

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

  const team1Score =
    safeText(fallbackSummary?.team1Score) ||
    teamScoreMap.get(team1Name.toLowerCase()) ||
    "";
  const team2Score =
    safeText(fallbackSummary?.team2Score) ||
    teamScoreMap.get(team2Name.toLowerCase()) ||
    "";

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
