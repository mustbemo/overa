import { Loader2 } from "lucide-react";

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-slate-200">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
