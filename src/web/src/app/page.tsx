import { MatchesView } from "@/components/matches-view";
import { getMatchesData } from "@/lib/cricket-scraper";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const data = await getMatchesData();

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <title>Cricket Ball</title>
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="M6 12c0-1.5.5-3 1.5-4.2M18 12c0 1.5-.5 3-1.5 4.2"
                    stroke="white"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                CricLive
              </h1>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-600">
              Live Cricket Scores
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <MatchesView data={data} />
        </main>
      </div>
    );
  } catch (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
        <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            CricLive
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error instanceof Error
              ? `Failed to fetch match data: ${error.message}`
              : "Failed to fetch match data."}
          </p>
        </div>
      </main>
    );
  }
}
