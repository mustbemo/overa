import { Suspense } from "react";
import { LoadingState } from "@/components/cricket/loading-state";
import { SubscribePageClient } from "./subscribe-page-client";

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="h-screen w-screen bg-transparent p-0.5">
          <section className="h-full w-full rounded-[18px] border border-white/16 bg-zinc-950/92 p-3">
            <LoadingState message="Loading subscribe screen..." />
          </section>
        </main>
      }
    >
      <SubscribePageClient />
    </Suspense>
  );
}
