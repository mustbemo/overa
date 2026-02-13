import Link from "next/link";
import { MapPin } from "lucide-react";
import { buildMatchHref } from "@/lib/cricket-ui";
import type { MatchListItem } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { TeamMark } from "./team-mark";

function TeamRow({
  name,
  shortName,
  score,
  flagUrl,
}: {
  name: string;
  shortName: string;
  score: string;
  flagUrl: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <TeamMark
          name={name}
          shortName={shortName}
          flagUrl={flagUrl}
          compact
        />
        <span className="truncate text-sm font-semibold text-slate-100">
          {shortName || name}
        </span>
      </div>
      <span className="shrink-0 text-sm text-slate-200">{score || "-"}</span>
    </div>
  );
}

export function MatchCard({ match }: { match: MatchListItem }) {
  return (
    <Link
      href={buildMatchHref("/match", match.id)}
      className="block rounded-2xl border border-white/10 bg-white/[0.06] p-3 transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.1]"
      data-no-drag
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-teal-200/90">
            {match.series || "Series"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-300/80">
            {match.matchDesc || "Match"}
          </p>
        </div>
        <StatusBadge
          status={match.status || match.state}
          statusType={match.statusType}
          compact
        />
      </header>

      <div className="space-y-2">
        <TeamRow
          name={match.team1.name}
          shortName={match.team1.shortName}
          score={match.team1.score}
          flagUrl={match.team1.flagUrl}
        />
        <TeamRow
          name={match.team2.name}
          shortName={match.team2.shortName}
          score={match.team2.score}
          flagUrl={match.team2.flagUrl}
        />
      </div>

      <p className="mt-3 truncate text-xs text-emerald-200/90">
        {match.status || match.state || "Status unavailable"}
      </p>

      <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-slate-300/70">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        {match.venue || "Venue unavailable"}
      </p>
    </Link>
  );
}
