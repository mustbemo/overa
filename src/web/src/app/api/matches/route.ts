import { NextResponse } from "next/server";
import { getMatchesData } from "@/lib/cricket";
import type { MatchesApiResponse } from "@/lib/cricket/contracts";
import { toApiError } from "@/lib/cricket/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMatchesData();
    const response: MatchesApiResponse = {
      ok: true,
      generatedAt: new Date().toISOString(),
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    const apiError = toApiError(error);
    const response: MatchesApiResponse = {
      ok: false,
      generatedAt: new Date().toISOString(),
      error: {
        code: apiError.code,
        message: apiError.message,
      },
    };

    return NextResponse.json(response, { status: apiError.status });
  }
}
