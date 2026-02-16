import type { MatchLiveState } from "@/lib/types";

function BallChip({
  value,
  kind,
}: {
  value: string;
  kind: MatchLiveState["currentOverBalls"][number]["kind"];
}) {
  const kindStyle: Record<typeof kind, string> = {
    wicket: "border-rose-400/35 bg-rose-500/15 text-rose-100",
    four: "border-sky-400/30 bg-sky-500/15 text-sky-100",
    six: "border-amber-300/30 bg-amber-500/15 text-amber-100",
    extra: "border-violet-400/30 bg-violet-500/15 text-violet-100",
    dot: "border-slate-400/25 bg-slate-500/15 text-slate-200",
    run: "border-emerald-400/25 bg-emerald-500/15 text-emerald-100",
    other: "border-slate-400/25 bg-slate-500/15 text-slate-200",
  };

  return (
    <span
      className={`inline-flex min-w-6 items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${kindStyle[kind]}`}
    >
      {value}
    </span>
  );
}

export function LiveCenter({ liveState }: { liveState: MatchLiveState }) {
  return (
    <section className="rounded-xl border border-emerald-400/20 bg-emerald-500/8 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-emerald-100">Live Centre</h3>
        <p className="text-[10px] tabular-nums text-emerald-200/70">
          Over: {liveState.currentOverLabel || "-"}
        </p>
      </div>

      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
        <div className="rounded-lg border border-white/8 bg-black/20 p-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">
            Current Batters
          </p>
          {liveState.batters.length > 0 ? (
            <ul className="mt-1.5 space-y-1 text-[10px] text-slate-200">
              {liveState.batters.map((batter) => (
                <li
                  key={`${batter.id}-${batter.name}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    {batter.name}
                    {batter.onStrike ? " *" : ""}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-100">
                    {batter.runs} ({batter.balls})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[10px] text-slate-400">-</p>
          )}
        </div>

        <div className="rounded-lg border border-white/8 bg-black/20 p-2">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">
            Current Bowler
          </p>
          {liveState.bowler ? (
            <div className="mt-1.5 text-[10px] text-slate-200">
              <p className="font-medium">{liveState.bowler.name}</p>
              <p className="mt-0.5 tabular-nums text-slate-300">
                {liveState.bowler.overs} O · {liveState.bowler.maidens} M ·{" "}
                {liveState.bowler.runs} R · {liveState.bowler.wickets} W
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-[10px] text-slate-400">-</p>
          )}

          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded-md border border-white/8 bg-white/4 p-1.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">
                RR
              </p>
              <p className="mt-0.5 tabular-nums text-slate-200">{liveState.currentRunRate || "-"}</p>
            </div>
            <div className="rounded-md border border-white/8 bg-white/4 p-1.5">
              <p className="text-[9px] uppercase tracking-wider text-slate-400">
                Req RR
              </p>
              <p className="mt-0.5 tabular-nums text-slate-200">{liveState.requiredRunRate || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-white/8 bg-black/20 p-2">
        <p className="text-[9px] uppercase tracking-wider text-slate-400">
          Recent Balls
        </p>
        {liveState.currentOverBalls.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {liveState.currentOverBalls.map((ball, index) => (
              <BallChip
                key={`${ball.label}-${ball.value}-${index}`}
                value={ball.value}
                kind={ball.kind}
              />
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-[10px] text-slate-400">-</p>
        )}
      </div>
    </section>
  );
}
