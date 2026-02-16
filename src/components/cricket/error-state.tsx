import { AlertTriangle } from "lucide-react";

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-400/25 bg-rose-500/8 p-3 text-[11px] text-rose-100">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-rose-100/70">{message}</p>
          {onRetry ? (
            <button
              type="button"
              className="mt-2 rounded-md border border-rose-300/40 px-2.5 py-0.5 text-[10px] font-medium text-rose-50 transition hover:bg-rose-500/12"
              onClick={onRetry}
              data-no-drag
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
