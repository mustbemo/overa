import type { MatchInnings } from "@/lib/types";

export function InningsCard({ innings }: { innings: MatchInnings }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2.5">
        <h3 className="truncate text-sm font-semibold text-slate-100">
          {innings.battingTeam}
        </h3>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-100">
            {innings.scoreLine || "-"}
          </p>
          <p className="text-[11px] text-slate-300/80">RR {innings.runRate || "-"}</p>
        </div>
      </header>

      <div className="space-y-3 px-3 py-3 text-xs">
        <div className="grid gap-1 text-slate-300/90">
          <p>
            Bowling Team: <span className="text-slate-100">{innings.bowlingTeam || "-"}</span>
          </p>
          <p>
            Extras: <span className="text-slate-100">{innings.extrasLine || "-"}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300/80">
                <th className="py-1.5 pr-2 font-medium">Batter</th>
                <th className="py-1.5 px-1 text-right font-medium">R</th>
                <th className="py-1.5 px-1 text-right font-medium">B</th>
                <th className="py-1.5 px-1 text-right font-medium">4s</th>
                <th className="py-1.5 px-1 text-right font-medium">6s</th>
                <th className="py-1.5 pl-1 text-right font-medium">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batsmen.map((batter, index) => (
                <tr
                  key={`${innings.inningsId}-${batter.name}-${index}`}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-1.5 pr-2 text-slate-100">
                    <p className="font-medium">{batter.name}</p>
                    <p className="text-[10px] text-slate-300/75">{batter.dismissal || "-"}</p>
                  </td>
                  <td className="px-1 py-1.5 text-right text-slate-100">{batter.runs}</td>
                  <td className="px-1 py-1.5 text-right text-slate-200">{batter.balls}</td>
                  <td className="px-1 py-1.5 text-right text-slate-200">{batter.fours}</td>
                  <td className="px-1 py-1.5 text-right text-slate-200">{batter.sixes}</td>
                  <td className="pl-1 py-1.5 text-right text-slate-200">{batter.strikeRate}</td>
                </tr>
              ))}
              {innings.batsmen.length === 0 ? (
                <tr>
                  <td className="py-2 text-slate-300/80" colSpan={6}>
                    Batting card not available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300/80">
                <th className="py-1.5 pr-2 font-medium">Bowler</th>
                <th className="py-1.5 px-1 text-right font-medium">O</th>
                <th className="py-1.5 px-1 text-right font-medium">M</th>
                <th className="py-1.5 px-1 text-right font-medium">R</th>
                <th className="py-1.5 px-1 text-right font-medium">W</th>
                <th className="py-1.5 pl-1 text-right font-medium">ECO</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlers.map((bowler, index) => (
                <tr
                  key={`${innings.inningsId}-${bowler.name}-${index}`}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-1.5 pr-2 text-slate-100">{bowler.name}</td>
                  <td className="px-1 py-1.5 text-right text-slate-200">{bowler.overs}</td>
                  <td className="px-1 py-1.5 text-right text-slate-200">{bowler.maidens}</td>
                  <td className="px-1 py-1.5 text-right text-slate-200">{bowler.runs}</td>
                  <td className="px-1 py-1.5 text-right text-slate-100">{bowler.wickets}</td>
                  <td className="pl-1 py-1.5 text-right text-slate-200">{bowler.economy}</td>
                </tr>
              ))}
              {innings.bowlers.length === 0 ? (
                <tr>
                  <td className="py-2 text-slate-300/80" colSpan={6}>
                    Bowling card not available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300/80">
            Fall of Wickets
          </p>
          <p className="mt-1 text-xs text-slate-200">
            {innings.fallOfWickets.length > 0
              ? innings.fallOfWickets.join(" • ")
              : "No wickets recorded."}
          </p>
        </div>
      </div>
    </article>
  );
}
