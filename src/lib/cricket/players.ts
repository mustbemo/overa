import type { TeamPlayer } from "@/lib/types";
import { CRICBUZZ_BASE_URL } from "./constants";
import type {
  RawMatchHeader,
  RawMatchInfo,
  RawCommentaryPayload,
  RawPlayer,
  RawScorecardInnings,
  RawTeamHeader,
} from "./internal-types";
import {
  pickAllEscapedArraysByKey,
  pickAllEscapedObjectsByKey,
} from "./json-extract";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeRawPlayers(
  players?: RawPlayer[] | Record<string, RawPlayer>,
): RawPlayer[] {
  if (!players) {
    return [];
  }

  if (Array.isArray(players)) {
    return players;
  }

  return Object.values(players);
}

function normalizePlayerName(value: string): string {
  return value.replace(/\s*\((?:c|wk|c,\s*wk|wk,\s*c)\)\s*$/gi, "").trim();
}

function normalizePlayerKey(value: string): string {
  return normalizePlayerName(value).toLowerCase().replace(/\s+/g, " ");
}

function normalizeTeamKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function toUrlCandidate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();

  if (!candidate) {
    return null;
  }

  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate;
  }

  if (candidate.startsWith("//")) {
    return `https:${candidate}`;
  }

  if (candidate.startsWith("/")) {
    return `${CRICBUZZ_BASE_URL}${candidate}`;
  }

  return null;
}

function buildCricbuzzImageFromId(value: unknown): string | null {
  const parsed = Number(value ?? "");

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return `${CRICBUZZ_BASE_URL}/a/img/v1/72x72/i1/c${parsed}/i.jpg`;
}

function getPlayerImageUrl(player: RawPlayer): string | null {
  const direct =
    toUrlCandidate(player.imageUrl) ??
    toUrlCandidate(player.imgUrl) ??
    toUrlCandidate(player.image) ??
    toUrlCandidate(player.headshot);

  if (direct) {
    return direct;
  }

  return (
    buildCricbuzzImageFromId(player.faceImageId) ??
    buildCricbuzzImageFromId(player.face_image_id) ??
    buildCricbuzzImageFromId(player.imageId) ??
    buildCricbuzzImageFromId(player.image_id) ??
    buildCricbuzzImageFromId(player.imageID) ??
    buildCricbuzzImageFromId(player.id)
  );
}

function toText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function scorePlayerQuality(player: TeamPlayer): number {
  let score = 0;

  if (player.id && player.id !== "-") score += 2;
  if (player.role && player.role !== "-") score += 2;
  if (player.battingStyle && player.battingStyle !== "-") score += 1;
  if (player.bowlingStyle && player.bowlingStyle !== "-") score += 1;
  if (player.imageUrl) score += 2;
  if (player.captain) score += 1;
  if (player.keeper) score += 1;

  return score;
}

function mergeOnePlayer(
  existing: TeamPlayer,
  incoming: TeamPlayer,
): TeamPlayer {
  const keepIncoming =
    scorePlayerQuality(incoming) > scorePlayerQuality(existing);
  const better = keepIncoming ? incoming : existing;
  const other = keepIncoming ? existing : incoming;

  return {
    id: better.id !== "-" ? better.id : other.id,
    name: better.name || other.name || "Unknown",
    role: better.role !== "-" ? better.role : other.role,
    battingStyle:
      better.battingStyle !== "-" ? better.battingStyle : other.battingStyle,
    bowlingStyle:
      better.bowlingStyle !== "-" ? better.bowlingStyle : other.bowlingStyle,
    captain: existing.captain || incoming.captain,
    keeper: existing.keeper || incoming.keeper,
    substitute: existing.substitute || incoming.substitute,
    imageUrl: better.imageUrl ?? other.imageUrl ?? null,
  };
}

export function toTeamPlayers(
  players?: RawPlayer[] | Record<string, RawPlayer>,
): TeamPlayer[] {
  return normalizeRawPlayers(players)
    .filter((player) => player && typeof player === "object")
    .map((player) => ({
      id: toText(player.id) || "-",
      name:
        player.fullName?.trim() ||
        player.name?.trim() ||
        player.f_name?.trim() ||
        player.shortName?.trim() ||
        player.nickName?.trim() ||
        "Unknown",
      role:
        player.role?.trim() ||
        player.specialist?.trim() ||
        player.roleDesc?.trim() ||
        "-",
      battingStyle:
        player.battingStyle?.trim() ||
        player.batStyle?.trim() ||
        player.bat_style?.trim() ||
        "-",
      bowlingStyle:
        player.bowlingStyle?.trim() ||
        player.bowlStyle?.trim() ||
        player.bowl_style?.trim() ||
        "-",
      captain: Boolean(player.isCaptain ?? player.captain),
      keeper: Boolean(player.isKeeper ?? player.keeper),
      substitute: Boolean(player.substitute),
      imageUrl: getPlayerImageUrl(player),
    }));
}

type PlayerAccumulator = {
  name: string;
  captain: boolean;
  keeper: boolean;
  batted: boolean;
  bowled: boolean;
  imageUrl: string | null;
};

function upsertTeamPlayer(
  map: Map<string, PlayerAccumulator>,
  playerName: string,
  options: {
    captain?: boolean;
    keeper?: boolean;
    batted?: boolean;
    bowled?: boolean;
    imageUrl?: string | null;
  },
): void {
  const cleanedName = normalizePlayerName(playerName);
  const key = normalizePlayerKey(cleanedName);

  if (!cleanedName) {
    return;
  }

  const existing = map.get(key) ?? {
    name: cleanedName,
    captain: false,
    keeper: false,
    batted: false,
    bowled: false,
    imageUrl: null,
  };

  map.set(key, {
    ...existing,
    captain: existing.captain || Boolean(options.captain),
    keeper: existing.keeper || Boolean(options.keeper),
    batted: existing.batted || Boolean(options.batted),
    bowled: existing.bowled || Boolean(options.bowled),
    imageUrl: existing.imageUrl ?? options.imageUrl ?? null,
  });
}

function roleFromPlayerAccumulator(player: PlayerAccumulator): string {
  if (player.batted && player.bowled) {
    return "All-rounder";
  }

  if (player.bowled) {
    return "Bowler";
  }

  if (player.batted) {
    return "Batter";
  }

  return "-";
}

/**
 * Builds a full squad fallback from raw scorecard blocks, including DNB batters.
 */
export function fallbackPlayersFromRawInnings(
  scoreCard: RawScorecardInnings[],
  teamName: string,
): TeamPlayer[] {
  const teamKey = normalizeTeamKey(teamName);
  const playersMap = new Map<string, PlayerAccumulator>();

  for (const inningsEntry of scoreCard) {
    const isBattingTeam =
      normalizeTeamKey(
        inningsEntry.batTeamDetails?.batTeamName ??
          inningsEntry.batTeamDetails?.batTeamShortName ??
          "",
      ) === teamKey;
    const isBowlingTeam =
      normalizeTeamKey(
        inningsEntry.bowlTeamDetails?.bowlTeamName ??
          inningsEntry.bowlTeamDetails?.bowlTeamShortName ??
          "",
      ) === teamKey;

    if (isBattingTeam) {
      const batsmenData = inningsEntry.batTeamDetails?.batsmenData ?? {};
      for (const batter of Object.values(batsmenData)) {
        const imageUrl =
          buildCricbuzzImageFromId(batter.id) ??
          buildCricbuzzImageFromId(batter.batId);
        upsertTeamPlayer(playersMap, batter.batName ?? "", {
          captain: Boolean(batter.isCaptain),
          keeper: Boolean(batter.isKeeper),
          batted: true,
          imageUrl,
        });
      }
    }

    if (isBowlingTeam) {
      const bowlersData = inningsEntry.bowlTeamDetails?.bowlersData ?? {};
      for (const bowler of Object.values(bowlersData)) {
        const imageUrl =
          buildCricbuzzImageFromId(bowler.id) ??
          buildCricbuzzImageFromId(bowler.bowlId);
        upsertTeamPlayer(playersMap, bowler.bowlName ?? "", {
          bowled: true,
          imageUrl,
        });
      }
    }

    if (isBattingTeam) {
      const wicketsData = inningsEntry.wicketsData ?? {};
      for (const wicket of Object.values(wicketsData)) {
        upsertTeamPlayer(playersMap, wicket.batName ?? "", { batted: true });
      }
    }
  }

  return Array.from(playersMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player, index) => ({
      id: `${teamKey}-${index + 1}`,
      name: player.name,
      role: roleFromPlayerAccumulator(player),
      battingStyle: "-",
      bowlingStyle: "-",
      captain: player.captain,
      keeper: player.keeper,
      substitute: false,
      imageUrl: player.imageUrl,
    }));
}

export function mergeTeamPlayers(
  primary: TeamPlayer[],
  fallback: TeamPlayer[],
): TeamPlayer[] {
  const merged = new Map<string, TeamPlayer>();

  const mergeOne = (player: TeamPlayer): void => {
    const key = normalizePlayerKey(player.name);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, player);
      return;
    }

    merged.set(key, mergeOnePlayer(existing, player));
  };

  for (const player of fallback) {
    mergeOne(player);
  }

  for (const player of primary) {
    mergeOne(player);
  }

  return Array.from(merged.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function toTeamHeader(value: unknown): RawTeamHeader | null {
  return isRecord(value) ? (value as RawTeamHeader) : null;
}

function toPlayersFromUnknown(value: unknown): TeamPlayer[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    const records = value.filter((entry): entry is RawPlayer =>
      isRecord(entry),
    );

    return toTeamPlayers(records);
  }

  if (isRecord(value)) {
    const allValues = Object.values(value);
    if (allValues.every((entry) => isRecord(entry))) {
      return toTeamPlayers(value as Record<string, RawPlayer>);
    }
  }

  return [];
}

function toIdSetFromMixed(
  value: unknown,
  playersById: Map<string, TeamPlayer>,
): TeamPlayer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const directPlayers: RawPlayer[] = [];
  const idPlayers: TeamPlayer[] = [];

  for (const entry of value) {
    if (isRecord(entry)) {
      directPlayers.push(entry as RawPlayer);
      continue;
    }

    const id = toText(entry);
    if (!id) {
      continue;
    }

    const mapped = playersById.get(id);
    if (mapped) {
      idPlayers.push(mapped);
    }
  }

  return mergeTeamPlayers(toTeamPlayers(directPlayers), idPlayers);
}

function collectPlayersFromTeamNode(
  teamNode: RawTeamHeader | null,
  playersById: Map<string, TeamPlayer>,
): TeamPlayer[] {
  if (!teamNode) {
    return [];
  }

  let teamPlayers: TeamPlayer[] = [];

  const candidates: unknown[] = [
    teamNode.playerDetails,
    teamNode.players,
    teamNode.squad,
    teamNode.playingXI,
    teamNode.playingXi,
    teamNode.playing11,
    teamNode.xi,
  ];

  for (const candidate of candidates) {
    teamPlayers = mergeTeamPlayers(
      teamPlayers,
      toPlayersFromUnknown(candidate),
    );
    teamPlayers = mergeTeamPlayers(
      teamPlayers,
      toIdSetFromMixed(candidate, playersById),
    );
  }

  return teamPlayers;
}

function teamIdFromNode(teamNode: RawTeamHeader | null): string {
  return toText(teamNode?.id);
}

export function extractTeamPlayersFromSquadsHtml(html: string): {
  team1Players: TeamPlayer[];
  team2Players: TeamPlayer[];
} {
  const matchHeader =
    pickAllEscapedObjectsByKey<RawMatchHeader>(html, "matchHeader").at(0) ??
    null;
  const matchInfo =
    pickAllEscapedObjectsByKey<RawMatchInfo>(html, "matchInfo").at(0) ?? null;

  const rawCatalogArrays = pickAllEscapedArraysByKey<RawPlayer>(html, "players");
  const rawCatalogObjects = pickAllEscapedObjectsByKey<Record<string, RawPlayer>>(
    html,
    "players",
  );
  const rawCatalog = [
    ...rawCatalogArrays.flat(),
    ...rawCatalogObjects.flatMap((entry) => Object.values(entry)),
  ];

  const catalogPlayers = toTeamPlayers(rawCatalog);
  const playersById = new Map<string, TeamPlayer>();

  for (const player of catalogPlayers) {
    if (player.id && player.id !== "-") {
      playersById.set(player.id, player);
    }
  }

  const team1Candidates = [matchHeader?.team1 ?? null, matchInfo?.team1 ?? null];
  const team2Candidates = [matchHeader?.team2 ?? null, matchInfo?.team2 ?? null];

  let team1Players: TeamPlayer[] = [];
  let team2Players: TeamPlayer[] = [];

  for (const teamNode of team1Candidates) {
    team1Players = mergeTeamPlayers(
      team1Players,
      collectPlayersFromTeamNode(teamNode, playersById),
    );
  }

  for (const teamNode of team2Candidates) {
    team2Players = mergeTeamPlayers(
      team2Players,
      collectPlayersFromTeamNode(teamNode, playersById),
    );
  }

  const team1Id =
    teamIdFromNode(matchHeader?.team1 ?? null) ||
    teamIdFromNode(matchInfo?.team1 ?? null);
  const team2Id =
    teamIdFromNode(matchHeader?.team2 ?? null) ||
    teamIdFromNode(matchInfo?.team2 ?? null);

  if (team1Id || team2Id) {
    const mappedTeam1 = rawCatalog.filter((player) => {
      const playerTeamId = toText(player.teamId ?? player.team_id);
      return playerTeamId && playerTeamId === team1Id;
    });
    const mappedTeam2 = rawCatalog.filter((player) => {
      const playerTeamId = toText(player.teamId ?? player.team_id);
      return playerTeamId && playerTeamId === team2Id;
    });

    team1Players = mergeTeamPlayers(team1Players, toTeamPlayers(mappedTeam1));
    team2Players = mergeTeamPlayers(team2Players, toTeamPlayers(mappedTeam2));
  }

  return {
    team1Players,
    team2Players,
  };
}

export function extractTeamPlayersFromCommentaryPayload(payload: unknown): {
  team1Players: TeamPlayer[];
  team2Players: TeamPlayer[];
} {
  if (!isRecord(payload)) {
    return {
      team1Players: [],
      team2Players: [],
    };
  }

  const typedPayload = payload as RawCommentaryPayload;

  const rootTeam1 = toTeamHeader(typedPayload.team1);
  const rootTeam2 = toTeamHeader(typedPayload.team2);
  const headerTeam1 = toTeamHeader(typedPayload.matchHeader?.team1);
  const headerTeam2 = toTeamHeader(typedPayload.matchHeader?.team2);
  const infoTeam1 = toTeamHeader(typedPayload.matchInfo?.team1);
  const infoTeam2 = toTeamHeader(typedPayload.matchInfo?.team2);

  const rawCatalog = normalizeRawPlayers(typedPayload.players);
  const catalogPlayers = toTeamPlayers(rawCatalog);
  const playersById = new Map<string, TeamPlayer>();

  for (const player of catalogPlayers) {
    if (player.id && player.id !== "-") {
      playersById.set(player.id, player);
    }
  }

  const team1Candidates = [headerTeam1, infoTeam1, rootTeam1];
  const team2Candidates = [headerTeam2, infoTeam2, rootTeam2];

  let team1Players: TeamPlayer[] = [];
  let team2Players: TeamPlayer[] = [];

  for (const teamNode of team1Candidates) {
    team1Players = mergeTeamPlayers(
      team1Players,
      collectPlayersFromTeamNode(teamNode, playersById),
    );
  }

  for (const teamNode of team2Candidates) {
    team2Players = mergeTeamPlayers(
      team2Players,
      collectPlayersFromTeamNode(teamNode, playersById),
    );
  }

  const team1Id =
    teamIdFromNode(headerTeam1) ||
    teamIdFromNode(infoTeam1) ||
    teamIdFromNode(rootTeam1);
  const team2Id =
    teamIdFromNode(headerTeam2) ||
    teamIdFromNode(infoTeam2) ||
    teamIdFromNode(rootTeam2);

  if (team1Id || team2Id) {
    const mappedTeam1 = rawCatalog
      .filter((player) => {
        const playerTeamId = toText(player.teamId ?? player.team_id);
        return playerTeamId && playerTeamId === team1Id;
      })
      .map((player) => player as RawPlayer);
    const mappedTeam2 = rawCatalog
      .filter((player) => {
        const playerTeamId = toText(player.teamId ?? player.team_id);
        return playerTeamId && playerTeamId === team2Id;
      })
      .map((player) => player as RawPlayer);

    team1Players = mergeTeamPlayers(team1Players, toTeamPlayers(mappedTeam1));
    team2Players = mergeTeamPlayers(team2Players, toTeamPlayers(mappedTeam2));
  }

  return {
    team1Players,
    team2Players,
  };
}
