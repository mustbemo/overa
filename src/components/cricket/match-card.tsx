"use client";

import { useRouter } from "next/navigation";
import { Bell, MapPin } from "lucide-react";
import type { MouseEvent } from "react";
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
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <TeamMark name={name} shortName={shortName} flagUrl={flagUrl} compact />
        <span className="truncate text-[12px] font-medium text-slate-200">
          {shortName || name}
        </span>
      </div>
      <span className="shrink-0 text-[12px] font-semibold tabular-nums text-slate-50">
        {score || "-"}
      </span>
    </div>
  );
}

export function MatchCard({ match }: { match: MatchListItem }) {
  const isLive = match.statusType === "live";
  const router = useRouter();
  const matchHref = buildMatchHref("/match", match.id);
  const subscribeHref = buildMatchHref("/subscribe", match.id);

  const openMatch = () => {
    router.push(matchHref);
  };

  const openSubscribe = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    router.push(subscribeHref);
  };

  return (
    <article
      className="block cursor-pointer rounded-xl border border-white/8 bg-white/4 p-2.5 transition-colors duration-200 hover:border-white/16 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-300/60"
      data-no-drag
      role="link"
      tabIndex={0}
      onClick={openMatch}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMatch();
        }
      }}
    >
      <header className="mb-1.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-teal-200/80">
            {match.series || "Series"}
          </p>
          <p className="mt-px truncate text-[10px] text-slate-400">
            {match.matchDesc || "Match"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isLive ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-px text-[9px] font-medium text-emerald-200 transition hover:bg-emerald-500/20"
              onClick={openSubscribe}
              title="Subscribe floating widget"
              data-no-drag
            >
              <Bell className="h-2.5 w-2.5" />
              Widget
            </button>
          ) : null}
          <StatusBadge
            status={match.status || match.state}
            statusType={match.statusType}
            compact
          />
        </div>
      </header>

      <div className="space-y-1.5">
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

      <p className="mt-2 truncate text-[10px] text-emerald-300/80">
        {match.status || match.state || "Status unavailable"}
      </p>

      <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-400/60">
        <MapPin className="h-3 w-3 shrink-0" />
        {match.venue || "Venue unavailable"}
      </p>
    </article>
  );
}
