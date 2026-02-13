import type { MatchDetailData, MatchInnings } from "@/lib/types";

function CompactTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
      <table className="w-full min-w-[320px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-white/10 text-slate-300/80">
            {headers.map((header) => (
              <th key={header} className="px-2 py-1.5 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/5 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="px-2 py-1.5 text-slate-100">
                  {cell || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getActiveInnings(detail: MatchDetailData): MatchInnings | null {
  return (
    [...detail.innings]
      .reverse()
      .find((entry) => entry.batsmen.length > 0 || entry.bowlers.length > 0) ??
    detail.innings.at(-1) ??
    null
  );
}

export function WidgetExpanded({
  detail,
  partnership,
}: {
  detail: MatchDetailData;
  partnership: string;
}) {
  const innings = getActiveInnings(detail);

  const batterRows =
    innings?.batsmen.map((batter) => [
      batter.name,
      `${batter.runs}(${batter.balls})`,
      batter.strikeRate,
      `${batter.fours}/${batter.sixes}`,
    ]) ?? [];

  const bowlerRows =
    innings?.bowlers.map((bowler) => [
      bowler.name,
      bowler.overs,
      bowler.runs,
      bowler.wickets,
      bowler.economy,
    ]) ?? [];

  const recentBallValues =
    detail.liveState?.currentOverBalls.map((ball) => ball.value).join(" ") || "-";

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
            Partnership
          </p>
          <p className="mt-1 text-slate-100">{partnership}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
            Run Rate
          </p>
          <p className="mt-1 text-slate-100">{detail.liveState?.currentRunRate || "-"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
            Required Rate
          </p>
          <p className="mt-1 text-slate-100">{detail.liveState?.requiredRunRate || "-"}</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300/80">
          Batting Breakdown
        </p>
        {batterRows.length > 0 ? (
          <CompactTable
            headers={["Batter", "R(B)", "SR", "4s/6s"]}
            rows={batterRows}
          />
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300/75">
            Batting breakdown unavailable.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300/80">
          Bowling Breakdown
        </p>
        {bowlerRows.length > 0 ? (
          <CompactTable
            headers={["Bowler", "O", "R", "W", "ECO"]}
            rows={bowlerRows}
          />
        ) : (
          <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300/75">
            Bowling breakdown unavailable.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs">
        <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
          Recent Balls
        </p>
        <p className="mt-1 text-slate-100">{recentBallValues}</p>
      </div>
    </section>
  );
}
