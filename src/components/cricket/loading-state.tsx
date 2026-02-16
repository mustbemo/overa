import { Loader2 } from "lucide-react";

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 text-[11px] text-slate-300">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
