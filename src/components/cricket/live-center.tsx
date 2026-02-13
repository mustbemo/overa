import type { MatchLiveState } from "@/lib/types";

function BallChip({
  value,
  kind,
}: {
  value: string;
  kind: MatchLiveState["currentOverBalls"][number]["kind"];
}) {
  const kindStyle: Record<typeof kind, string> = {
    wicket: "border-rose-400/40 bg-rose-500/20 text-rose-100",
    four: "border-sky-400/35 bg-sky-500/20 text-sky-100",
    six: "border-amber-300/35 bg-amber-500/20 text-amber-100",
    extra: "border-violet-400/35 bg-violet-500/20 text-violet-100",
    dot: "border-slate-400/30 bg-slate-500/20 text-slate-100",
    run: "border-emerald-400/30 bg-emerald-500/20 text-emerald-100",
    other: "border-slate-400/30 bg-slate-500/20 text-slate-100",
  };

  return (
    <span
      className={`inline-flex min-w-7 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold ${kindStyle[kind]}`}
    >
      {value}
    </span>
  );
}

export function LiveCenter({ liveState }: { liveState: MatchLiveState }) {
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-emerald-100">Live Centre</h3>
        <p className="text-xs text-emerald-100/80">
          Over: {liveState.currentOverLabel || "-"}
        </p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
            Current Batters
          </p>
          {liveState.batters.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs text-slate-100">
              {liveState.batters.map((batter) => (
                <li
                  key={`${batter.id}-${batter.name}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    {batter.name}
                    {batter.onStrike ? " *" : ""}
                  </span>
                  <span className="shrink-0 text-slate-200">
                    {batter.runs} ({batter.balls})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-300/75">Not available</p>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
            Current Bowler
          </p>
          {liveState.bowler ? (
            <div className="mt-2 text-xs text-slate-100">
              <p className="font-semibold">{liveState.bowler.name}</p>
              <p className="mt-1 text-slate-200">
                {liveState.bowler.overs} O | {liveState.bowler.maidens} M |{" "}
                {liveState.bowler.runs} R | {liveState.bowler.wickets} W
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-300/75">Not available</p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
                RR
              </p>
              <p className="mt-1 text-slate-100">{liveState.currentRunRate || "-"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
                Req RR
              </p>
              <p className="mt-1 text-slate-100">{liveState.requiredRunRate || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-300/75">
          Recent Balls
        </p>
        {liveState.currentOverBalls.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {liveState.currentOverBalls.map((ball, index) => (
              <BallChip
                key={`${ball.label}-${ball.value}-${index}`}
                value={ball.value}
                kind={ball.kind}
              />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-300/75">Not available</p>
        )}
      </div>
    </section>
  );
}
