import type {
  LiveBatter,
  LiveBowler,
  LiveOverBall,
  MatchLiveState,
} from "@/lib/types";
import type {
  RawCommentaryBall,
  RawCommentaryPayload,
  RawLiveBatter,
  RawLiveBowler,
  RawLiveScoreCandidate,
} from "./internal-types";
import { pickEscapedArrayByKey, pickEscapedObjectByKey } from "./json-extract";
import { normalizeOversValue } from "./overs";

type UnknownRecord = Record<string, unknown>;
type BallKind = LiveOverBall["kind"];

type BallOutcome = {
  value: string;
  kind: BallKind;
  isLegalDelivery: boolean;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function toTrimmedString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const text = toTrimmedString(value);
    if (text) {
      return text;
    }
  }

  return "";
}

function toStatText(...values: unknown[]): string {
  return firstNonEmpty(...values) || "-";
}

function fallbackIdFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeBallToken(token: string): string {
  return token.replace(/^[^a-z0-9]+|[^a-z0-9+.-]+$/gi, "").trim();
}

function classifyBallToken(rawToken: string): BallOutcome {
  const normalizedToken = normalizeBallToken(rawToken);
  const token = normalizedToken.toLowerCase();

  if (!token) {
    return { value: "-", kind: "other", isLegalDelivery: true };
  }

  const runMatch = token.match(/\d+/);
  const runValue = runMatch?.[0] ?? "";

  if (/wide|\bwd\b/.test(token)) {
    return {
      value: runValue ? `Wd+${runValue}` : "Wd",
      kind: "extra",
      isLegalDelivery: false,
    };
  }

  if (/no[\s-]*ball|\bnb\b/.test(token)) {
    return {
      value: runValue ? `Nb+${runValue}` : "Nb",
      kind: "extra",
      isLegalDelivery: false,
    };
  }

  if (token === "w" || /wicket|out/.test(token)) {
    return {
      value: "W",
      kind: "wicket",
      isLegalDelivery: true,
    };
  }

  if (token === "4" || /four|boundary/.test(token)) {
    return {
      value: "4",
      kind: "four",
      isLegalDelivery: true,
    };
  }

  if (token === "6" || /six/.test(token)) {
    return {
      value: "6",
      kind: "six",
      isLegalDelivery: true,
    };
  }

  if (token === "." || token === "0" || /dot/.test(token)) {
    return {
      value: "0",
      kind: "dot",
      isLegalDelivery: true,
    };
  }

  if (/leg[\s-]*bye|\blb\b/.test(token)) {
    return {
      value: runValue ? `Lb${runValue}` : "Lb",
      kind: "run",
      isLegalDelivery: true,
    };
  }

  if (/\bbye\b/.test(token)) {
    return {
      value: runValue ? `B${runValue}` : "B",
      kind: "run",
      isLegalDelivery: true,
    };
  }

  if (/^\d+$/.test(token)) {
    return {
      value: token,
      kind: token === "0" ? "dot" : "run",
      isLegalDelivery: true,
    };
  }

  return {
    value: normalizedToken || rawToken,
    kind: "other",
    isLegalDelivery: true,
  };
}

function parseOverTokensFromString(
  value: string,
  limit = 8,
  includeAllSegments = false,
): string[] {
  const text = value.replace(/\s+/g, " ").trim();

  if (!text) {
    return [];
  }

  const segments = text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const sourceSegments = includeAllSegments
    ? segments
    : [segments.at(-1) ?? text];
  const tokens: string[] = [];

  for (const segment of sourceSegments) {
    const afterLabel = segment.includes(":")
      ? (segment.split(":").at(-1) ?? segment).trim()
      : segment;

    tokens.push(
      ...afterLabel
        .split(/\s+/)
        .map((part) => normalizeBallToken(part))
        .filter(Boolean)
        .filter((part) => !/^(ov|over)$/i.test(part)),
    );
  }

  return tokens.slice(-limit);
}

function parseOverTokensFromArray(values: unknown[], limit = 8): string[] {
  return values
    .map((entry) => {
      if (typeof entry === "string" || typeof entry === "number") {
        return normalizeBallToken(String(entry));
      }

      if (!isRecord(entry)) {
        return "";
      }

      return normalizeBallToken(
        firstNonEmpty(
          entry.value,
          entry.result,
          entry.ballResult,
          entry.event,
          entry.eventType,
          entry.runs,
          entry.runsScored,
        ),
      );
    })
    .filter(Boolean)
    .slice(-limit);
}

function parseOverContext(oversRaw: string): {
  overNumber: number | null;
  completedBalls: number;
} {
  const match = oversRaw.match(/^(\d+)(?:\.(\d+))?$/);

  if (!match) {
    return { overNumber: null, completedBalls: 0 };
  }

  const baseOvers = Number.parseInt(match[1] ?? "", 10);
  const ballsRaw = Number.parseInt(match[2] ?? "0", 10);

  if (!Number.isFinite(baseOvers) || !Number.isFinite(ballsRaw)) {
    return { overNumber: null, completedBalls: 0 };
  }

  const carry = Math.floor(ballsRaw / 6);
  const completedBalls = ballsRaw % 6;
  const overNumber = baseOvers + carry + (completedBalls > 0 ? 1 : 0);

  return { overNumber, completedBalls };
}

function toLabeledBalls(
  overNumber: number,
  completedLegalBalls: number,
  outcomes: BallOutcome[],
): LiveOverBall[] {
  const legalDeliveries = outcomes.filter(
    (item) => item.isLegalDelivery,
  ).length;

  let startBall = 1;

  if (completedLegalBalls > 0 && legalDeliveries > 0) {
    startBall = Math.max(1, completedLegalBalls - legalDeliveries + 1);
  }

  let currentLegalBall = startBall;

  return outcomes.map((outcome) => {
    const ballInOver = Math.min(Math.max(currentLegalBall, 1), 6);
    const labeled: LiveOverBall = {
      label: `${overNumber}.${ballInOver}`,
      value: outcome.value,
      kind: outcome.kind,
    };

    if (outcome.isLegalDelivery) {
      currentLegalBall += 1;
    }

    return labeled;
  });
}

function toCurrentOverBalls(
  tokens: string[],
  oversRaw: string,
): LiveOverBall[] {
  if (tokens.length === 0) {
    return [];
  }

  const { overNumber, completedBalls } = parseOverContext(oversRaw);
  const outcomes = tokens.map((token) => classifyBallToken(token));

  if (!overNumber || tokens.length > 10) {
    return outcomes.map((outcome, index) => ({
      label: `Ball ${index + 1}`,
      value: outcome.value,
      kind: outcome.kind,
    }));
  }

  return toLabeledBalls(overNumber, completedBalls, outcomes);
}

function toLiveBatter(
  batterValue: RawLiveBatter | null,
  defaultStrike: boolean,
): LiveBatter | null {
  if (!batterValue) {
    return null;
  }

  const name = firstNonEmpty(batterValue.batName, batterValue.name);

  if (!name) {
    return null;
  }

  const id = firstNonEmpty(batterValue.id, batterValue.batId) || name;

  return {
    id: id || fallbackIdFromName(name),
    name,
    runs: toStatText(batterValue.runs, batterValue.batRuns),
    balls: toStatText(batterValue.balls, batterValue.batBalls),
    fours: toStatText(batterValue.fours, batterValue.batFours),
    sixes: toStatText(batterValue.sixes, batterValue.batSixes),
    strikeRate: toStatText(batterValue.strikeRate, batterValue.batStrikeRate),
    onStrike: Boolean(
      batterValue.isOnStrike ?? batterValue.isStriker ?? defaultStrike,
    ),
  };
}

function toLiveBatters(candidate: RawLiveScoreCandidate): LiveBatter[] {
  const result: LiveBatter[] = [];
  const seen = new Set<string>();

  const addOne = (player: LiveBatter | null): void => {
    if (!player) {
      return;
    }

    const key = player.name.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(player);
  };

  addOne(toLiveBatter(candidate.batsmanStriker ?? null, true));
  addOne(toLiveBatter(candidate.batsmanNonStriker ?? null, false));
  addOne(toLiveBatter(candidate.striker ?? null, true));
  addOne(toLiveBatter(candidate.nonStriker ?? null, false));
  addOne(toLiveBatter(candidate.batsman1 ?? null, result.length === 0));
  addOne(toLiveBatter(candidate.batsman2 ?? null, result.length === 1));
  addOne(toLiveBatter(candidate.currentBatter ?? null, result.length === 0));

  if (Array.isArray(candidate.currentBatters)) {
    for (const entry of candidate.currentBatters) {
      addOne(toLiveBatter(entry, result.length === 0));
    }
  }

  if (result.length > 0) {
    return result;
  }

  const fallbackBatters = candidate.batTeam?.batsmen;
  if (!Array.isArray(fallbackBatters)) {
    return result;
  }

  for (const entry of fallbackBatters) {
    if (!isRecord(entry)) {
      continue;
    }

    const raw = entry as RawLiveBatter;
    const outDesc = toTrimmedString(raw.outDesc).toLowerCase();
    const isLikelyActive =
      !outDesc || /(batting|not out|retired hurt)/.test(outDesc);
    const parsed = toLiveBatter(raw, result.length === 0);

    if (!isLikelyActive) {
      continue;
    }

    addOne(parsed);

    if (result.length === 2) {
      break;
    }
  }

  return result;
}

function toLiveBowler(bowlerValue: RawLiveBowler | null): LiveBowler | null {
  if (!bowlerValue) {
    return null;
  }

  const name = firstNonEmpty(bowlerValue.bowlName, bowlerValue.name);

  if (!name) {
    return null;
  }

  const id = firstNonEmpty(bowlerValue.id, bowlerValue.bowlId) || name;
  const oversRaw = firstNonEmpty(bowlerValue.overs, bowlerValue.bowlOvs);

  return {
    id: id || fallbackIdFromName(name),
    name,
    overs: normalizeOversValue(oversRaw) ?? (oversRaw || "-"),
    maidens: toStatText(bowlerValue.maidens, bowlerValue.bowlMaidens),
    runs: toStatText(bowlerValue.runs, bowlerValue.bowlRuns),
    wickets: toStatText(bowlerValue.wickets, bowlerValue.bowlWkts),
    economy: toStatText(bowlerValue.economy, bowlerValue.bowlEcon),
  };
}

function extractOverTokens(candidate: RawLiveScoreCandidate): string[] {
  const arraySources: Array<string | unknown[] | undefined> = [
    candidate.currentOver,
    candidate.thisOver,
    candidate.overSummary,
    candidate.overSummaryList,
    candidate.currOver,
    candidate.thisOverStats,
    candidate.recentOvsStatsArr,
  ];

  for (const source of arraySources) {
    if (Array.isArray(source)) {
      const parsed = parseOverTokensFromArray(source);
      if (parsed.length > 0) {
        return parsed;
      }
    }
  }

  const stringSources: Array<string | unknown[] | undefined> = [
    candidate.currentOver,
    candidate.thisOver,
    candidate.overSummary,
    candidate.recentOvsStats,
    candidate.currOver,
    candidate.thisOverStats,
  ];

  for (const source of stringSources) {
    if (typeof source !== "string") {
      continue;
    }

    const parsed = parseOverTokensFromString(source);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
}

function extractRecentBallTokens(candidate: RawLiveScoreCandidate): string[] {
  const arraySources: Array<unknown[] | undefined> = [
    Array.isArray(candidate.recentBalls) ? candidate.recentBalls : undefined,
    Array.isArray(candidate.latestBalls) ? candidate.latestBalls : undefined,
    Array.isArray(candidate.lastTenBalls) ? candidate.lastTenBalls : undefined,
    Array.isArray(candidate.last10Balls) ? candidate.last10Balls : undefined,
    Array.isArray(candidate.recentOvsStatsArr)
      ? candidate.recentOvsStatsArr
      : undefined,
  ];

  for (const source of arraySources) {
    if (!source) {
      continue;
    }

    const parsed = parseOverTokensFromArray(source, 10);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  const stringSources = [
    typeof candidate.recentBalls === "string" ? candidate.recentBalls : "",
    typeof candidate.latestBalls === "string" ? candidate.latestBalls : "",
    typeof candidate.lastTenBalls === "string" ? candidate.lastTenBalls : "",
    typeof candidate.last10Balls === "string" ? candidate.last10Balls : "",
    candidate.recentOvsStats,
  ].filter((value): value is string => typeof value === "string" && value !== "");

  for (const source of stringSources) {
    const parsed = parseOverTokensFromString(source, 10, true);

    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
}

function toRecentBalls(tokens: string[]): LiveOverBall[] {
  return tokens.slice(-10).map((token, index) => {
    const outcome = classifyBallToken(token);

    return {
      label: `Ball ${index + 1}`,
      value: outcome.value,
      kind: outcome.kind,
    };
  });
}

function formatRecentBallsLabel(ballsCount: number): string {
  if (ballsCount >= 10) {
    return "Last 10 balls";
  }

  if (ballsCount > 0) {
    return `Last ${ballsCount} balls`;
  }

  return "Current over";
}

function toBowlerKey(bowler: LiveBowler): string {
  return `${bowler.id}:${bowler.name.toLowerCase()}`;
}

function hasBowlerStats(bowler: LiveBowler): boolean {
  return [bowler.overs, bowler.maidens, bowler.runs, bowler.wickets].some(
    (value) => value !== "-" && value !== "",
  );
}

function toBowlingState(candidate: RawLiveScoreCandidate): {
  bowler: LiveBowler | null;
  previousBowlers: LiveBowler[];
} {
  const result: LiveBowler[] = [];
  const seen = new Set<string>();

  const addBowler = (rawBowler: RawLiveBowler | null): void => {
    const parsed = toLiveBowler(rawBowler);

    if (!parsed) {
      return;
    }

    const key = toBowlerKey(parsed);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(parsed);
  };

  addBowler(candidate.currentBowler ?? null);
  addBowler(candidate.bowlerStriker ?? null);
  addBowler(candidate.bowler ?? null);

  const additionalSources = [
    candidate.bowlTeam?.bowlers,
    candidate.bowlTeam?.previousBowlers,
  ];

  for (const source of additionalSources) {
    if (!Array.isArray(source)) {
      continue;
    }

    for (const entry of source) {
      if (!isRecord(entry)) {
        continue;
      }

      addBowler(entry as RawLiveBowler);
    }
  }

  const bowler = result[0] ?? null;
  const previousBowlers = result.slice(1).filter(hasBowlerStats);

  return {
    bowler,
    previousBowlers,
  };
}

type ParsedCommentaryBall = {
  over: number;
  rawBall: number;
  outcome: BallOutcome;
  index: number;
};

function parseIntFromUnknown(value: unknown): number | null {
  const text = toTrimmedString(value);

  if (!text) {
    return null;
  }

  const parsed = Number.parseInt(text, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOverBall(
  line: RawCommentaryBall,
): { over: number; ball: number } | null {
  const overValue = firstNonEmpty(line.overNumber, line.overNum, line.o_no);
  const ballValue = firstNonEmpty(line.ballNbr, line.ballNumber, line.ball);

  const directOver = parseIntFromUnknown(overValue);
  const directBall = parseIntFromUnknown(ballValue);

  if (directOver !== null && directBall !== null) {
    return { over: directOver, ball: directBall };
  }

  if (!overValue.includes(".")) {
    return null;
  }

  const [overPart, ballPart] = overValue.split(".", 2);
  const parsedOver = Number.parseInt(overPart ?? "", 10);
  const parsedBall = Number.parseInt(ballPart ?? "", 10);

  if (!Number.isFinite(parsedOver) || !Number.isFinite(parsedBall)) {
    return null;
  }

  return {
    over: parsedOver,
    ball: parsedBall,
  };
}

function deriveCommentaryOutcome(line: RawCommentaryBall): BallOutcome {
  const text = firstNonEmpty(
    line.eventType,
    line.event,
    line.commText,
    line.comm,
    line.commentary,
  );
  const lower = text.toLowerCase();
  const runs = parseIntFromUnknown(firstNonEmpty(line.runsScored, line.runs));

  if (/wide|\bwd\b/.test(lower)) {
    return {
      value: runs !== null ? `Wd+${runs}` : "Wd",
      kind: "extra",
      isLegalDelivery: false,
    };
  }

  if (/no[\s-]*ball|\bnb\b/.test(lower)) {
    return {
      value: runs !== null ? `Nb+${runs}` : "Nb",
      kind: "extra",
      isLegalDelivery: false,
    };
  }

  if (/wicket|out/.test(lower)) {
    return {
      value: "W",
      kind: "wicket",
      isLegalDelivery: true,
    };
  }

  if (/six/.test(lower)) {
    return {
      value: "6",
      kind: "six",
      isLegalDelivery: true,
    };
  }

  if (/four|boundary/.test(lower)) {
    return {
      value: "4",
      kind: "four",
      isLegalDelivery: true,
    };
  }

  if (runs !== null) {
    if (runs === 0) {
      return {
        value: "0",
        kind: "dot",
        isLegalDelivery: true,
      };
    }

    return {
      value: String(runs),
      kind: "run",
      isLegalDelivery: true,
    };
  }

  return classifyBallToken(text || "-");
}

function parseCommentaryBalls(lines: RawCommentaryBall[]): ParsedCommentaryBall[] {
  const parsed: ParsedCommentaryBall[] = [];

  for (const [index, line] of lines.entries()) {
    const overBall = parseOverBall(line);

    if (!overBall) {
      continue;
    }

    parsed.push({
      over: overBall.over,
      rawBall: overBall.ball,
      outcome: deriveCommentaryOutcome(line),
      index,
    });
  }

  return parsed;
}

function sortCommentaryBalls(
  left: ParsedCommentaryBall,
  right: ParsedCommentaryBall,
): number {
  if (left.over !== right.over) {
    return left.over - right.over;
  }

  if (left.rawBall !== right.rawBall) {
    return left.rawBall - right.rawBall;
  }

  return left.index - right.index;
}

function parseCommentaryList(
  payload: RawCommentaryPayload,
): RawCommentaryBall[] {
  const commentaryFromList = Array.isArray(payload.commentaryList)
    ? payload.commentaryList
    : isRecord(payload.commentaryList)
      ? Object.values(payload.commentaryList)
      : [];
  const commentaryFromCommLines = Array.isArray(payload.comm_lines)
    ? payload.comm_lines
    : [];

  const preferred =
    commentaryFromList.length >= commentaryFromCommLines.length
      ? commentaryFromList
      : commentaryFromCommLines;

  return preferred.filter((entry): entry is RawCommentaryBall =>
    isRecord(entry),
  );
}

function parseCurrentOverFromCommentary(
  balls: ParsedCommentaryBall[],
  oversRaw?: string,
): LiveOverBall[] {
  if (balls.length === 0) {
    return [];
  }

  const latestOver = Math.max(...balls.map((entry) => entry.over));
  const inOver = balls
    .filter((entry) => entry.over === latestOver)
    .sort(sortCommentaryBalls);

  if (inOver.length === 0) {
    return [];
  }

  const overContext = parseOverContext(toTrimmedString(oversRaw));
  const completedLegalBalls =
    overContext.overNumber === latestOver ? overContext.completedBalls : 0;

  return toLabeledBalls(
    latestOver,
    completedLegalBalls,
    inOver.map((entry) => entry.outcome),
  );
}

function parseRecentBallsFromCommentary(
  balls: ParsedCommentaryBall[],
): LiveOverBall[] {
  if (balls.length === 0) {
    return [];
  }

  return [...balls]
    .sort(sortCommentaryBalls)
    .slice(-10)
    .map((entry) => ({
      label: `${entry.over}.${entry.rawBall}`,
      value: entry.outcome.value,
      kind: entry.outcome.kind,
    }));
}

function hasContent(state: MatchLiveState): boolean {
  return (
    state.batters.length > 0 ||
    Boolean(state.bowler) ||
    state.previousBowlers.length > 0 ||
    state.currentOverBalls.length > 0 ||
    state.recentBalls.length > 0
  );
}

function scoreState(state: MatchLiveState): number {
  let score = 0;

  score += state.batters.length * 4;
  score += state.bowler ? 4 : 0;
  score += Math.min(state.previousBowlers.length, 4) * 2;
  score += Math.min(state.currentOverBalls.length, 8);
  score += Math.min(state.recentBalls.length, 10);
  score += state.currentRunRate !== "-" ? 1 : 0;
  score += state.requiredRunRate !== "-" ? 1 : 0;

  return score;
}

function parseCandidateState(
  candidate: RawLiveScoreCandidate,
  fallbackCurrentOverBalls: LiveOverBall[],
): MatchLiveState | null {
  const batters = toLiveBatters(candidate);
  const bowlingState = toBowlingState(candidate);
  const oversRaw = firstNonEmpty(candidate.overs);
  const overTokens = extractOverTokens(candidate);
  const recentTokens = extractRecentBallTokens(candidate);
  const currentOverBalls =
    overTokens.length > 0
      ? toCurrentOverBalls(overTokens, oversRaw || "0")
      : fallbackCurrentOverBalls;
  const recentBalls =
    recentTokens.length > 0 ? toRecentBalls(recentTokens) : currentOverBalls;
  const currentOverLabel = normalizeOversValue(oversRaw) ?? (oversRaw || "-");

  const state: MatchLiveState = {
    batters,
    bowler: bowlingState.bowler,
    previousBowlers: bowlingState.previousBowlers,
    currentOverBalls,
    recentBalls,
    recentBallsLabel:
      recentTokens.length > 0
        ? formatRecentBallsLabel(recentTokens.length)
        : "Current over",
    currentOverLabel,
    currentRunRate: toStatText(candidate.crr, candidate.currentRunRate),
    requiredRunRate: toStatText(candidate.reqRate, candidate.requiredRunRate),
  };

  return hasContent(state) ? state : null;
}

function extractCandidatesFromPayload(
  payload: RawCommentaryPayload,
): RawLiveScoreCandidate[] {
  const candidates: RawLiveScoreCandidate[] = [];

  const pushCandidate = (value: unknown): void => {
    if (!isRecord(value)) {
      return;
    }

    candidates.push(value as RawLiveScoreCandidate);
  };

  pushCandidate(payload.miniScore);
  pushCandidate(payload.miniscore);
  pushCandidate(payload);

  const fromMatchScoreDetails = payload.matchScoreDetails?.inningsScoreList;
  if (Array.isArray(fromMatchScoreDetails)) {
    for (const entry of [...fromMatchScoreDetails].reverse()) {
      pushCandidate(entry);
    }
  }

  if (Array.isArray(payload.inningsScoreList)) {
    for (const entry of [...payload.inningsScoreList].reverse()) {
      pushCandidate(entry);
    }
  }

  return candidates;
}

export function pickPreferredLiveState(
  current: MatchLiveState | null,
  incoming: MatchLiveState | null,
): MatchLiveState | null {
  if (!current) {
    return incoming;
  }

  if (!incoming) {
    return current;
  }

  return scoreState(incoming) > scoreState(current) ? incoming : current;
}

export function parseLiveStateFromHtml(
  scorecardHtml: string,
): MatchLiveState | null {
  const candidates: RawLiveScoreCandidate[] = [];

  const push = (value: RawLiveScoreCandidate | null | undefined): void => {
    if (value) {
      candidates.push(value);
    }
  };

  push(
    pickEscapedObjectByKey<RawLiveScoreCandidate>(scorecardHtml, "miniScore"),
  );
  push(
    pickEscapedObjectByKey<RawLiveScoreCandidate>(scorecardHtml, "miniscore"),
  );
  push(
    pickEscapedObjectByKey<RawLiveScoreCandidate>(
      scorecardHtml,
      "miniScoreCard",
    ),
  );
  push(
    pickEscapedObjectByKey<RawLiveScoreCandidate>(
      scorecardHtml,
      "miniScorecard",
    ),
  );

  const scoreDetails = pickEscapedObjectByKey<{
    inningsScoreList?: RawLiveScoreCandidate[];
  }>(scorecardHtml, "matchScoreDetails");
  if (Array.isArray(scoreDetails?.inningsScoreList)) {
    for (const entry of [...scoreDetails.inningsScoreList].reverse()) {
      candidates.push(entry);
    }
  }

  const flatInningsScoreList = pickEscapedArrayByKey<RawLiveScoreCandidate>(
    scorecardHtml,
    "inningsScoreList",
  );
  if (Array.isArray(flatInningsScoreList)) {
    for (const entry of [...flatInningsScoreList].reverse()) {
      candidates.push(entry);
    }
  }

  let best: MatchLiveState | null = null;

  for (const candidate of candidates) {
    best = pickPreferredLiveState(best, parseCandidateState(candidate, []));
  }

  return best;
}

export function parseLiveStateFromCommentaryPayload(
  payload: unknown,
): MatchLiveState | null {
  if (!isRecord(payload)) {
    return null;
  }

  const typedPayload = payload as RawCommentaryPayload;
  const commentaryLines = parseCommentaryList(typedPayload);
  const parsedCommentaryBalls = parseCommentaryBalls(commentaryLines);
  const commentaryCurrentOverBalls = parseCurrentOverFromCommentary(
    parsedCommentaryBalls,
  );
  const commentaryRecentBalls =
    parseRecentBallsFromCommentary(parsedCommentaryBalls);

  let best: MatchLiveState | null = null;

  for (const candidate of extractCandidatesFromPayload(typedPayload)) {
    const commentaryCurrentForCandidate = parseCurrentOverFromCommentary(
      parsedCommentaryBalls,
      firstNonEmpty(candidate.overs),
    );
    const parsed = parseCandidateState(
      candidate,
      commentaryCurrentForCandidate,
    );
    best = pickPreferredLiveState(best, parsed);
  }

  if (best) {
    const mergedCurrentOverBalls =
      best.currentOverBalls.length > 0
        ? best.currentOverBalls
        : commentaryCurrentOverBalls;
    const mergedRecentBalls =
      commentaryRecentBalls.length > best.recentBalls.length
        ? commentaryRecentBalls
        : best.recentBalls;
    const recentBalls = mergedRecentBalls.length
      ? mergedRecentBalls
      : mergedCurrentOverBalls;

    return {
      ...best,
      currentOverBalls: mergedCurrentOverBalls,
      recentBalls,
      recentBallsLabel:
        commentaryRecentBalls.length > 0
          ? formatRecentBallsLabel(commentaryRecentBalls.length)
          : recentBalls.length > 0
            ? best.recentBallsLabel
            : "Current over",
    };
  }

  if (
    commentaryCurrentOverBalls.length === 0 &&
    commentaryRecentBalls.length === 0
  ) {
    return null;
  }

  const overLabel =
    commentaryCurrentOverBalls[0]?.label.split(".")[0] ??
    commentaryCurrentOverBalls.at(-1)?.label.split(".")[0] ??
    "-";
  const recentBalls = commentaryRecentBalls.length
    ? commentaryRecentBalls
    : commentaryCurrentOverBalls;

  return {
    batters: [],
    bowler: null,
    previousBowlers: [],
    currentOverBalls: commentaryCurrentOverBalls,
    recentBalls,
    recentBallsLabel:
      commentaryRecentBalls.length > 0
        ? formatRecentBallsLabel(commentaryRecentBalls.length)
        : "Current over",
    currentOverLabel: overLabel,
    currentRunRate: "-",
    requiredRunRate: "-",
  };
}
