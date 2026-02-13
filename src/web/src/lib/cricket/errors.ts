import type { CricketApiError } from "./contracts";

export type ApiErrorPayload = CricketApiError & {
  status: number;
};

function mapMessageToCode(message: string): ApiErrorPayload {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid match id")) {
    return {
      code: "BAD_REQUEST",
      message: "Invalid match id provided.",
      status: 400,
    };
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("unable to fetch") ||
    normalized.includes("could not fetch")
  ) {
    return {
      code: "UPSTREAM_FETCH_FAILED",
      message: "Could not fetch cricket data from upstream source.",
      status: 502,
    };
  }

  if (normalized.includes("parse") || normalized.includes("json")) {
    return {
      code: "PARSE_FAILED",
      message: "Could not parse upstream cricket payload.",
      status: 502,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unexpected server error while processing cricket data.",
    status: 500,
  };
}

export function toApiError(error: unknown): ApiErrorPayload {
  if (error instanceof Error) {
    return mapMessageToCode(error.message);
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Unknown server error.",
    status: 500,
  };
}
