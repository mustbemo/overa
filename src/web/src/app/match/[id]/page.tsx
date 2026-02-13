import Link from "next/link";
import { PageAutoRefresh } from "@/components/page-auto-refresh";
import { getMatchDetail } from "@/lib/cricket-scraper";
import {
  getInitialColor,
  getTeamFlagEmoji,
  getTeamInitials,
} from "@/lib/team-flags";
import type { MatchInnings, MatchLiveState, TeamPlayer } from "@/lib/types";

export const dynamic = "force-dynamic";

type MatchPageProps = {
  params: Promise<{ id: string }>;
};

function TeamFlag({
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
      <span className="inline-flex h-6 w-9 items-center justify-center rounded-sm text-base">
        {flagEmoji}
      </span>
    );
  }

  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-6 w-9 rounded-sm object-cover"
      />
    );
  }

  const initials = getTeamInitials(shortName || name);
  const color = getInitialColor(shortName || name);

  return (
    <span
      className="inline-flex h-6 w-9 items-center justify-center rounded-sm text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusType = getStatusType(status);

  const colorMap: Record<string, string> = {
    live: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    complete:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    upcoming:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-sm font-medium ${
        colorMap[statusType] || colorMap.upcoming
      }`}
    >
      {statusType === "live" ? (
        <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
      ) : null}
      {status}
    </div>
  );
}

function getStatusType(status: string): "live" | "complete" | "upcoming" {
  const text = status.toLowerCase();

  return /(won|complete|drawn|tied|abandoned|no result)/.test(text)
    ? "complete"
    : /(preview|upcoming|yet to begin|scheduled)/.test(text)
      ? "upcoming"
      : "live";
}

function getOverBallChipClasses(
  kind: MatchLiveState["currentOverBalls"][number]["kind"],
): {
  container: string;
  value: string;
} {
  if (kind === "wicket") {
    return {
      container:
        "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40",
      value: "text-red-700 dark:text-red-300",
    };
  }

  if (kind === "four") {
    return {
      container:
        "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40",
      value: "text-blue-700 dark:text-blue-300",
    };
  }

  if (kind === "six") {
    return {
      container:
        "border-purple-200 bg-purple-50 dark:border-purple-900/60 dark:bg-purple-950/40",
      value: "text-purple-700 dark:text-purple-300",
    };
  }

  return {
    container:
      "border-gray-200 bg-white dark:border-gray-800 dark:bg-transparent",
    value: "text-gray-900 dark:text-white",
  };
}

function LiveCenterCard({ liveState }: { liveState: MatchLiveState }) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-green-200 bg-white dark:border-green-900/60 dark:bg-gray-900">
      <header className="border-b border-green-100 bg-green-50 px-4 py-3 dark:border-green-900/50 dark:bg-green-950/30">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Live Centre
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Over: {liveState.currentOverLabel || "-"}
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Current Batters
          </h4>
          {liveState.batters.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {liveState.batters.map((batter) => (
                <li
                  key={`${batter.id}-${batter.name}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {batter.name}
                    </p>
                    {batter.onStrike ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        Striker
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                    {batter.runs} ({batter.balls}) | 4s {batter.fours} | 6s{" "}
                    {batter.sixes} | SR {batter.strikeRate}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Current batter data not available.
            </p>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Current Bowler
          </h4>
          {liveState.bowler ? (
            <div className="mt-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {liveState.bowler.name}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                {liveState.bowler.overs} O | {liveState.bowler.maidens} M |{" "}
                {liveState.bowler.runs} R | {liveState.bowler.wickets} W | ECO{" "}
                {liveState.bowler.economy}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Current bowler data not available.
            </p>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <SummaryCard label="Current RR" value={liveState.currentRunRate} />
            <SummaryCard
              label="Required RR"
              value={liveState.requiredRunRate}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Current Over Breakdown
        </h4>
        {liveState.currentOverBalls.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {liveState.currentOverBalls.map((ball, index) => {
              const classes = getOverBallChipClasses(ball.kind);

              return (
                <div
                  key={`${ball.label}-${ball.value}-${index}`}
                  className={`min-w-[64px] rounded-lg border px-2 py-1 text-center ${classes.container}`}
                >
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {ball.label}
                  </p>
                  <p className={`text-sm font-semibold ${classes.value}`}>
                    {ball.value}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Current over ball summary not available.
          </p>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
        {value || "-"}
      </p>
    </div>
  );
}

function SquadTable({
  title,
  players,
}: {
  title: string;
  players: TeamPlayer[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <header className="border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      </header>

      {players.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
                <th className="px-4 py-2 font-medium">Player</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Batting</th>
                <th className="px-2 py-2 font-medium">Bowling</th>
                <th className="px-2 py-2 font-medium">Captain</th>
                <th className="px-2 py-2 font-medium">Keeper</th>
                <th className="px-2 py-2 font-medium">Sub</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={`${title}-${player.id}-${index}`}
                  className="border-b border-gray-50 text-gray-700 last:border-0 dark:border-gray-800/50 dark:text-gray-300"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {player.imageUrl ? (
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          referrerPolicy="no-referrer"
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{
                            backgroundColor: getInitialColor(player.name),
                          }}
                        >
                          {getTeamInitials(player.name)}
                        </span>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {player.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">{player.role}</td>
                  <td className="px-2 py-2.5">{player.battingStyle}</td>
                  <td className="px-2 py-2.5">{player.bowlingStyle}</td>
                  <td className="px-2 py-2.5">
                    {player.captain ? "Yes" : "No"}
                  </td>
                  <td className="px-2 py-2.5">
                    {player.keeper ? "Yes" : "No"}
                  </td>
                  <td className="px-2 py-2.5">
                    {player.substitute ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
          Player list not available.
        </p>
      )}
    </section>
  );
}

function InningsCard({
  innings,
  index,
}: {
  innings: MatchInnings;
  index: number;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <header className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {innings.battingTeam}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-gray-900 dark:text-white">
            {innings.scoreLine}
          </span>
          {innings.runRate !== "-" ? (
            <span className="text-xs text-gray-500">RR: {innings.runRate}</span>
          ) : null}
        </div>
      </header>

      <div className="px-4 pt-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Bowling: {innings.bowlingTeam}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Extras: {innings.extrasLine}
        </p>
      </div>

      {innings.batsmen.length > 0 ? (
        <div className="px-4 pt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Batting
          </h4>
          <div className="overflow-x-auto">
            <table className="mb-4 w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
                  <th className="py-2 text-left font-medium">Batter</th>
                  <th className="px-2 py-2 text-right font-medium">R</th>
                  <th className="px-2 py-2 text-right font-medium">B</th>
                  <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                    4s
                  </th>
                  <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                    6s
                  </th>
                  <th className="px-2 py-2 text-right font-medium">SR</th>
                </tr>
              </thead>
              <tbody>
                {innings.batsmen.map((batter, batterIndex) => (
                  <tr
                    key={`bat-${index}-${batterIndex}-${batter.name}`}
                    className="border-b border-gray-50 last:border-0 dark:border-gray-800/50"
                  >
                    <td className="py-2.5">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {batter.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {batter.dismissal}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                      {batter.runs}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-500">
                      {batter.balls}
                    </td>
                    <td className="hidden px-2 py-2.5 text-right text-gray-500 sm:table-cell">
                      {batter.fours}
                    </td>
                    <td className="hidden px-2 py-2.5 text-right text-gray-500 sm:table-cell">
                      {batter.sixes}
                    </td>
                    <td className="px-2 py-2.5 text-right text-gray-500">
                      {batter.strikeRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
            <h5 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Yet To Bat
            </h5>
            {innings.yetToBat.length > 0 ? (
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {innings.yetToBat.join(", ")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All listed batters have batted.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {innings.bowlers.length > 0 ? (
        <div className="overflow-x-auto border-t border-gray-100 px-4 pt-3 dark:border-gray-800">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Bowling
          </h4>
          <table className="mb-4 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-500">
                <th className="py-2 text-left font-medium">Bowler</th>
                <th className="px-2 py-2 text-right font-medium">O</th>
                <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                  M
                </th>
                <th className="px-2 py-2 text-right font-medium">R</th>
                <th className="px-2 py-2 text-right font-medium">W</th>
                <th className="px-2 py-2 text-right font-medium">ECO</th>
                <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                  Wd
                </th>
                <th className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                  Nb
                </th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.map((bowler, bowlerIndex) => (
                <tr
                  key={`bowl-${index}-${bowlerIndex}-${bowler.name}`}
                  className="border-b border-gray-50 last:border-0 dark:border-gray-800/50"
                >
                  <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                    {bowler.name}
                  </td>
                  <td className="px-2 py-2.5 text-right text-gray-500">
                    {bowler.overs}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right text-gray-500 sm:table-cell">
                    {bowler.maidens}
                  </td>
                  <td className="px-2 py-2.5 text-right text-gray-500">
                    {bowler.runs}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold text-gray-900 dark:text-white">
                    {bowler.wickets}
                  </td>
                  <td className="px-2 py-2.5 text-right text-gray-500">
                    {bowler.economy}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right text-gray-500 sm:table-cell">
                    {bowler.wides}
                  </td>
                  <td className="hidden px-2 py-2.5 text-right text-gray-500 sm:table-cell">
                    {bowler.noBalls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Fall Of Wickets
        </h4>
        {innings.fallOfWickets.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {innings.fallOfWickets.map((item) => (
              <li key={`wkt-${index}-${item}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No wickets recorded.
          </p>
        )}
      </div>
    </section>
  );
}

export default async function MatchDetailsPage({ params }: MatchPageProps) {
  const { id } = await params;

  try {
    const detail = await getMatchDetail(id);
    const statusType = getStatusType(detail.status);
    const showLiveCenter = statusType === "live" && Boolean(detail.liveState);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <title>Back</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold text-gray-900 dark:text-white">
                {detail.title}
              </h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <PageAutoRefresh
            enabled={statusType === "live"}
            intervalMs={20_000}
          />

          <StatusBadge status={detail.status} />

          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                <TeamFlag
                  name={detail.team1.name}
                  shortName={detail.team1.shortName}
                  flagUrl={detail.team1.flagUrl}
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {detail.team1.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {detail.team1.score || "-"}
                </span>
              </div>

              <span className="text-sm font-semibold text-gray-500">vs</span>

              <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                <TeamFlag
                  name={detail.team2.name}
                  shortName={detail.team2.shortName}
                  flagUrl={detail.team2.flagUrl}
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {detail.team2.name}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {detail.team2.score || "-"}
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Series" value={detail.series} />
              <SummaryCard label="Match" value={detail.matchDesc} />
              <SummaryCard label="Format" value={detail.format} />
              <SummaryCard label="State" value={detail.state} />
              <SummaryCard label="Toss" value={detail.toss} />
              <SummaryCard label="Venue" value={detail.venue} />
              <SummaryCard label="Start Time" value={detail.startTime} />
              <SummaryCard label="Status" value={detail.status} />
            </div>
          </section>

          {showLiveCenter && detail.liveState ? (
            <LiveCenterCard liveState={detail.liveState} />
          ) : null}

          <section className="mt-6 space-y-5">
            {detail.innings.length > 0 ? (
              detail.innings.map((innings, index) => (
                <InningsCard
                  key={`innings-${innings.inningsId}-${index}`}
                  innings={innings}
                  index={index}
                />
              ))
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                Scorecard not available yet.
              </div>
            )}
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <SquadTable
              title={`${detail.team1.name} Players`}
              players={detail.team1Players}
            />
            <SquadTable
              title={`${detail.team2.name} Players`}
              players={detail.team2Players}
            />
          </section>
        </main>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Failed to load match details
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Back to matches
          </Link>
        </div>
      </div>
    );
  }
}
