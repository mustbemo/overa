"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getMatchDetail, getMatchesData } from "@/lib/cricket";
import { getStatusType } from "@/lib/cricket-ui";
import type { MatchDetailData, MatchesData } from "@/lib/types";

const REFRESH_INTERVAL_MS = 30_000;

export function useMatchesQuery(): UseQueryResult<MatchesData, Error> {
  return useQuery({
    queryKey: ["cricket", "matches"],
    queryFn: getMatchesData,
    staleTime: 25_000,
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });
}

export function useMatchDetailQuery(
  matchId: string,
): UseQueryResult<MatchDetailData, Error> {
  return useQuery({
    queryKey: ["cricket", "match", matchId],
    queryFn: () => getMatchDetail(matchId),
    enabled: Boolean(matchId),
    staleTime: 25_000,
    refetchInterval: (query) => {
      const status = query.state.data?.status ?? "";

      if (!status) {
        return REFRESH_INTERVAL_MS;
      }

      return getStatusType(status) === "live" ? REFRESH_INTERVAL_MS : false;
    },
    refetchIntervalInBackground: true,
  });
}
