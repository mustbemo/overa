import { Suspense } from "react";
import { LoadingState } from "@/components/cricket/loading-state";
import { SubscribePageClient } from "./subscribe-page-client";

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen w-screen items-center justify-center bg-transparent p-2">
          <section className="glass-frame w-full rounded-[26px] border border-white/20 bg-slate-950/70 p-4">
            <LoadingState message="Loading subscribe screen..." />
          </section>
        </main>
      }
    >
      <SubscribePageClient />
    </Suspense>
  );
}
