import Link from "next/link";
import {
  getInitialColor,
  getTeamFlagEmoji,
  getTeamInitials,
} from "@/lib/team-flags";
import type { MatchListItem } from "@/lib/types";

const STATUS_COLORS: Record<MatchListItem["statusType"], string> = {
  live: "bg-green-500",
  complete: "bg-gray-400",
  upcoming: "bg-blue-500",
};

const STATUS_LABELS: Record<MatchListItem["statusType"], string> = {
  live: "LIVE",
  complete: "FINISHED",
  upcoming: "UPCOMING",
};

function TeamLogo({
  name,
  shortName,
  flagUrl,
}: {
  name: string;
  shortName: string;
  flagUrl: string | null;
}) {
  const flagEmoji = getTeamFlagEmoji(name, shortName);

  if (flagEmoji) {
    return (
      <div className="flex h-[18px] w-6 shrink-0 items-center justify-center rounded-sm text-sm">
        {flagEmoji}
      </div>
    );
  }

  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-[18px] w-6 shrink-0 rounded-sm object-cover"
      />
    );
  }

  const initials = getTeamInitials(shortName || name);
  const color = getInitialColor(shortName || name);

  return (
    <div
      className="flex h-[18px] w-6 shrink-0 items-center justify-center rounded-sm text-[8px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function TeamRow({
  name,
  shortName,
  score,
  flagUrl,
  isBatting,
}: {
  name: string;
  shortName: string;
  score: string;
  flagUrl: string | null;
  isBatting: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <TeamLogo name={name} shortName={shortName} flagUrl={flagUrl} />
        <span
          className={`truncate text-sm ${
            isBatting
              ? "font-semibold text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          <span className="hidden sm:inline">{name || shortName}</span>
          <span className="sm:hidden">{shortName || name}</span>
        </span>
      </div>
      {score ? (
        <span
          className={`whitespace-nowrap text-sm ${
            isBatting
              ? "font-semibold text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {score}
        </span>
      ) : null}
    </div>
  );
}

export function MatchCard({ match }: { match: MatchListItem }) {
  const hasTeam1Score = Boolean(match.team1.score);
  const hasTeam2Score = Boolean(match.team2.score);

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {match.series ? (
            <p className="truncate text-xs font-medium text-green-700 dark:text-green-400">
              {match.series}
            </p>
          ) : null}
          <p className="truncate text-xs text-gray-500 dark:text-gray-500">
            {match.matchDesc || "Match"}
            {match.venue ? ` • ${match.venue}` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white ${STATUS_COLORS[match.statusType]}`}
        >
          {STATUS_LABELS[match.statusType]}
        </span>
      </header>

      <div className="flex flex-col gap-2.5">
        <TeamRow
          name={match.team1.name}
          shortName={match.team1.shortName}
          score={match.team1.score}
          flagUrl={match.team1.flagUrl}
          isBatting={hasTeam1Score}
        />
        <TeamRow
          name={match.team2.name}
          shortName={match.team2.shortName}
          score={match.team2.score}
          flagUrl={match.team2.flagUrl}
          isBatting={!hasTeam1Score && hasTeam2Score}
        />
      </div>

      <p
        className={`mt-3 truncate text-xs font-medium ${
          match.statusType === "live"
            ? "text-green-600 dark:text-green-400"
            : match.statusType === "complete"
              ? "text-gray-500 dark:text-gray-400"
              : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {match.status || match.state || "Status unavailable"}
      </p>
    </Link>
  );
}
