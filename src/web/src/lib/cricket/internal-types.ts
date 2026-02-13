import type { MatchStatusType } from "@/lib/types";

export type MatchLink = {
  title: string;
  url: string;
};

export type EmbeddedInnings = {
  runs?: number;
  wickets?: number;
  overs?: number | string;
};

export type EmbeddedMatchScore = {
  team1Score?: Record<string, EmbeddedInnings>;
  team2Score?: Record<string, EmbeddedInnings>;
};

export type EmbeddedMatchInfo = {
  matchId?: number | string;
  seriesName?: string;
  matchDesc?: string;
  matchFormat?: string;
  startDate?: number | string;
  state?: string;
  status?: string;
  team1?: {
    teamName?: string;
    teamSName?: string;
  };
  team2?: {
    teamName?: string;
    teamSName?: string;
  };
  venueInfo?: {
    ground?: string;
    city?: string;
    country?: string;
  };
};

export type MatchSummary = {
  matchId: number;
  team1: string | null;
  team2: string | null;
  team1ShortName: string | null;
  team2ShortName: string | null;
  team1Score: string | null;
  team2Score: string | null;
  seriesName: string | null;
  matchDesc: string | null;
  matchFormat: string | null;
  state: string | null;
  status: string | null;
  venue: string | null;
  startDate: number | null;
};

export type TitleMeta = {
  team1: string | null;
  team2: string | null;
  matchDesc: string | null;
  status: string | null;
};

export type RawPlayer = {
  id?: number | string;
  name?: string;
  fullName?: string;
  f_name?: string;
  shortName?: string;
  nickName?: string;
  role?: string;
  specialist?: string;
  roleDesc?: string;
  battingStyle?: string;
  batStyle?: string;
  bat_style?: string;
  bowlingStyle?: string;
  bowlStyle?: string;
  bowl_style?: string;
  image?: string;
  imgUrl?: string;
  imageUrl?: string;
  image_id?: number | string;
  imageId?: number | string;
  headshot?: string;
  faceImageId?: number | string;
  face_image_id?: number | string;
  imageID?: number | string;
  teamId?: number | string;
  team_id?: number | string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  captain?: boolean | number;
  keeper?: boolean | number;
  substitute?: boolean | number;
};

export type RawTeamHeader = {
  id?: number | string;
  name?: string;
  shortName?: string;
  playerDetails?: RawPlayer[] | Record<string, RawPlayer>;
  players?: RawPlayer[] | Record<string, RawPlayer>;
  squad?: Array<number | string | RawPlayer>;
  playingXI?: Array<number | string | RawPlayer>;
  playingXi?: Array<number | string | RawPlayer>;
  playing11?: Array<number | string | RawPlayer>;
  xi?: Array<number | string | RawPlayer>;
};

export type RawMatchHeader = {
  matchId?: number;
  matchDescription?: string;
  matchFormat?: string;
  status?: string;
  state?: string;
  seriesDesc?: string;
  matchStartTimestamp?: number | string;
  tossResults?: {
    tossWinnerName?: string;
    decision?: string;
  };
  team1?: RawTeamHeader;
  team2?: RawTeamHeader;
  venue?: {
    name?: string;
    city?: string;
    country?: string;
  };
};

export type RawMatchInfo = {
  team1?: RawTeamHeader;
  team2?: RawTeamHeader;
};

export type RawBatsman = {
  id?: number | string;
  batId?: number | string;
  batName?: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number | string;
  outDesc?: string;
};

export type RawBowler = {
  id?: number | string;
  bowlId?: number | string;
  bowlName?: string;
  overs?: number | string;
  maidens?: number;
  runs?: number;
  wickets?: number;
  economy?: number | string;
  wides?: number;
  no_balls?: number;
};

export type RawWicket = {
  wktNbr?: number;
  batName?: string;
  wktRuns?: number;
  wktOver?: number | string;
};

export type RawScorecardInnings = {
  inningsId?: number;
  batTeamDetails?: {
    batTeamName?: string;
    batTeamShortName?: string;
    batsmenData?: Record<string, RawBatsman>;
  };
  bowlTeamDetails?: {
    bowlTeamName?: string;
    bowlTeamShortName?: string;
    bowlersData?: Record<string, RawBowler>;
  };
  scoreDetails?: {
    runs?: number;
    wickets?: number;
    overs?: number | string;
  };
  extrasData?: {
    byes?: number;
    legByes?: number;
    noBalls?: number;
    wides?: number;
    penalty?: number;
    total?: number;
  };
  wicketsData?: Record<string, RawWicket>;
};

export type RawLiveBatter = {
  id?: number | string;
  batId?: number | string;
  name?: string;
  batName?: string;
  runs?: number | string;
  batRuns?: number | string;
  balls?: number | string;
  batBalls?: number | string;
  fours?: number | string;
  batFours?: number | string;
  sixes?: number | string;
  batSixes?: number | string;
  strikeRate?: number | string;
  batStrikeRate?: number | string;
  outDesc?: string;
  isStriker?: boolean;
  isOnStrike?: boolean;
};

export type RawLiveBowler = {
  id?: number | string;
  bowlId?: number | string;
  name?: string;
  bowlName?: string;
  overs?: number | string;
  bowlOvs?: number | string;
  maidens?: number | string;
  bowlMaidens?: number | string;
  runs?: number | string;
  bowlRuns?: number | string;
  wickets?: number | string;
  bowlWkts?: number | string;
  economy?: number | string;
  bowlEcon?: number | string;
};

export type RawLiveScoreCandidate = {
  overs?: number | string;
  crr?: number | string;
  currentRunRate?: number | string;
  reqRate?: number | string;
  requiredRunRate?: number | string;
  recentOvsStats?: string;
  recentOvsStatsArr?: unknown[];
  currentOver?: string | unknown[];
  thisOver?: string | unknown[];
  overSummary?: string | unknown[];
  overSummaryList?: unknown[];
  currOver?: string | unknown[];
  thisOverStats?: string | unknown[];
  batsmanStriker?: RawLiveBatter;
  batsmanNonStriker?: RawLiveBatter;
  striker?: RawLiveBatter;
  nonStriker?: RawLiveBatter;
  batsman1?: RawLiveBatter;
  batsman2?: RawLiveBatter;
  currentBatter?: RawLiveBatter;
  currentBatters?: RawLiveBatter[];
  bowlerStriker?: RawLiveBowler;
  bowler?: RawLiveBowler;
  currentBowler?: RawLiveBowler;
  bowlTeam?: {
    bowlers?: unknown[];
  };
  batTeam?: {
    batsmen?: unknown[];
  };
};

export type RawCommentaryBall = {
  overNumber?: number | string;
  overNum?: number | string;
  o_no?: number | string;
  ballNbr?: number | string;
  ballNumber?: number | string;
  ball?: number | string;
  runs?: number | string;
  runsScored?: number | string;
  event?: string;
  eventType?: string;
  comm?: string;
  commText?: string;
  commentary?: string;
};

export type RawCommentaryPayload = {
  matchHeader?: RawMatchHeader;
  matchInfo?: RawMatchInfo;
  team1?: RawTeamHeader;
  team2?: RawTeamHeader;
  players?: RawPlayer[] | Record<string, RawPlayer>;
  miniScore?: RawLiveScoreCandidate;
  miniscore?: RawLiveScoreCandidate;
  matchScoreDetails?: {
    inningsScoreList?: RawLiveScoreCandidate[];
  };
  inningsScoreList?: RawLiveScoreCandidate[];
  commentaryList?: RawCommentaryBall[] | Record<string, RawCommentaryBall>;
  comm_lines?: RawCommentaryBall[];
};

export type MatchStatusContext = {
  status: string;
  state: string;
  title: string;
  hasScore: boolean;
};

export type StatusClassifier = (context: MatchStatusContext) => MatchStatusType;
