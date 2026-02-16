import type { MatchInnings } from "@/lib/types";

export function InningsCard({ innings }: { innings: MatchInnings }) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.04]">
      <header className="flex items-center justify-between gap-2 border-b border-white/8 bg-white/[0.03] px-2.5 py-2">
        <h3 className="truncate text-[12px] font-medium text-slate-100">
          {innings.battingTeam}
        </h3>
        <div className="text-right">
          <p className="text-[12px] font-semibold tabular-nums text-slate-50">
            {innings.scoreLine || "-"}
          </p>
          <p className="text-[10px] tabular-nums text-slate-400">RR {innings.runRate || "-"}</p>
        </div>
      </header>

      <div className="space-y-2.5 px-2.5 py-2.5 text-[11px]">
        <div className="grid gap-0.5 text-[10px] text-slate-400">
          <p>
            Bowling Team: <span className="text-slate-200">{innings.bowlingTeam || "-"}</span>
          </p>
          <p>
            Extras: <span className="text-slate-200">{innings.extrasLine || "-"}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] border-collapse text-left text-[10px]">
            <thead>
              <tr className="border-b border-white/8 text-slate-400">
                <th className="py-1 pr-2 font-medium">Batter</th>
                <th className="px-1 py-1 text-right font-medium">R</th>
                <th className="px-1 py-1 text-right font-medium">B</th>
                <th className="px-1 py-1 text-right font-medium">4s</th>
                <th className="px-1 py-1 text-right font-medium">6s</th>
                <th className="py-1 pl-1 text-right font-medium">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batsmen.map((batter, index) => (
                <tr
                  key={`${innings.inningsId}-${batter.name}-${index}`}
                  className="border-b border-white/4 last:border-0"
                >
                  <td className="py-1 pr-2 text-slate-200">
                    <p className="font-medium">{batter.name}</p>
                    <p className="text-[9px] text-slate-400/70">{batter.dismissal || "-"}</p>
                  </td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-100">{batter.runs}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-300">{batter.balls}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-300">{batter.fours}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-300">{batter.sixes}</td>
                  <td className="py-1 pl-1 text-right tabular-nums text-slate-300">{batter.strikeRate}</td>
                </tr>
              ))}
              {innings.batsmen.length === 0 ? (
                <tr>
                  <td className="py-1.5 text-slate-400" colSpan={6}>
                    Batting card not available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-left text-[10px]">
            <thead>
              <tr className="border-b border-white/8 text-slate-400">
                <th className="py-1 pr-2 font-medium">Bowler</th>
                <th className="px-1 py-1 text-right font-medium">O</th>
                <th className="px-1 py-1 text-right font-medium">M</th>
                <th className="px-1 py-1 text-right font-medium">R</th>
                <th className="px-1 py-1 text-right font-medium">W</th>
                <th className="py-1 pl-1 text-right font-medium">ECO</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.map((bowler, index) => (
                <tr
                  key={`${innings.inningsId}-${bowler.name}-${index}`}
                  className="border-b border-white/4 last:border-0"
                >
                  <td className="py-1 pr-2 text-slate-200">{bowler.name}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-300">{bowler.overs}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-300">{bowler.maidens}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-300">{bowler.runs}</td>
                  <td className="px-1 py-1 text-right tabular-nums text-slate-100">{bowler.wickets}</td>
                  <td className="py-1 pl-1 text-right tabular-nums text-slate-300">{bowler.economy}</td>
                </tr>
              ))}
              {innings.bowlers.length === 0 ? (
                <tr>
                  <td className="py-1.5 text-slate-400" colSpan={6}>
                    Bowling card not available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
            Fall of Wickets
          </p>
          <p className="mt-0.5 text-[10px] text-slate-300">
            {innings.fallOfWickets.length > 0
              ? innings.fallOfWickets.join(" · ")
              : "No wickets recorded."}
          </p>
        </div>
      </div>
    </article>
  );
}
