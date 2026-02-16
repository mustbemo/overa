export type MatchStatusType = "live" | "complete" | "upcoming";

export type TeamSnapshot = {
  name: string;
  shortName: string;
  score: string;
  flagUrl: string | null;
};

export type MatchListItem = {
  id: string;
  title: string;
  matchDesc: string;
  series: string;
  venue: string;
  team1: TeamSnapshot;
  team2: TeamSnapshot;
  status: string;
  state: string;
  statusType: MatchStatusType;
  matchUrl: string;
};

export type MatchesData = {
  live: MatchListItem[];
  upcoming: MatchListItem[];
  recent: MatchListItem[];
};

export type MatchBatter = {
  name: string;
  runs: string;
  balls: string;
  fours: string;
  sixes: string;
  strikeRate: string;
  dismissal: string;
};

export type LiveBatter = {
  id: string;
  name: string;
  runs: string;
  balls: string;
  fours: string;
  sixes: string;
  strikeRate: string;
  onStrike: boolean;
};

export type LiveBowler = {
  id: string;
  name: string;
  overs: string;
  maidens: string;
  runs: string;
  wickets: string;
  economy: string;
};

export type LiveOverBall = {
  label: string;
  value: string;
  kind: "wicket" | "four" | "six" | "extra" | "dot" | "run" | "other";
};

export type MatchLiveState = {
  batters: LiveBatter[];
  bowler: LiveBowler | null;
  previousBowlers: LiveBowler[];
  currentOverBalls: LiveOverBall[];
  recentBalls: LiveOverBall[];
  recentBallsLabel: string;
  currentOverLabel: string;
  currentRunRate: string;
  requiredRunRate: string;
};

export type MatchWinPrediction = {
  team1Percent: string;
  team2Percent: string;
};

export type MatchBowler = {
  name: string;
  overs: string;
  maidens: string;
  runs: string;
  wickets: string;
  economy: string;
  wides: string;
  noBalls: string;
};

export type MatchInnings = {
  inningsId: string;
  battingTeam: string;
  bowlingTeam: string;
  scoreLine: string;
  runRate: string;
  extrasLine: string;
  batsmen: MatchBatter[];
  bowlers: MatchBowler[];
  fallOfWickets: string[];
  yetToBat: string[];
};

export type TeamPlayer = {
  id: string;
  name: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  captain: boolean;
  keeper: boolean;
  substitute: boolean;
  imageUrl: string | null;
};

export type MatchDetailData = {
  id: string;
  title: string;
  series: string;
  matchDesc: string;
  format: string;
  venue: string;
  startTime: string;
  status: string;
  state: string;
  toss: string;
  team1: TeamSnapshot;
  team2: TeamSnapshot;
  innings: MatchInnings[];
  team1Players: TeamPlayer[];
  team2Players: TeamPlayer[];
  liveState: MatchLiveState | null;
  winPrediction: MatchWinPrediction | null;
};
