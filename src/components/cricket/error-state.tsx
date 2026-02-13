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
    <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-rose-100/80">{message}</p>
          {onRetry ? (
            <button
              type="button"
              className="mt-3 rounded-lg border border-rose-300/50 px-3 py-1 text-xs font-semibold text-rose-50 transition hover:bg-rose-500/15"
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
