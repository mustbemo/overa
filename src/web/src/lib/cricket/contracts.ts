import type { MatchDetailData, MatchesData } from "@/lib/types";

export type CricketApiErrorCode =
  | "BAD_REQUEST"
  | "UPSTREAM_FETCH_FAILED"
  | "PARSE_FAILED"
  | "INTERNAL_ERROR";

export type CricketApiError = {
  code: CricketApiErrorCode;
  message: string;
};

export type ApiSuccess<T> = {
  ok: true;
  generatedAt: string;
  data: T;
};

export type ApiFailure = {
  ok: false;
  generatedAt: string;
  error: CricketApiError;
};

export type MatchesApiResponse = ApiSuccess<MatchesData> | ApiFailure;

export type MatchDetailApiResponse = ApiSuccess<MatchDetailData> | ApiFailure;
